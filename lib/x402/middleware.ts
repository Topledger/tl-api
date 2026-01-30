// x402 Payment Middleware for Next.js
// Based on https://github.com/coinbase/x402

import { NextRequest, NextResponse } from 'next/server';
import { X402_CONFIG, createPaymentRequirements, PaymentPayload, PaymentRequiredResponse } from './config';

// Enable test mode to bypass facilitator (for local development)
// Set X402_TEST_MODE=true to enable test mode, otherwise use real facilitator
const TEST_MODE = process.env.X402_TEST_MODE === 'true';

interface RouteConfig {
  price: string;
  description: string;
  networks?: string[];
}

interface X402MiddlewareConfig {
  routes: Record<string, RouteConfig>;
  payToAddress: string;
  facilitatorUrl?: string;
}

// Verify payment locally (test mode) - just checks signature exists
function verifyPaymentLocally(paymentHeader: string): { isValid: boolean; invalidReason?: string } {
  try {
    const decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf-8'));
    
    // Basic validation
    if (!decoded.x402Version || !decoded.scheme || !decoded.network || !decoded.payload) {
      return { isValid: false, invalidReason: 'Invalid payment format' };
    }
    
    // Check payload has signature
    if (!decoded.payload.signature) {
      return { isValid: false, invalidReason: 'Missing signature in payload' };
    }
    
    console.log('✅ [x402-TEST] Payment verified locally (test mode)');
    return { isValid: true };
  } catch (error) {
    console.error('❌ [x402-TEST] Local verification failed:', error);
    return { isValid: false, invalidReason: 'Invalid payment encoding' };
  }
}

// Verify payment with facilitator
async function verifyPayment(
  paymentHeader: string,
  paymentRequirements: any
): Promise<{ isValid: boolean; invalidReason?: string }> {
  // Use local verification in test mode
  if (TEST_MODE) {
    console.log('🧪 [x402] Test mode enabled - using local verification');
    return verifyPaymentLocally(paymentHeader);
  }
  
  try {
    const response = await fetch(`${X402_CONFIG.facilitatorUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        x402Version: X402_CONFIG.version,
        paymentHeader,
        paymentRequirements,
      }),
    });
    
    if (!response.ok) {
      console.error('❌ [x402] Facilitator verification failed:', response.status);
      return { isValid: false, invalidReason: 'Facilitator verification failed' };
    }
    
    const result = await response.json();
    return {
      isValid: result.isValid,
      invalidReason: result.invalidReason || undefined,
    };
  } catch (error) {
    console.error('❌ [x402] Error verifying payment:', error);
    return { isValid: false, invalidReason: 'Payment verification error' };
  }
}

// Settle payment with facilitator
async function settlePayment(
  paymentHeader: string,
  paymentRequirements: any
): Promise<{ success: boolean; txHash?: string; networkId?: string; error?: string }> {
  // In test mode, simulate successful settlement
  if (TEST_MODE) {
    const mockTxHash = `0x${Date.now().toString(16)}${'0'.repeat(48)}`.slice(0, 66);
    console.log('🧪 [x402-TEST] Simulated settlement:', mockTxHash);
    
    // Parse the payment to get network
    let network = 'base-sepolia';
    try {
      const decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf-8'));
      network = decoded.network || 'base-sepolia';
    } catch (e) {}
    
    return {
      success: true,
      txHash: mockTxHash,
      networkId: network,
    };
  }
  
  try {
    const response = await fetch(`${X402_CONFIG.facilitatorUrl}/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        x402Version: X402_CONFIG.version,
        paymentHeader,
        paymentRequirements,
      }),
    });
    
    if (!response.ok) {
      console.error('❌ [x402] Facilitator settlement failed:', response.status);
      return { success: false, error: 'Settlement failed' };
    }
    
    const result = await response.json();
    return {
      success: result.success,
      txHash: result.txHash,
      networkId: result.networkId,
      error: result.error,
    };
  } catch (error) {
    console.error('❌ [x402] Error settling payment:', error);
    return { success: false, error: 'Settlement error' };
  }
}

// Create 402 Payment Required response
export function createPaymentRequiredResponse(
  resource: string,
  description: string,
  price: string,
  networks: string[] = ['base-sepolia', 'solana-devnet'],
  error?: string
): NextResponse {
  const paymentRequirements = createPaymentRequirements(
    resource,
    description,
    price,
    networks
  );
  
  const response: PaymentRequiredResponse = {
    x402Version: X402_CONFIG.version,
    accepts: paymentRequirements,
    error,
  };
  
  return NextResponse.json(response, {
    status: 402,
    headers: {
      'Content-Type': 'application/json',
      'X-Payment-Required': 'true',
    },
  });
}

// Check if request has valid x402 payment
export async function checkX402Payment(
  request: NextRequest,
  routeConfig: RouteConfig
): Promise<{ valid: boolean; error?: string; settlementResult?: any }> {
  const paymentHeader = request.headers.get('X-PAYMENT');
  
  if (!paymentHeader) {
    return { valid: false, error: 'No payment provided' };
  }
  
  try {
    // Decode the payment payload
    const paymentPayload: PaymentPayload = JSON.parse(
      Buffer.from(paymentHeader, 'base64').toString('utf-8')
    );
    
    console.log('💰 [x402] Payment payload received:', {
      scheme: paymentPayload.scheme,
      network: paymentPayload.network,
      version: paymentPayload.x402Version,
    });
    
    // Get the payment requirements for this route
    const networks = routeConfig.networks || ['base-sepolia', 'solana-devnet'];
    const requirements = createPaymentRequirements(
      request.url,
      routeConfig.description,
      routeConfig.price,
      networks
    );
    
    // Find matching requirement
    const matchingRequirement = requirements.find(
      req => req.scheme === paymentPayload.scheme && req.network === paymentPayload.network
    );
    
    if (!matchingRequirement) {
      return { valid: false, error: 'Payment scheme/network not accepted' };
    }
    
    // Verify the payment with the facilitator
    const verification = await verifyPayment(paymentHeader, matchingRequirement);
    
    if (!verification.isValid) {
      console.log('❌ [x402] Payment verification failed:', verification.invalidReason);
      return { valid: false, error: verification.invalidReason };
    }
    
    console.log('✅ [x402] Payment verified successfully');
    
    // Settle the payment
    const settlement = await settlePayment(paymentHeader, matchingRequirement);
    
    if (!settlement.success) {
      console.log('❌ [x402] Payment settlement failed:', settlement.error);
      return { valid: false, error: settlement.error };
    }
    
    console.log('✅ [x402] Payment settled successfully:', settlement.txHash);
    
    return { 
      valid: true, 
      settlementResult: {
        txHash: settlement.txHash,
        network: paymentPayload.network,
      }
    };
  } catch (error) {
    console.error('❌ [x402] Error processing payment:', error);
    return { valid: false, error: 'Invalid payment format' };
  }
}

// Middleware wrapper for x402 protected routes
export function withX402Payment(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  config: RouteConfig
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    // Check for x402 payment
    const paymentResult = await checkX402Payment(request, config);
    
    if (!paymentResult.valid) {
      // Return 402 Payment Required
      return createPaymentRequiredResponse(
        request.url,
        config.description,
        config.price,
        config.networks,
        paymentResult.error
      );
    }
    
    // Payment valid, proceed with the handler
    const response = await handler(request, context);
    
    // Add settlement info to response headers
    if (paymentResult.settlementResult) {
      response.headers.set('X-PAYMENT-RESPONSE', 
        Buffer.from(JSON.stringify(paymentResult.settlementResult)).toString('base64')
      );
    }
    
    return response;
  };
}

// Export types
export type { RouteConfig, X402MiddlewareConfig };

