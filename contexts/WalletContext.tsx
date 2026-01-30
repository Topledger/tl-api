'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X402Wallet, createEvmWallet, createSolanaWallet } from '@/lib/x402';

// Wallet types
type WalletType = 'none' | 'evm' | 'solana';

// Context interface
interface WalletContextType {
  // Connection state
  walletType: WalletType;
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  
  // EVM specific
  evmChainId: number | null;
  
  // Solana specific
  solanaPublicKey: string | null;
  
  // Actions
  connectEvmWallet: () => Promise<void>;
  connectSolanaWallet: () => Promise<void>;
  disconnect: () => void;
  
  // x402 integration
  getX402Wallet: () => X402Wallet | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

// EVM wallet state
interface EvmWalletState {
  address: string | null;
  chainId: number | null;
  signTypedData: ((params: any) => Promise<string>) | null;
}

// Solana wallet state
interface SolanaWalletState {
  publicKey: string | null;
  signMessage: ((message: Uint8Array) => Promise<Uint8Array>) | null;
  signTransaction: ((tx: any) => Promise<any>) | null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletType, setWalletType] = useState<WalletType>('none');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [evmState, setEvmState] = useState<EvmWalletState>({
    address: null,
    chainId: null,
    signTypedData: null,
  });
  
  const [solanaState, setSolanaState] = useState<SolanaWalletState>({
    publicKey: null,
    signMessage: null,
    signTransaction: null,
  });
  
  // Connect EVM wallet (using window.ethereum directly)
  const connectEvmWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      const ethereum = (window as any).ethereum;
      
      if (!ethereum) {
        throw new Error('No Ethereum wallet found. Please install MetaMask or another wallet.');
      }
      
      // Request accounts
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      
      // Get chain ID
      const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);
      
      // Create sign typed data function
      const signTypedData = async (params: any) => {
        const { domain, types, primaryType, message } = params;
        
        // Remove EIP712Domain from types if present (it's added automatically)
        const typesWithoutDomain = { ...types };
        delete typesWithoutDomain.EIP712Domain;
        
        const msgParams = JSON.stringify({
          domain,
          types: typesWithoutDomain,
          primaryType,
          message,
        });
        
        const signature = await ethereum.request({
          method: 'eth_signTypedData_v4',
          params: [address, msgParams],
        });
        
        return signature;
      };
      
      setEvmState({
        address,
        chainId,
        signTypedData,
      });
      
      setWalletType('evm');
      
      // Listen for account changes
      ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setEvmState({ address: null, chainId: null, signTypedData: null });
          setWalletType('none');
        } else {
          setEvmState(prev => ({ ...prev, address: accounts[0] }));
        }
      });
      
      // Listen for chain changes
      ethereum.on('chainChanged', (chainIdHex: string) => {
        setEvmState(prev => ({ ...prev, chainId: parseInt(chainIdHex, 16) }));
      });
      
    } catch (error) {
      console.error('Failed to connect EVM wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);
  
  // Connect Solana wallet
  const connectSolanaWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Check for Phantom or other Solana wallets
      const solana = (window as any).solana || (window as any).phantom?.solana;
      
      if (!solana) {
        throw new Error('No Solana wallet found. Please install Phantom or another Solana wallet.');
      }
      
      // Request connection
      const response = await solana.connect();
      const publicKey = response.publicKey.toString();
      
      setSolanaState({
        publicKey,
        signMessage: async (message: Uint8Array): Promise<Uint8Array> => {
          // Phantom returns { signature, publicKey }, we just need signature
          const result = await solana.signMessage(message, 'utf8');
          // Handle both formats: direct Uint8Array or { signature: Uint8Array }
          if (result instanceof Uint8Array) {
            return result;
          }
          if (result.signature instanceof Uint8Array) {
            return result.signature;
          }
          // If it's a different format, try to convert
          return new Uint8Array(result.signature || result);
        },
        signTransaction: (tx: any) => solana.signTransaction(tx),
      });
      
      setWalletType('solana');
      
      // Listen for disconnect
      solana.on('disconnect', () => {
        setSolanaState({ publicKey: null, signMessage: null, signTransaction: null });
        setWalletType('none');
      });
      
    } catch (error) {
      console.error('Failed to connect Solana wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);
  
  // Disconnect
  const disconnect = useCallback(() => {
    if (walletType === 'evm') {
      setEvmState({ address: null, chainId: null, signTypedData: null });
    } else if (walletType === 'solana') {
      const solana = (window as any).solana || (window as any).phantom?.solana;
      if (solana) {
        solana.disconnect();
      }
      setSolanaState({ publicKey: null, signMessage: null, signTransaction: null });
    }
    setWalletType('none');
  }, [walletType]);
  
  // Get x402 wallet adapter
  const getX402Wallet = useCallback((): X402Wallet | null => {
    if (walletType === 'evm' && evmState.address && evmState.signTypedData) {
      return createEvmWallet(
        evmState.address,
        evmState.signTypedData,
        evmState.chainId || 84532 // Default to Base Sepolia
      );
    }
    
    if (walletType === 'solana' && solanaState.publicKey && solanaState.signMessage) {
      return createSolanaWallet(
        solanaState.publicKey,
        solanaState.signTransaction || (async () => null),
        solanaState.signMessage
      );
    }
    
    return null;
  }, [walletType, evmState, solanaState]);
  
  // Compute derived state
  const address = walletType === 'evm' ? evmState.address : solanaState.publicKey;
  const isConnected = walletType !== 'none' && !!address;
  
  return (
    <WalletContext.Provider
      value={{
        walletType,
        address,
        isConnected,
        isConnecting,
        evmChainId: evmState.chainId,
        solanaPublicKey: solanaState.publicKey,
        connectEvmWallet,
        connectSolanaWallet,
        disconnect,
        getX402Wallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// Hook to use wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
