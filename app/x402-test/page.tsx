'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import WalletConnect from '@/components/UI/WalletConnect';

interface PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  payTo: string;
  asset: string;
  extra?: any;
}

export default function X402TestPage() {
  const { isConnected, address, walletType, evmChainId } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Use the NEW x402-pay endpoint that uses official x402-next
  const testEndpoints = [
    { 
      name: 'Priority Fees (Research API)', 
      url: '/api/x402-pay/tl/tl-research/api/queries/13448/results.json',
      description: 'Solana priority fees - $0.0005 USDC'
    },
    { 
      name: 'Top Traders', 
      url: '/api/x402-pay/top-traders/FeWzdSFg17ws4rQmWyBdcimo6Naxnw6jYwEzbhXM9P5',
      description: 'Top traders for a token - $0.001 USDC'
    },
    { 
      name: 'Top Holders', 
      url: '/api/x402-pay/top-holders/FeWzdSFg17ws4rQmWyBdcimo6Naxnw6jYwEzbhXM9P5',
      description: 'Top holders for a token - $0.001 USDC'
    },
  ];

  // Generate random nonce (bytes32 for EVM)
  const generateNonce = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return '0x' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Create EVM (Base Sepolia) payment - EIP-3009 TransferWithAuthorization
  const createEvmPayment = async (requirement: PaymentRequirement): Promise<string> => {
    if (!address) throw new Error('Wallet not connected');
    
    const ethereum = (window as any).ethereum;
    if (!ethereum) throw new Error('No Ethereum wallet found');
    
    const now = Math.floor(Date.now() / 1000);
    const validAfter = 0;
    const validBefore = now + 300; // 5 minutes from now
    const nonce = generateNonce();
    
    // EIP-712 domain for USDC
    const domain = {
      name: requirement.extra?.name || 'USD Coin',
      version: requirement.extra?.version || '2',
      chainId: evmChainId || 84532,
      verifyingContract: requirement.asset,
    };
    
    // EIP-3009 TransferWithAuthorization types
    const types = {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    };
    
    // Authorization message - must use BigInt compatible values
    const authorization = {
      from: address,
      to: requirement.payTo,
      value: requirement.maxAmountRequired,
      validAfter: validAfter,
      validBefore: validBefore,
      nonce: nonce,
    };
    
    addLog(`💳 [EVM] Signing EIP-3009 TransferWithAuthorization...`);
    addLog(`   From: ${address}`);
    addLog(`   To: ${requirement.payTo}`);
    addLog(`   Value: ${requirement.maxAmountRequired} atomic units ($${parseInt(requirement.maxAmountRequired) / 1_000_000})`);
    addLog(`   Asset: ${requirement.asset}`);
    addLog(`   Chain ID: ${evmChainId || 84532}`);
    
    const msgParams = JSON.stringify({ 
      domain, 
      types, 
      primaryType: 'TransferWithAuthorization', 
      message: authorization 
    });
    
    const signature = await ethereum.request({
      method: 'eth_signTypedData_v4',
      params: [address, msgParams],
    });
    
    addLog(`✅ Signature: ${signature.substring(0, 20)}...`);
    
    // Create payload in exact x402 format expected by facilitator
    const payload = {
      signature: signature,
      authorization: {
        from: address,
        to: requirement.payTo,
        value: requirement.maxAmountRequired,
        validAfter: validAfter.toString(),
        validBefore: validBefore.toString(),
        nonce: nonce,
      },
    };
    
    const paymentHeader = {
      x402Version: 1,
      scheme: 'exact',
      network: requirement.network,
      payload,
    };
    
    addLog(`📦 Payment payload created for ${requirement.network}`);
    
    return btoa(JSON.stringify(paymentHeader));
  };

  // Create Solana payment - Pre-signed SPL token transfer transaction
  const createSolanaPayment = async (requirement: PaymentRequirement): Promise<string> => {
    if (!address) throw new Error('Wallet not connected');
    
    const solana = (window as any).solana || (window as any).phantom?.solana;
    if (!solana) throw new Error('No Solana wallet found. Please install Phantom.');
    
    addLog(`💳 [Solana] Creating SPL token transfer transaction...`);
    addLog(`   From: ${address}`);
    addLog(`   To: ${requirement.payTo}`);
    addLog(`   Value: ${requirement.maxAmountRequired} atomic units ($${parseInt(requirement.maxAmountRequired) / 1_000_000})`);
    addLog(`   Asset (USDC): ${requirement.asset}`);
    
    const feePayer = requirement.extra?.feePayer;
    if (!feePayer) {
      throw new Error('No fee payer provided by facilitator. Cannot create Solana transaction.');
    }
    addLog(`   Fee Payer: ${feePayer}`);
    
    try {
      // Import Solana web3.js dynamically
      const { 
        Connection, 
        PublicKey, 
        Transaction, 
        SystemProgram,
        LAMPORTS_PER_SOL
      } = await import('@solana/web3.js');
      
      const {
        getAssociatedTokenAddress,
        createTransferCheckedInstruction,
        TOKEN_PROGRAM_ID,
        getAccount,
      } = await import('@solana/spl-token');
      
      // Connect to Solana devnet
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      addLog(`   Connected to Solana Devnet`);
      
      // Get public keys
      const fromPubkey = new PublicKey(address);
      const toPubkey = new PublicKey(requirement.payTo);
      const mintPubkey = new PublicKey(requirement.asset);
      const feePayerPubkey = new PublicKey(feePayer);
      
      // Get associated token accounts
      addLog(`   Finding token accounts...`);
      const fromTokenAccount = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
      const toTokenAccount = await getAssociatedTokenAddress(mintPubkey, toPubkey);
      
      addLog(`   From token account: ${fromTokenAccount.toBase58()}`);
      addLog(`   To token account: ${toTokenAccount.toBase58()}`);
      
      // Check if source account exists and has balance
      try {
        addLog(`   Checking token account balance...`);
        const accountInfo = await getAccount(connection, fromTokenAccount);
        addLog(`   ✅ Token balance: ${accountInfo.amount.toString()} atomic units`);
        
        if (BigInt(accountInfo.amount.toString()) < BigInt(requirement.maxAmountRequired)) {
          throw new Error(`Insufficient USDC balance. Have: ${accountInfo.amount.toString()}, Need: ${requirement.maxAmountRequired}`);
        }
      } catch (e: any) {
        const errorMsg = e?.message || e?.toString() || JSON.stringify(e);
        addLog(`   ⚠️ Token account check error: ${errorMsg}`);
        
        if (errorMsg.includes('could not find account') || errorMsg.includes('TokenAccountNotFoundError')) {
          throw new Error(
            'No devnet USDC token account found for your wallet.\n\n' +
            'To get devnet USDC:\n' +
            '1. Go to https://faucet.circle.com/\n' +
            '2. Select "Solana" and "Devnet"\n' +
            '3. Enter your wallet address: ' + address + '\n' +
            '4. Request USDC tokens'
          );
        }
        throw new Error(`Token account error: ${errorMsg}`);
      }
      
      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      addLog(`   Blockhash: ${blockhash.substring(0, 20)}...`);
      
      // Create transfer instruction
      // USDC has 6 decimals
      const transferInstruction = createTransferCheckedInstruction(
        fromTokenAccount,     // source
        mintPubkey,           // mint
        toTokenAccount,       // destination
        fromPubkey,           // owner
        BigInt(requirement.maxAmountRequired), // amount
        6                     // decimals (USDC)
      );
      
      // Create transaction
      const transaction = new Transaction();
      transaction.add(transferInstruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = feePayerPubkey; // Facilitator pays fees
      
      addLog(`   Requesting wallet signature...`);
      
      // Sign the transaction with user's wallet
      const signedTransaction = await solana.signTransaction(transaction);
      
      addLog(`✅ Transaction signed!`);
      
      // Serialize the signed transaction
      const serializedTransaction = signedTransaction.serialize({
        requireAllSignatures: false, // Fee payer hasn't signed yet
        verifySignatures: false,
      });
      
      // Encode as base64
      const transactionBase64 = Buffer.from(serializedTransaction).toString('base64');
      addLog(`   Transaction serialized (${transactionBase64.length} chars)`);
      
      // Create x402 payment payload
      const payload = {
        transaction: transactionBase64,
      };
      
      const paymentHeader = {
        x402Version: 1,
        scheme: 'exact',
        network: requirement.network,
        payload,
      };
      
      addLog(`📦 Payment payload created for ${requirement.network}`);
      
      return btoa(JSON.stringify(paymentHeader));
      
    } catch (error: any) {
      const errorMsg = error?.message || error?.toString() || JSON.stringify(error);
      addLog(`❌ [Solana] Error: ${errorMsg}`);
      
      // Add helpful context for common errors
      if (errorMsg.includes('TokenAccountNotFoundError') || errorMsg.includes('could not find account')) {
        addLog(`💡 Tip: You need devnet USDC. Visit https://faucet.circle.com/`);
      }
      
      throw error;
    }
  };

  // Create and sign payment based on wallet type
  const createAndSignPayment = async (requirement: PaymentRequirement): Promise<string> => {
    if (requirement.network === 'base-sepolia' || requirement.network === 'base') {
      return createEvmPayment(requirement);
    } else if (requirement.network === 'solana-devnet' || requirement.network === 'solana') {
      return createSolanaPayment(requirement);
    }
    throw new Error(`Unsupported network: ${requirement.network}`);
  };

  const callX402Api = async (endpoint: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    addLog(`🚀 Calling x402 API: ${endpoint}`);

    try {
      // First call without payment to get requirements
      addLog('📡 Making initial request (no payment)...');
      const response = await fetch(endpoint);
      
      addLog(`📥 Response status: ${response.status}`);

      if (response.status === 402) {
        // Payment required
        addLog('💳 Payment required! Parsing payment options...');
        const paymentResponse = await response.json();
        
        addLog(`💰 Found ${paymentResponse.accepts.length} payment options`);
        paymentResponse.accepts.forEach((r: PaymentRequirement, i: number) => {
          addLog(`   ${i + 1}. ${r.network}: $${parseInt(r.maxAmountRequired) / 1_000_000} USDC`);
        });
        
        if (!isConnected) {
          setError('Please connect a wallet first');
          addLog('❌ No wallet connected');
          return;
        }
        
        // Find matching requirement for connected wallet type
        let selectedRequirement: PaymentRequirement | undefined;
        
        if (walletType === 'evm') {
          selectedRequirement = paymentResponse.accepts.find(
            (r: PaymentRequirement) => r.network === 'base-sepolia' || r.network === 'base'
          );
          if (!selectedRequirement) {
            throw new Error('No EVM payment option available');
          }
        } else if (walletType === 'solana') {
          selectedRequirement = paymentResponse.accepts.find(
            (r: PaymentRequirement) => r.network === 'solana-devnet' || r.network === 'solana'
          );
          if (!selectedRequirement) {
            throw new Error('No Solana payment option available');
          }
        } else {
          throw new Error('Unsupported wallet type');
        }
        
        addLog(`💳 Using: ${selectedRequirement.network} - $${parseInt(selectedRequirement.maxAmountRequired) / 1_000_000} USDC`);
        
        // Create and sign payment
        addLog('🔐 Creating payment signature...');
        const paymentHeader = await createAndSignPayment(selectedRequirement);
        
        addLog('📡 Sending request with payment...');
        
        // Retry with payment
        const paidResponse = await fetch(endpoint, {
          headers: {
            'X-PAYMENT': paymentHeader,
          },
        });
        
        addLog(`📥 Response status: ${paidResponse.status}`);
        
        if (paidResponse.status === 402) {
          const errorData = await paidResponse.json();
          throw new Error(errorData.error || 'Payment verification failed');
        }
        
        if (!paidResponse.ok) {
          throw new Error(`Request failed: ${paidResponse.status}`);
        }
        
        // Check for payment response header
        const paymentResponseHeader = paidResponse.headers.get('X-PAYMENT-RESPONSE');
        if (paymentResponseHeader) {
          try {
            const settlement = JSON.parse(atob(paymentResponseHeader));
            addLog(`🎉 Payment settled!`);
            addLog(`   TX: ${settlement.transaction || settlement.txHash}`);
            addLog(`   Network: ${settlement.network}`);
            if (settlement.payer) addLog(`   Payer: ${settlement.payer}`);
          } catch (e) {
            addLog('⚠️ Could not parse payment response');
          }
        }
        
        const data = await paidResponse.json();
        addLog('✅ Data received after payment!');
        setResult(data);
        return;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      addLog('✅ Data received (no payment needed)');
      setResult(data);

    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">x402 Payment Test</h1>
        <p className="text-gray-600 mb-2">Test REAL crypto payments for API access</p>
        <p className="text-sm text-orange-600 mb-8">
          ⚠️ Requires testnet USDC on Base Sepolia. Get some from{' '}
          <a href="https://faucet.circle.com/" target="_blank" className="underline">Circle Faucet</a>
        </p>

        {/* Wallet Connection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">1. Connect Wallet</h2>
          <div className="flex items-center gap-4">
            <WalletConnect />
            {isConnected && (
              <div className="text-sm flex items-center gap-2">
                {walletType === 'evm' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-blue-600">
                      ✓ EVM (MetaMask): {address?.slice(0, 8)}...{address?.slice(-6)}
                    </span>
                    {evmChainId && (
                      <span className={`text-xs px-2 py-0.5 rounded ${evmChainId === 84532 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        Chain: {evmChainId} {evmChainId === 84532 ? '(Base Sepolia ✓)' : '(Switch to Base Sepolia!)'}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span className="text-purple-600">
                      ✓ Solana (Phantom): {address?.slice(0, 8)}...{address?.slice(-6)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                      Devnet
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 font-medium mb-2">Supported wallets:</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 bg-blue-50 rounded border border-blue-200">
                <p className="font-medium text-blue-800">⟠ MetaMask (EVM)</p>
                <p className="text-blue-600 text-xs">Base Sepolia • USDC</p>
                <a href="https://faucet.circle.com/" target="_blank" className="text-blue-500 text-xs underline">Get testnet USDC →</a>
              </div>
              <div className="p-2 bg-purple-50 rounded border border-purple-200">
                <p className="font-medium text-purple-800">◎ Phantom (Solana)</p>
                <p className="text-purple-600 text-xs">Devnet • USDC</p>
                <a href="https://faucet.solana.com/" target="_blank" className="text-purple-500 text-xs underline">Get devnet SOL →</a>
              </div>
            </div>
          </div>
        </div>

        {/* Test Endpoints */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">2. Test API Endpoints (Real Payments)</h2>
          <div className="grid gap-4">
            {testEndpoints.map((endpoint, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{endpoint.name}</h3>
                    <p className="text-sm text-gray-500">{endpoint.description}</p>
                    <code className="text-xs text-gray-400 mt-1 block">{endpoint.url}</code>
                  </div>
                  <button
                    onClick={() => callX402Api(endpoint.url)}
                    disabled={loading || !isConnected}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Processing...' : 'Pay & Fetch'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logs */}
        <div className="bg-gray-900 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Console Logs</h2>
            <button onClick={() => setLogs([])} className="text-xs text-gray-400 hover:text-white">Clear</button>
          </div>
          <div className="font-mono text-sm text-green-400 h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">Logs will appear here...</p>
            ) : (
              logs.map((log, i) => <div key={i} className="py-0.5">{log}</div>)
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-green-600">✅ API Response (Paid with USDC)</h2>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
