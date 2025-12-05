import { NextRequest, NextResponse } from 'next/server';
import { prisma, checkUserCredits, deductUserCredits, logApiCall } from '@/lib/db';

// This route handles trading APIs that don't have /api/tl prefix
// e.g., /api/top-traders/{mint}, /api/top-holders/{mint}, /api/trending-pairs

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
    // Get user API key from query params or headers
    const { searchParams } = new URL(request.url);
    const userApiKey = searchParams.get('api_key') || request.headers.get('x-api-key');

    if (!userApiKey) {
      return NextResponse.json(
        { error: 'API key is required. Provide it as ?api_key=YOUR_KEY or X-API-Key header' },
        { status: 401 }
      );
    }

    // Validate user API key with database lookup
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        key: userApiKey,
        isActive: true
      },
      include: {
        user: true
      }
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key or user not authenticated' },
        { status: 403 }
      );
    }

    const userId = apiKey.userId;
    const apiKeyId = apiKey.id;

    // Check if user has sufficient credits
    const hasCredits = await checkUserCredits(userId, 1);
    if (!hasCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please contact support to add more credits to your account.' },
        { status: 402 }
      );
    }

    // Build the endpoint path from the dynamic route
    // Note: Next.js route at /app/api/[...endpoint] doesn't include 'api' in the endpoint array
    // So we need to prepend '/api' to match database paths
    const endpointPath = '/api/' + endpoint.join('/');
    console.log(`🔍 [TRADING-API] Looking for endpoint: ${endpointPath}`);

    // Load trading APIs from database
    const tradingApis = await prisma.apiEndpoint.findMany({
      where: {
        isActive: true,
        menuName: 'Trading',
      },
    });
    console.log(`📊 [TRADING-API] Found ${tradingApis.length} trading APIs in database`);

    // Find the matching API by path (handle path parameters like {mint})
    let matchingApi: any = null;
    let pathParams: Record<string, string> = {};

    for (const api of tradingApis) {
      const apiPath = api.path;
      console.log(`🔍 [TRADING-API] Comparing: DB path="${apiPath}" vs endpoint="${endpointPath}"`);

      // Check for exact match
      if (apiPath === endpointPath) {
        matchingApi = api;
        console.log(`✅ [TRADING-API] Exact match found!`);
        break;
      }

      // Check for path parameter match (e.g., /api/top-traders/{mint} matches /api/top-traders/ABC123)
      const apiPathParts = apiPath.split('/').filter(p => p);
      const endpointPathParts = endpointPath.split('/').filter(p => p);

      console.log(`🔍 [TRADING-API] Path parts - DB: [${apiPathParts.join(', ')}], Endpoint: [${endpointPathParts.join(', ')}]`);

      if (apiPathParts.length === endpointPathParts.length) {
        let matches = true;
        const params: Record<string, string> = {};

        for (let i = 0; i < apiPathParts.length; i++) {
          if (apiPathParts[i].startsWith('{') && apiPathParts[i].endsWith('}')) {
            // This is a parameter placeholder
            const paramName = apiPathParts[i].slice(1, -1);
            params[paramName] = endpointPathParts[i];
            console.log(`📝 [TRADING-API] Found param: ${paramName} = ${endpointPathParts[i]}`);
          } else if (apiPathParts[i] !== endpointPathParts[i]) {
            matches = false;
            console.log(`❌ [TRADING-API] Mismatch at index ${i}: "${apiPathParts[i]}" !== "${endpointPathParts[i]}"`);
            break;
          }
        }

        if (matches) {
          matchingApi = api;
          pathParams = params;
          console.log(`✅ [TRADING-API] Parameter match found!`);
          break;
        }
      } else {
        console.log(`❌ [TRADING-API] Length mismatch: ${apiPathParts.length} !== ${endpointPathParts.length}`);
      }
    }

    if (!matchingApi) {
      console.log(`❌ [TRADING-API] No matching API found for: ${endpointPath}`);
      return NextResponse.json(
        { error: `API endpoint not found: ${endpointPath}` },
        { status: 404 }
      );
    }

    console.log(`✅ [TRADING-API] Matched API: ${matchingApi.title} (${matchingApi.path})`);

    // Remove api_key from searchParams (trading APIs don't need API key in the request)
    searchParams.delete('api_key');

    // Build target URL with path parameters replaced
    let targetUrlString = matchingApi.originalUrl;

    // Replace path parameters in the URL (e.g., {mint} -> actual mint value)
    Object.entries(pathParams).forEach(([key, value]) => {
      targetUrlString = targetUrlString.replace(`{${key}}`, value);
    });

    console.log(`🔄 [TRADING-API] Calling original API: ${targetUrlString}`);
    console.log(`📋 [TRADING-API] Path params:`, pathParams);

    const targetUrl = new URL(targetUrlString);
    // Don't add any API key - trading APIs don't require authentication
    targetUrl.search = searchParams.toString();

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TopLedger-API-Wrapper/1.0',
      },
    };

    // Add body for POST requests
    if (method === 'POST') {
      try {
        const body = await request.text();
        if (body) {
          requestOptions.body = body;
        }
      } catch (error) {
        // Body might be empty, that's okay
      }
    }

    // Track start time for response time measurement
    const startTime = Date.now();
    let statusCode = 200;
    let errorMessage: string | undefined;

    try {
      // Make request to the actual API
      console.log(`🌐 [TRADING-API] Fetching from: ${targetUrl.toString()}`);
      const response = await fetch(targetUrl.toString(), requestOptions);
      statusCode = response.status;
      console.log(`📡 [TRADING-API] Response status: ${statusCode}`);

      if (!response.ok) {
        const errorText = await response.text();
        errorMessage = `API error: ${response.status} ${response.statusText}`;
        console.error(`❌ [TRADING-API] ${errorMessage}: ${errorText.substring(0, 200)}`);

        // Log failed API call
        await logApiCall({
          userId: userId,
          apiKeyId: apiKeyId,
          endpoint: matchingApi.path,
          method: method,
          statusCode: statusCode,
          responseTime: Date.now() - startTime,
          userAgent: request.headers.get('user-agent') || undefined,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          errorMessage: errorMessage
        });

        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }

      const responseText = await response.text();
      console.log(`📦 [TRADING-API] Response length: ${responseText.length} chars`);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ [TRADING-API] Failed to parse JSON response:`, parseError);
        console.error(`📄 [TRADING-API] Response text (first 500 chars):`, responseText.substring(0, 500));
        throw new Error('Invalid JSON response from API');
      }
      
      const responseTime = Date.now() - startTime;
      console.log(`✅ [TRADING-API] Successfully parsed response`);

      // Deduct credits for successful API call
      await deductUserCredits(userId, 1);

      // Log successful API call
      await logApiCall({
        userId: userId,
        apiKeyId: apiKeyId,
        endpoint: matchingApi.path,
        method: method,
        statusCode: statusCode,
        responseTime: responseTime,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      });

      console.log(`✅ [TRADING-API] Success: ${matchingApi.path} (${responseTime}ms)`);

      return NextResponse.json(data, {
        headers: {
          'X-Response-Time': `${responseTime}ms`,
          'X-API-Endpoint': matchingApi.path,
        },
      });

    } catch (fetchError: any) {
      const responseTime = Date.now() - startTime;
      errorMessage = `Network error: ${fetchError.message}`;
      console.error(`❌ [TRADING-API] ${errorMessage}`);

      // Log failed API call
      await logApiCall({
        userId: userId,
        apiKeyId: apiKeyId,
        endpoint: matchingApi.path,
        method: method,
        statusCode: 500,
        responseTime: responseTime,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        errorMessage: errorMessage
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ [TRADING-API] Error in trading API wrapper:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

