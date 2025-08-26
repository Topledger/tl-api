import { NextRequest, NextResponse } from 'next/server';
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

// Load APIs data
function getApisData(): ApiData {
  const apisPath = path.join(process.cwd(), 'public', 'apis_list.json');
  const fileData = fs.readFileSync(apisPath, 'utf8');
  return JSON.parse(fileData);
}

// Validate user API key
async function validateUserApiKey(userApiKey: string): Promise<boolean> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileData);
    
    // Always use the default user data for now
    const userData = data.users?.user_lokesh_tiwari;
    
    if (!userData || !Array.isArray(userData.apiKeys)) {
      return false;
    }

    // Check if the user API key exists
    return userData.apiKeys.some((key: any) => key.key === userApiKey);
  } catch (error) {
    console.error('Error validating API key:', error);
    return false;
  }
}

// Log API usage
async function logApiUsage(userApiKey: string, apiId: string) {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileData);
    
    const userData = data.users?.user_lokesh_tiwari;
    if (!userData || !Array.isArray(userData.apiKeys)) {
      return;
    }

    // Find the user's API key and increment usage
    const keyIndex = userData.apiKeys.findIndex((key: any) => key.key === userApiKey);
    if (keyIndex !== -1) {
      userData.apiKeys[keyIndex].totalHits = (userData.apiKeys[keyIndex].totalHits || 0) + 1;
      userData.apiKeys[keyIndex].lastUsed = new Date().toISOString().split('T')[0];
      
      // Add to daily hits
      const today = new Date().toISOString().split('T')[0];
      if (!Array.isArray(userData.apiKeys[keyIndex].dailyHits)) {
        userData.apiKeys[keyIndex].dailyHits = [];
      }
      
      const todayHit = userData.apiKeys[keyIndex].dailyHits.find((hit: any) => hit.date === today);
      if (todayHit) {
        todayHit.hits++;
      } else {
        userData.apiKeys[keyIndex].dailyHits.push({ date: today, hits: 1 });
      }
    }

    // Update usage data
    if (!Array.isArray(userData.usageData)) {
      userData.usageData = [];
    }
    
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = userData.usageData.find((usage: any) => usage.date === today);
    if (todayUsage) {
      todayUsage.requests++;
    } else {
      userData.usageData.push({ date: today, requests: 1 });
    }

    // Update credits
    if (userData.credits) {
      userData.credits.used = (userData.credits.used || 0) + 1;
      userData.credits.remaining = Math.max(0, (userData.credits.remaining || 0) - 1);
    }

    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error logging API usage:', error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { endpoint: string[] } }
) {
  return handleRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { endpoint: string[] } }
) {
  return handleRequest(request, params, 'POST');
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

    // Validate user API key
    const isValidKey = await validateUserApiKey(userApiKey);
    if (!isValidKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 403 }
      );
    }

    // Load APIs data
    const apisData = getApisData();
    
    // Build the endpoint path from the dynamic route
    const endpointPath = '/' + endpoint.join('/');
    
    // Find the matching API by path
    const matchingApi = apisData.apis.find(api => {
      const apiPath = new URL(api.endpoint).pathname;
      return apiPath === endpointPath || apiPath.endsWith(endpointPath);
    });

    if (!matchingApi) {
      return NextResponse.json(
        { error: `API endpoint not found: ${endpointPath}` },
        { status: 404 }
      );
    }

    // Log API usage
    await logApiUsage(userApiKey, matchingApi.endpoint);

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

    // Make request to the actual Top Ledger API
    const response = await fetch(targetUrl.toString(), requestOptions);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Top Ledger API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the response with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
      },
    });

  } catch (error) {
    console.error('Error in API wrapper:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
