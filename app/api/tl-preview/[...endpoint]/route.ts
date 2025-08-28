import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isS3Configured, getApiDataFromS3 } from '@/lib/s3';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';

interface ApiItem {
  endpoint: string;
  apiKey: string;
  title: string;
  subtitle: string;
  page: string;
  pageName: string;
  menuId: string;
  menuName: string;
}

interface ApiData {
  totalApis: number;
  extractedAt: string;
  apis: ApiItem[];
}

// Load APIs data with S3 support
async function getApisData(): Promise<ApiData> {
  if (isS3Configured()) {
    try {
      console.log('🔄 Loading API data from S3 for preview...');
      return await getApiDataFromS3();
    } catch (error) {
      console.error('❌ Failed to load from S3, falling back to local file:', error);
    }
  }
  
  console.log('📁 Loading API data from local file for preview...');
  const apisPath = path.join(process.cwd(), 'public', 'apis_list.json');
  const fileData = fs.readFileSync(apisPath, 'utf8');
  return JSON.parse(fileData);
}

// Validate user API key (same as main API)
async function validateUserApiKey(userApiKey: string, request: NextRequest): Promise<{ isValid: boolean; userId?: string }> {
  try {
    console.log(`🔐 [PREVIEW] Validating API key: ${userApiKey}`);

    // First try to validate using database
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        key: userApiKey,
        isActive: true
      },
      include: {
        user: true
      }
    });

    if (apiKey) {
      console.log(`✅ [PREVIEW] Valid API key found: ${apiKey.name} for user: ${apiKey.user.email}`);
      return { isValid: true, userId: apiKey.userId };
    }

    console.log(`❌ [PREVIEW] Invalid API key: ${userApiKey}`);
    return { isValid: false };
  } catch (error) {
    console.error('Error validating API key for preview:', error);
    return { isValid: false };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'POST');
}

async function handleRequest(
  request: NextRequest,
  { endpoint }: { endpoint: string[] },
  method: string
) {
  try {
    console.log('🔍 [PREVIEW] Processing preview API request - NO CREDITS CONSUMED');

    // Get user API key from query params or headers
    const { searchParams } = new URL(request.url);
    const userApiKey = searchParams.get('api_key') || request.headers.get('x-api-key');

    if (!userApiKey) {
      return NextResponse.json(
        { error: 'API key is required for preview. Provide it as ?api_key=YOUR_KEY or X-API-Key header' },
        { status: 401 }
      );
    }

    // Validate user API key (but don't check credits for preview)
    const { isValid, userId } = await validateUserApiKey(userApiKey, request);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid API key or user not authenticated' },
        { status: 403 }
      );
    }

    console.log(`✅ [PREVIEW] User authenticated, proceeding without credit check`);

    // Load APIs data
    const apisData = await getApisData();
    
    // Build the endpoint path from the dynamic route
    const endpointPath = '/' + endpoint.join('/');
    
    // Find the matching API by path
    const matchingApi = apisData.apis.find(api => {
      const apiPath = new URL(api.endpoint).pathname;
      return apiPath === endpointPath || apiPath.endsWith(endpointPath);
    });

    if (!matchingApi) {
      return NextResponse.json(
        { error: `Preview API endpoint not found: ${endpointPath}` },
        { status: 404 }
      );
    }

    // Remove api_key from searchParams to avoid passing it to the target API
    searchParams.delete('api_key');
    
    // Build target URL with original API key
    const targetUrl = new URL(matchingApi.endpoint);
    targetUrl.search = searchParams.toString();
    targetUrl.searchParams.set('api_key', matchingApi.apiKey);

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TopLedger-API-Preview/1.0',
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

    console.log(`🎭 [PREVIEW] Making preview call to: ${targetUrl.toString()}`);

    try {
      // Make request to the actual Top Ledger API
      const response = await fetch(targetUrl.toString(), requestOptions);
      
      if (!response.ok) {
        const errorMessage = `Top Ledger API error: ${response.status} ${response.statusText}`;
        console.log(`❌ [PREVIEW] API error: ${errorMessage}`);
        
        return NextResponse.json(
          { error: errorMessage },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      // Truncate response for preview if it's too large
      let previewData = data;
      if (data?.query_result?.data?.rows && Array.isArray(data.query_result.data.rows)) {
        if (data.query_result.data.rows.length > 5) {
          previewData = {
            ...data,
            query_result: {
              ...data.query_result,
              data: {
                ...data.query_result.data,
                rows: data.query_result.data.rows.slice(0, 5)
              }
            },
            _preview_note: "Response truncated for preview. Full data available in actual API calls."
          };
        }
      }

      console.log(`✅ [PREVIEW] Successful preview response returned (NO CREDITS CONSUMED)`);

      // Return the response with CORS headers and preview indicator
      return NextResponse.json(previewData, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
          'X-TL-Preview-Mode': 'true',
        },
      });

    } catch (fetchError) {
      console.error('❌ [PREVIEW] Network or parsing error:', fetchError);
      return NextResponse.json(
        { error: 'Network or parsing error in preview mode' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [PREVIEW] Error in preview API wrapper:', error);
    return NextResponse.json(
      { error: 'Internal server error in preview mode' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
