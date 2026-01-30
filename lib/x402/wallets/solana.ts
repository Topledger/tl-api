// Solana Wallet Integration for x402
// Uses @solana/web3.js for Solana

import { PaymentRequirement } from '../config';
import { X402Wallet } from '../client';

// Browser-compatible base64 encoding for Uint8Array
function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

// Create Solana wallet adapter for x402
export function createSolanaWallet(
  publicKey: string,
  signTransaction: (transaction: any) => Promise<any>,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): X402Wallet {
  return {
    type: 'solana',
    address: publicKey,
    signPayment: async (requirement: PaymentRequirement): Promise<string> => {
      // Create a message to sign for authorization
      const now = Math.floor(Date.now() / 1000);
      const message = JSON.stringify({
        from: publicKey,
        to: requirement.payTo,
        amount: requirement.maxAmountRequired,
        asset: requirement.asset,
        timestamp: now,
        validUntil: now + requirement.maxTimeoutSeconds,
        resource: requirement.resource,
      });
      
      // Sign the message
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      
      // Convert signature to base64 (browser-compatible)
      const signatureBase64 = uint8ArrayToBase64(signature);
      
      // Return the payment payload as JSON string
      return JSON.stringify({
        signature: signatureBase64,
        message,
        publicKey,
      });
    },
  };
}

// Helper to check if a Solana wallet is connected
export function isSolanaWalletConnected(window: Window): boolean {
  return !!(window as any).solana?.isConnected;
}

// Helper to get Solana wallet provider
export function getSolanaWalletProvider(window: Window): any {
  const solana = (window as any).solana;
  if (solana?.isPhantom) return solana;
  if ((window as any).solflare?.isSolflare) return (window as any).solflare;
  return solana;
}
