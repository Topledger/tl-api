// EVM Wallet Integration for x402
// Implements EIP-3009 transferWithAuthorization for USDC

import { PaymentRequirement } from '../config';
import { X402Wallet } from '../client';

// EIP-712 Domain type
interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

// Generate random bytes32 nonce
function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return '0x' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Create EVM wallet adapter for x402
// Uses EIP-3009 transferWithAuthorization for USDC payments
export function createEvmWallet(
  address: string,
  signTypedData: (params: {
    domain: EIP712Domain;
    types: Record<string, any>;
    primaryType: string;
    message: Record<string, any>;
  }) => Promise<string>,
  chainId: number
): X402Wallet {
  return {
    type: 'evm',
    address,
    signPayment: async (requirement: PaymentRequirement): Promise<string> => {
      // EIP-3009 TransferWithAuthorization
      const now = Math.floor(Date.now() / 1000);
      const validAfter = 0; // Valid immediately
      const validBefore = now + requirement.maxTimeoutSeconds;
      const nonce = generateNonce();
      
      // EIP-712 domain for USDC
      const domain: EIP712Domain = {
        name: requirement.extra?.name || 'USD Coin',
        version: requirement.extra?.version || '2',
        chainId: chainId,
        verifyingContract: requirement.asset,
      };
      
      // EIP-3009 types
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
      
      // Authorization message
      const message = {
        from: address,
        to: requirement.payTo,
        value: requirement.maxAmountRequired,
        validAfter: validAfter.toString(),
        validBefore: validBefore.toString(),
        nonce: nonce,
      };
      
      console.log('💳 [EVM] Signing EIP-3009 TransferWithAuthorization:', {
        from: address,
        to: requirement.payTo,
        value: requirement.maxAmountRequired,
        asset: requirement.asset,
        chainId,
      });
      
      // Sign the typed data
      const signature = await signTypedData({
        domain,
        types,
        primaryType: 'TransferWithAuthorization',
        message,
      });
      
      console.log('✅ [EVM] Signature obtained:', signature.substring(0, 20) + '...');
      
      // Return the payment payload in x402 exact scheme format
      return JSON.stringify({
        signature: signature,
        from: address,
        to: requirement.payTo,
        value: requirement.maxAmountRequired,
        validAfter: validAfter.toString(),
        validBefore: validBefore.toString(),
        nonce: nonce,
      });
    },
  };
}

// Get chain ID for a network
export function getChainIdForNetwork(network: string): number {
  const chainIds: Record<string, number> = {
    'base-sepolia': 84532,
    'base': 8453,
    'ethereum': 1,
    'ethereum-sepolia': 11155111,
  };
  return chainIds[network] || 84532;
}
