import { NextRequest, NextResponse } from 'next/server';
import { useFacilitator } from 'x402/verify';

// x402 Configuration
// EVM address for Base Sepolia payments
const PAY_TO_EVM = process.env.X402_PAY_TO_ADDRESS || '0x4d2F2A7Bf5AA8b8E52FFC7Df52277D718A76CF34';
// Solana address for Solana Devnet payments (must be base58 encoded)
const PAY_TO_SOLANA = process.env.X402_PAY_TO_SOLANA || 'CKPKJWNdJEqa81x7CkZ14BVPiY6y16Sxs7owznqtWYp5'; // Default to facilitator's fee payer for testing
const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
const X402_SYSTEM_API_KEY = process.env.X402_SYSTEM_API_KEY || 'tl_vkrKK4X70zzCu4vG3SdvvxwnoZZiI8UP';

// Price configuration (in USD) - converted to atomic units (6 decimals for USDC)
const PRICES = {
  research: 500,    // $0.0005 = 500 atomic units
  trading: 1000,    // $0.001 = 1000 atomic units
};

// Asset addresses
const ASSETS = {
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
  'solana-devnet': '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // USDC on Solana Devnet (Circle's devnet USDC)
};

// Initialize facilitator
const { verify, settle, supported } = useFacilitator(FACILITATOR_URL);

// Get price based on API path
function getPrice(path: string): number {
  if (path.includes('top-traders') || path.includes('top-holders') || path.includes('trending-pairs')) {
    return PRICES.trading;
  }
  return PRICES.research;
}

// Build payment requirements for both networks
async function buildPaymentRequirements(resource: string, price: number, description: string) {
  const requirements = [];
  
  // Get supported networks from facilitator
  let supportedNetworks;
  try {
    supportedNetworks = await supported();
    console.log('📋 [x402] Supported networks:', JSON.stringify(supportedNetworks));
  } catch (e) {
    console.error('❌ [x402] Failed to get supported networks:', e);
    supportedNetworks = { kinds: [] };
  }
  
  // Base Sepolia (EVM)
  requirements.push({
    scheme: 'exact',
    network: 'base-sepolia',
    maxAmountRequired: price.toString(),
    resource,
    description,
    mimeType: 'application/json',
    payTo: PAY_TO_EVM,
    maxTimeoutSeconds: 300,
    asset: ASSETS['base-sepolia'],
    extra: {
      name: 'USD Coin',
      version: '2',
    },
  });
  
  // Solana Devnet
  const solanaKind = supportedNetworks.kinds?.find((k: any) => k.network === 'solana-devnet');
  if (solanaKind) {
    requirements.push({
      scheme: 'exact',
      network: 'solana-devnet',
      maxAmountRequired: price.toString(),
      resource,
      description,
      mimeType: 'application/json',
      payTo: PAY_TO_SOLANA,
      maxTimeoutSeconds: 300,
      asset: ASSETS['solana-devnet'],
      extra: {
        feePayer: solanaKind.extra?.feePayer,
      },
    });
  }
  
  return requirements;
}

// The actual handler that fetches data
async function handleApiRequest(
  request: NextRequest,
  endpoint: string[],
  method: string
): Promise<NextResponse> {
  const endpointPath = '/api/' + endpoint.join('/');
  console.log(`💰 [x402-PAID] Processing paid request: ${endpointPath}`);
  
  const baseUrl = request.nextUrl.origin;
  const targetUrl = `${baseUrl}${endpointPath}`;
  
  const targetUrlObj = new URL(targetUrl);
  targetUrlObj.searchParams.set('api_key', X402_SYSTEM_API_KEY);
  
  request.nextUrl.searchParams.forEach((value, key) => {
    if (key !== 'api_key') {
      targetUrlObj.searchParams.set(key, value);
    }
  });
  
  console.log(`💰 [x402-PAID] Forwarding to: ${targetUrlObj.toString().replace(X402_SYSTEM_API_KEY, '***')}`);
  
  const response = await fetch(targetUrlObj.toString(), {
    method,
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    console.error(`❌ [x402-PAID] API error: ${response.status}`);
    return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status });
  }
  
  const data = await response.json();
  console.log(`✅ [x402-PAID] Success!`);
  
  return NextResponse.json(data);
}

// Main handler with multi-network x402 support
async function handleRequest(
  request: NextRequest,
  endpoint: string[],
  method: string
) {
  const endpointPath = '/api/' + endpoint.join('/');
  const price = getPrice(endpointPath);
  const resource = `${request.nextUrl.origin}/api/x402-pay/${endpoint.join('/')}`;
  const description = `API access: ${endpointPath}`;
  
  // Build payment requirements
  const paymentRequirements = await buildPaymentRequirements(resource, price, description);
  
  // Check for payment header
  const paymentHeader = request.headers.get('X-PAYMENT');
  
  if (!paymentHeader) {
    // Return 402 with payment requirements
    console.log(`💳 [x402] Payment required for: ${endpointPath}`);
    return NextResponse.json(
      {
        x402Version: 1,
        error: 'X-PAYMENT header is required',
        accepts: paymentRequirements,
      },
      { status: 402, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Decode and verify payment
  console.log(`💳 [x402] Verifying payment...`);
  
  try {
    // Decode the payment header
    const decodedPayment = JSON.parse(atob(paymentHeader));
    console.log(`💳 [x402] Payment network: ${decodedPayment.network}, scheme: ${decodedPayment.scheme}`);
    
    // Find matching requirement
    const matchingRequirement = paymentRequirements.find(
      (r) => r.network === decodedPayment.network && r.scheme === decodedPayment.scheme
    );
    
    if (!matchingRequirement) {
      console.log(`❌ [x402] No matching payment requirement`);
      return NextResponse.json(
        {
          x402Version: 1,
          error: 'No matching payment requirement for this network',
          accepts: paymentRequirements,
        },
        { status: 402 }
      );
    }
    
    // Verify with facilitator
    const verification = await verify(decodedPayment, matchingRequirement);
    console.log(`💳 [x402] Verification result:`, verification);
    
    if (!verification.isValid) {
      console.log(`❌ [x402] Payment verification failed: ${verification.invalidReason}`);
      return NextResponse.json(
        {
          x402Version: 1,
          error: verification.invalidReason || 'Payment verification failed',
          accepts: paymentRequirements,
        },
        { status: 402 }
      );
    }
    
    console.log(`✅ [x402] Payment verified! Payer: ${verification.payer}`);
    
    // Process the actual API request
    const response = await handleApiRequest(request, endpoint, method);
    
    // Settle the payment
    console.log(`💰 [x402] Settling payment...`);
    const settlement = await settle(decodedPayment, matchingRequirement);
    
    if (settlement.success) {
      console.log(`✅ [x402] Payment settled! TX: ${settlement.transaction}`);
      
      // Add settlement info to response headers
      const settlementData = {
        success: true,
        transaction: settlement.transaction,
        network: settlement.network,
        payer: settlement.payer,
      };
      
      response.headers.set('X-PAYMENT-RESPONSE', btoa(JSON.stringify(settlementData)));
    } else {
      console.error(`❌ [x402] Settlement failed:`, settlement);
    }
    
    return response;
    
  } catch (error: any) {
    console.error(`❌ [x402] Error processing payment:`, error);
    return NextResponse.json(
      {
        x402Version: 1,
        error: error.message || 'Payment processing error',
        accepts: paymentRequirements,
      },
      { status: 402 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  const { endpoint } = await params;
  return handleRequest(request, endpoint, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  const { endpoint } = await params;
  return handleRequest(request, endpoint, 'POST');
}
