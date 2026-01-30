'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { PaymentRequirement, PaymentRequiredResponse } from '@/lib/x402/config';
import { wrapFetchWithPayment } from '@/lib/x402/client';

interface UseX402Options {
  onPaymentRequired?: (requirements: PaymentRequirement[]) => void;
  onPaymentSuccess?: (txHash: string, network: string) => void;
  onPaymentError?: (error: string) => void;
}

interface X402FetchResult<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  paymentRequired: boolean;
  paymentRequirements: PaymentRequirement[];
}

export function useX402(options: UseX402Options = {}) {
  const { getX402Wallet, isConnected, walletType } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentRequirements, setPaymentRequirements] = useState<PaymentRequirement[]>([]);
  
  // Fetch with x402 payment handling
  const fetchWithX402 = useCallback(async <T>(
    url: string,
    init?: RequestInit
  ): Promise<X402FetchResult<T>> => {
    setIsLoading(true);
    setPaymentRequired(false);
    setPaymentRequirements([]);
    
    try {
      // First, try without payment
      const response = await fetch(url, init);
      
      // If not 402, return the result
      if (response.status !== 402) {
        if (!response.ok) {
          const error = await response.text();
          return {
            data: null,
            error: `Request failed: ${response.status}`,
            isLoading: false,
            paymentRequired: false,
            paymentRequirements: [],
          };
        }
        
        const data = await response.json();
        return {
          data,
          error: null,
          isLoading: false,
          paymentRequired: false,
          paymentRequirements: [],
        };
      }
      
      // Handle 402 Payment Required
      const paymentResponse: PaymentRequiredResponse = await response.json();
      setPaymentRequired(true);
      setPaymentRequirements(paymentResponse.accepts);
      options.onPaymentRequired?.(paymentResponse.accepts);
      
      // If wallet is connected, try to pay automatically
      const wallet = getX402Wallet();
      if (wallet && isConnected) {
        // Filter compatible requirements
        const compatibleReqs = paymentResponse.accepts.filter(req => {
          if (walletType === 'evm') {
            return ['base-sepolia', 'base', 'ethereum', 'ethereum-sepolia'].includes(req.network);
          }
          return ['solana-devnet', 'solana'].includes(req.network);
        });
        
        if (compatibleReqs.length > 0) {
          // Use the first compatible requirement
          const selectedReq = compatibleReqs[0];
          
          try {
            // Sign the payment
            const paymentPayload = await wallet.signPayment(selectedReq);
            
            // Create the x402 payment header
            const paymentHeader = Buffer.from(JSON.stringify({
              x402Version: 1,
              scheme: selectedReq.scheme,
              network: selectedReq.network,
              payload: JSON.parse(paymentPayload),
            })).toString('base64');
            
            // Retry with payment
            const paidResponse = await fetch(url, {
              ...init,
              headers: {
                ...init?.headers,
                'X-PAYMENT': paymentHeader,
              },
            });
            
            if (!paidResponse.ok) {
              const error = await paidResponse.text();
              options.onPaymentError?.(`Payment failed: ${error}`);
              return {
                data: null,
                error: `Payment failed: ${paidResponse.status}`,
                isLoading: false,
                paymentRequired: true,
                paymentRequirements: paymentResponse.accepts,
              };
            }
            
            // Check for payment response
            const paymentResponseHeader = paidResponse.headers.get('X-PAYMENT-RESPONSE');
            if (paymentResponseHeader) {
              try {
                const settlementResult = JSON.parse(
                  Buffer.from(paymentResponseHeader, 'base64').toString('utf-8')
                );
                options.onPaymentSuccess?.(settlementResult.txHash, settlementResult.network);
              } catch (e) {
                // Ignore parse errors
              }
            }
            
            const data = await paidResponse.json();
            setPaymentRequired(false);
            setPaymentRequirements([]);
            
            return {
              data,
              error: null,
              isLoading: false,
              paymentRequired: false,
              paymentRequirements: [],
            };
          } catch (signError: any) {
            options.onPaymentError?.(signError.message || 'Failed to sign payment');
            return {
              data: null,
              error: signError.message || 'Failed to sign payment',
              isLoading: false,
              paymentRequired: true,
              paymentRequirements: paymentResponse.accepts,
            };
          }
        }
      }
      
      // Return payment required state
      return {
        data: null,
        error: 'Payment required',
        isLoading: false,
        paymentRequired: true,
        paymentRequirements: paymentResponse.accepts,
      };
      
    } catch (error: any) {
      return {
        data: null,
        error: error.message || 'Request failed',
        isLoading: false,
        paymentRequired: false,
        paymentRequirements: [],
      };
    } finally {
      setIsLoading(false);
    }
  }, [getX402Wallet, isConnected, walletType, options]);
  
  // Manual payment function
  const payForAccess = useCallback(async (
    url: string,
    requirement: PaymentRequirement,
    init?: RequestInit
  ) => {
    const wallet = getX402Wallet();
    if (!wallet) {
      throw new Error('Wallet not connected');
    }
    
    setIsLoading(true);
    
    try {
      // Sign the payment
      const paymentPayload = await wallet.signPayment(requirement);
      
      // Create the x402 payment header
      const paymentHeader = Buffer.from(JSON.stringify({
        x402Version: 1,
        scheme: requirement.scheme,
        network: requirement.network,
        payload: JSON.parse(paymentPayload),
      })).toString('base64');
      
      // Make the request with payment
      const response = await fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          'X-PAYMENT': paymentHeader,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      
      // Check for payment response
      const paymentResponseHeader = response.headers.get('X-PAYMENT-RESPONSE');
      if (paymentResponseHeader) {
        try {
          const settlementResult = JSON.parse(
            Buffer.from(paymentResponseHeader, 'base64').toString('utf-8')
          );
          options.onPaymentSuccess?.(settlementResult.txHash, settlementResult.network);
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      const data = await response.json();
      setPaymentRequired(false);
      setPaymentRequirements([]);
      
      return data;
    } finally {
      setIsLoading(false);
    }
  }, [getX402Wallet, options]);
  
  return {
    fetchWithX402,
    payForAccess,
    isLoading,
    paymentRequired,
    paymentRequirements,
    isWalletConnected: isConnected,
    walletType,
  };
}

