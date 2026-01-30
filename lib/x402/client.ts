// x402 Client Wrapper for automatic payment handling
// Based on https://github.com/coinbase/x402

import { X402_CONFIG, PaymentRequiredResponse, PaymentRequirement } from './config';

// Wallet interface for signing payments
export interface X402Wallet {
  type: 'evm' | 'solana';
  address: string;
  signPayment: (requirement: PaymentRequirement) => Promise<string>;
}

// Payment result
export interface PaymentResult {
  success: boolean;
  txHash?: string;
  network?: string;
  error?: string;
}

// Options for fetch with payment
export interface FetchWithPaymentOptions extends RequestInit {
  wallet?: X402Wallet;
  maxRetries?: number;
  onPaymentRequired?: (requirements: PaymentRequirement[]) => Promise<PaymentRequirement | null>;
  onPaymentSuccess?: (result: PaymentResult) => void;
  onPaymentError?: (error: string) => void;
}

// Create payment payload for EVM (Base Sepolia/Base)
export async function createEvmPaymentPayload(
  wallet: X402Wallet,
  requirement: PaymentRequirement
): Promise<string> {
  // The actual payment signing would use the wallet's signPayment method
  // This creates an EIP-3009 authorization for USDC transfer
  const payload = await wallet.signPayment(requirement);
  
  const paymentPayload = {
    x402Version: X402_CONFIG.version,
    scheme: requirement.scheme,
    network: requirement.network,
    payload: JSON.parse(payload),
  };
  
  return Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
}

// Create payment payload for Solana
export async function createSolanaPaymentPayload(
  wallet: X402Wallet,
  requirement: PaymentRequirement
): Promise<string> {
  // The actual payment signing would use the wallet's signPayment method
  const payload = await wallet.signPayment(requirement);
  
  const paymentPayload = {
    x402Version: X402_CONFIG.version,
    scheme: requirement.scheme,
    network: requirement.network,
    payload: JSON.parse(payload),
  };
  
  return Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
}

// Wrap fetch with automatic x402 payment handling
export function wrapFetchWithPayment(
  fetchFn: typeof fetch = fetch
): (url: string | URL | Request, options?: FetchWithPaymentOptions) => Promise<Response> {
  return async (url: string | URL | Request, options: FetchWithPaymentOptions = {}): Promise<Response> => {
    const { wallet, maxRetries = 1, onPaymentRequired, onPaymentSuccess, onPaymentError, ...fetchOptions } = options;
    
    let attempts = 0;
    
    while (attempts <= maxRetries) {
      const response = await fetchFn(url, fetchOptions);
      
      // If not 402, return the response
      if (response.status !== 402) {
        return response;
      }
      
      // Handle 402 Payment Required
      console.log('💳 [x402] Payment required for:', url);
      
      if (!wallet) {
        console.error('❌ [x402] No wallet provided for payment');
        onPaymentError?.('No wallet connected');
        return response;
      }
      
      try {
        // Parse the payment required response
        const paymentRequired: PaymentRequiredResponse = await response.json();
        console.log('📋 [x402] Payment options:', paymentRequired.accepts.length);
        
        // Filter requirements by wallet type
        const compatibleRequirements = paymentRequired.accepts.filter(req => {
          const network = X402_CONFIG.networks[req.network as keyof typeof X402_CONFIG.networks];
          return network && network.type === wallet.type;
        });
        
        if (compatibleRequirements.length === 0) {
          console.error('❌ [x402] No compatible payment options for wallet type:', wallet.type);
          onPaymentError?.('No compatible payment options');
          return response;
        }
        
        // Let user select a requirement or use the first compatible one
        let selectedRequirement: PaymentRequirement | null;
        if (onPaymentRequired) {
          selectedRequirement = await onPaymentRequired(compatibleRequirements);
        } else {
          selectedRequirement = compatibleRequirements[0];
        }
        
        if (!selectedRequirement) {
          console.log('❌ [x402] Payment cancelled by user');
          onPaymentError?.('Payment cancelled');
          return response;
        }
        
        console.log('💰 [x402] Creating payment for:', selectedRequirement.network);
        
        // Create payment payload based on wallet type
        let paymentHeader: string;
        if (wallet.type === 'evm') {
          paymentHeader = await createEvmPaymentPayload(wallet, selectedRequirement);
        } else {
          paymentHeader = await createSolanaPaymentPayload(wallet, selectedRequirement);
        }
        
        // Retry with payment
        const paidResponse = await fetchFn(url, {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            'X-PAYMENT': paymentHeader,
          },
        });
        
        // Check for payment response header
        const paymentResponseHeader = paidResponse.headers.get('X-PAYMENT-RESPONSE');
        if (paymentResponseHeader) {
          try {
            const paymentResult = JSON.parse(
              Buffer.from(paymentResponseHeader, 'base64').toString('utf-8')
            );
            console.log('✅ [x402] Payment successful:', paymentResult);
            onPaymentSuccess?.({
              success: true,
              txHash: paymentResult.txHash,
              network: paymentResult.network,
            });
          } catch (e) {
            console.warn('⚠️ [x402] Could not parse payment response');
          }
        }
        
        return paidResponse;
      } catch (error) {
        console.error('❌ [x402] Error processing payment:', error);
        onPaymentError?.(error instanceof Error ? error.message : 'Payment error');
        return response;
      }
      
      attempts++;
    }
    
    // Should not reach here, but return a failed response
    return new Response(JSON.stringify({ error: 'Max payment retries exceeded' }), {
      status: 402,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

// Export a pre-wrapped fetch
export const fetchWithPayment = wrapFetchWithPayment();

