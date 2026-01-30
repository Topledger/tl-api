import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getApiDataFromS3, isS3Configured } from '@/lib/s3';
import { 
  checkX402Payment, 
  createPaymentRequiredResponse, 
  RouteConfig 
} from '@/lib/x402/middleware';
import { X402_CONFIG } from '@/lib/x402/config';

// This route handles x402 payment-based API access
// Supports both EVM (Base Sepolia/Base) and Solana payments
// Works with both Research APIs (from S3) and Trading APIs (from DB)

interface ApiInfo {
  title: string;
  path: string;
  originalUrl: string;
  menuName?: string;
}

// Get route configuration for an API endpoint
function getRouteConfig(apiPath: string, apiTitle: string): RouteConfig {
  const isTrading = apiPath.includes('top-traders') || 
                    apiPath.includes('top-holders') || 
                    apiPath.includes('trending-pairs');
  
  return {
    price: isTrading ? X402_CONFIG.defaultPrices.trading : X402_CONFIG.defaultPrices.research,
    description: `Access to ${apiTitle} API`,
    networks: ['base-sepolia', 'solana-devnet'], // Test networks
  };
}

// Get all APIs from both S3 and database
async function getAllApis(): Promise<ApiInfo[]> {
  const allApis: ApiInfo[] = [];
  
  // Get APIs from database (Trading APIs)
  try {
    const dbApis = await prisma.apiEndpoint.findMany({
      where: { isActive: true },
    });
    
    dbApis.forEach(api => {
      allApis.push({
        title: api.title,
        path: api.path,
        originalUrl: api.originalUrl,
        menuName: api.menuName || undefined,
      });
    });
  } catch (error) {
    console.error('❌ [x402-API] Error fetching DB APIs:', error);
  }
  
  // Get APIs from S3 (Research APIs)
  if (isS3Configured()) {
    try {
      const s3Data = await getApiDataFromS3();
      if (s3Data?.apis) {
        s3Data.apis.forEach((api: any) => {
          // Convert S3 API format to our format
          // S3 APIs have path like "/tl-research/api/queries/..." 
          // We need to add "/api/tl" prefix
          const path = `/api/tl${api.path}`;
          allApis.push({
            title: api.title || api.path,
            path: path,
            originalUrl: api.originalUrl || api.url,
            menuName: api.menuName,
          });
        });
      }
    } catch (error) {
      console.error('❌ [x402-API] Error fetching S3 APIs:', error);
    }
  }
  
  return allApis;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  return handleRequest(request, await params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  return handleRequest(request, await params, 'POST');
}

async function handleRequest(
  request: NextRequest,
  { endpoint }: { endpoint: string[] },
  method: string
) {
  try {
    // Build the endpoint path
    const endpointPath = '/api/' + endpoint.join('/');
    console.log(`💳 [x402-API] Processing: ${endpointPath}`);
    
    // Get all APIs
    const allApis = await getAllApis();
    console.log(`💳 [x402-API] Found ${allApis.length} total APIs`);
    
    // Find the matching API by path
    let matchingApi: ApiInfo | null = null;
    let pathParams: Record<string, string> = {};
    
    for (const api of allApis) {
      // Check for exact match
      if (api.path === endpointPath) {
        matchingApi = api;
        console.log(`💳 [x402-API] Exact match: ${api.title}`);
        break;
      }
      
      // Check for path parameter match (e.g., {mint})
      const apiPathParts = api.path.split('/').filter((p: string) => p);
      const endpointPathParts = endpointPath.split('/').filter(p => p);
      
      if (apiPathParts.length === endpointPathParts.length) {
        let matches = true;
        const params: Record<string, string> = {};
        
        for (let i = 0; i < apiPathParts.length; i++) {
          if (apiPathParts[i].startsWith('{') && apiPathParts[i].endsWith('}')) {
            const paramName = apiPathParts[i].slice(1, -1);
            params[paramName] = endpointPathParts[i];
          } else if (apiPathParts[i] !== endpointPathParts[i]) {
            matches = false;
            break;
          }
        }
        
        if (matches) {
          matchingApi = api;
          pathParams = params;
          console.log(`💳 [x402-API] Path param match: ${api.title}`);
          break;
        }
      }
    }
    
    // If no exact match, check if it's a research API pattern
    if (!matchingApi && endpointPath.startsWith('/api/tl/')) {
      // This might be a research API - create a generic match
      matchingApi = {
        title: 'Research API',
        path: endpointPath,
        originalUrl: endpointPath.replace('/api/tl', 'https://api.redash.io'),
        menuName: 'Research',
      };
      console.log(`💳 [x402-API] Research API pattern match`);
    }
    
    if (!matchingApi) {
      console.log(`❌ [x402-API] No match found for: ${endpointPath}`);
      return NextResponse.json(
        { error: `API endpoint not found: ${endpointPath}` },
        { status: 404 }
      );
    }
    
    console.log(`💳 [x402-API] Matched: ${matchingApi.title}`);
    
    // Get route configuration for x402
    const routeConfig = getRouteConfig(matchingApi.path, matchingApi.title);
    
    // Check for x402 payment
    const paymentResult = await checkX402Payment(request, routeConfig);
    
    if (!paymentResult.valid) {
      console.log(`💳 [x402-API] Payment required for: ${matchingApi.title}`);
      
      return createPaymentRequiredResponse(
        request.url,
        routeConfig.description,
        routeConfig.price,
        routeConfig.networks,
        paymentResult.error
      );
    }
    
    console.log(`✅ [x402-API] Payment verified, proceeding with request`);
    
    // Payment valid, forward to the actual API
    // Use system API key for x402 paid requests
    const X402_SYSTEM_API_KEY = process.env.X402_SYSTEM_API_KEY || 'tl_vkrKK4X70zzCu4vG3SdvvxwnoZZiI8UP';
    
    const { searchParams } = new URL(request.url);
    
    let targetUrl: string;
    
    if (endpointPath.startsWith('/api/tl/')) {
      // Research API - forward to internal /api/tl route with API key
      const internalPath = endpointPath; // Already has /api/tl prefix
      const baseUrl = request.url.split('/api/x402')[0];
      targetUrl = `${baseUrl}${internalPath}`;
    } else {
      // Trading API - forward to internal wrapper with API key
      const baseUrl = request.url.split('/api/x402')[0];
      targetUrl = `${baseUrl}${endpointPath}`;
    }
    
    // Build target URL with API key
    const targetUrlObj = new URL(targetUrl);
    
    // Add the system API key for authentication
    targetUrlObj.searchParams.set('api_key', X402_SYSTEM_API_KEY);
    
    // Add other query params (except any existing api_key)
    searchParams.forEach((value, key) => {
      if (key !== 'api_key') {
        targetUrlObj.searchParams.set(key, value);
      }
    });
    
    console.log(`💳 [x402-API] Forwarding to: ${targetUrlObj.toString()}`);
    
    console.log(`💳 [x402-API] Forwarding with API key to: ${targetUrlObj.toString().replace(X402_SYSTEM_API_KEY, '***')}`);
    
    // Make request
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TopLedger-x402-API/1.0',
      },
    };
    
    if (method === 'POST') {
      try {
        const body = await request.text();
        if (body) {
          requestOptions.body = body;
        }
      } catch (error) {
        // Body might be empty
      }
    }
    
    const startTime = Date.now();
    const response = await fetch(targetUrlObj.toString(), requestOptions);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [x402-API] API error: ${response.status} - ${errorText.substring(0, 200)}`);
      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`✅ [x402-API] Success: ${matchingApi.path} (${responseTime}ms)`);
    
    // Build response headers
    const responseHeaders: Record<string, string> = {
      'X-Response-Time': `${responseTime}ms`,
      'X-API-Endpoint': matchingApi.path,
      'X-Payment-Method': 'x402',
    };
    
    if (paymentResult.settlementResult) {
      responseHeaders['X-PAYMENT-RESPONSE'] = Buffer.from(
        JSON.stringify(paymentResult.settlementResult)
      ).toString('base64');
    }
    
    return NextResponse.json(data, { headers: responseHeaders });
    
  } catch (error: any) {
    console.error('❌ [x402-API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
