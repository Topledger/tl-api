'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { signIn } from 'next-auth/react';
import bs58 from 'bs58';

interface SolanaAuthResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    publicKey: string;
    plan: string;
    credits: any;
  };
}

interface UseSolanaAuthReturn {
  signInWithSolana: () => Promise<SolanaAuthResponse>;
  isLoading: boolean;
  error: string | null;
}

export const useSolanaAuth = (): UseSolanaAuthReturn => {
  const { publicKey, signMessage, connect, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithSolana = useCallback(async (): Promise<SolanaAuthResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Connect wallet if not connected
      if (!connected) {
        await connect();
      }

      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      if (!signMessage) {
        throw new Error('Wallet does not support message signing');
      }

      // Step 1: Get nonce from backend
      const nonceResponse = await fetch('/api/auth/nonce');
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce');
      }

      const { nonce } = await nonceResponse.json();

      // Step 2: Create message to sign
      const message = `Sign this message to authenticate with Top Ledger APIs.\n\nNonce: ${nonce}`;
      const encodedMessage = new TextEncoder().encode(message);

      // Step 3: Sign the message
      const signature = await signMessage(encodedMessage);
      const signatureBase58 = bs58.encode(signature);

      // Step 4: Verify signature with backend
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: publicKey.toString(),
          signature: signatureBase58,
          message,
          nonce,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const { token, user } = await verifyResponse.json();

      // Step 5: Use NextAuth to sign in with the custom token
      // We'll create a custom provider for this
      const result = await signIn('solana', {
        token,
        publicKey: publicKey.toString(),
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      return {
        success: true,
        user,
      };

    } catch (err: any) {
      const errorMessage = err.message || 'Authentication failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signMessage, connect, connected]);

  return {
    signInWithSolana,
    isLoading,
    error,
  };
};
