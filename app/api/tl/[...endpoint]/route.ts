import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isS3Configured, getUserApiKeysFromS3, getApiDataFromS3 } from '@/lib/s3';

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
      console.log('🔄 Loading API data from S3 for wrapper...');
      return await getApiDataFromS3();
    } catch (error) {
      console.error('❌ Failed to load from S3, falling back to local file:', error);
    }
  }
  
  console.log('📁 Loading API data from local file for wrapper...');
  const apisPath = path.join(process.cwd(), 'public', 'apis_list.json');
  const fileData = fs.readFileSync(apisPath, 'utf8');
  return JSON.parse(fileData);
}

// Validate user API key with authentication
async function validateUserApiKey(userApiKey: string, request: NextRequest): Promise<{ isValid: boolean; userId?: string }> {
  try {
    // Get authenticated user from session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('❌ No authenticated session found');
      return { isValid: false };
    }

    const userId = session.user.email.replace('@', '_').replace('.', '_');
    console.log(`🔐 Validating API key for user: ${userId}`);

    let apiKeys: any[] = [];

    // Load user's API keys from S3 or local storage
    if (isS3Configured()) {
      try {
        console.log('📡 Loading user API keys from S3 for validation...');
        apiKeys = await getUserApiKeysFromS3(userId);
      } catch (error) {
        console.error('❌ Failed to load from S3, falling back to local storage:', error);
        apiKeys = await getApiKeysFromLocal(userId);
      }
    } else {
      console.log('📁 Loading user API keys from local storage for validation...');
      apiKeys = await getApiKeysFromLocal(userId);
    }

    // Check if the provided API key belongs to this user
    const isValid = apiKeys.some((key: any) => key.key === userApiKey);
    
    if (isValid) {
      console.log(`✅ Valid API key found for user: ${userId}`);
    } else {
      console.log(`❌ Invalid API key for user: ${userId}, checked ${apiKeys.length} keys`);
    }

    return { isValid, userId: isValid ? userId : undefined };
  } catch (error) {
    console.error('Error validating API key:', error);
    return { isValid: false };
  }
}

// Helper function to get API keys from local storage
async function getApiKeysFromLocal(userId: string): Promise<any[]> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileData);
    
    const userData = data.users?.[userId];
    if (!userData || !userData.apiKeys) {
      console.log(`📁 No local API keys found for user: ${userId}`);
      return [];
    }

    console.log(`📁 Loaded ${userData.apiKeys.length} API keys from local storage for user: ${userId}`);
    return userData.apiKeys;
  } catch (error) {
    console.error('Error reading local API keys:', error);
    return [];
  }
}

// Log API usage for authenticated user
async function logApiUsage(userApiKey: string, apiId: string, userId: string) {
  try {
    console.log(`📊 Logging API usage for user: ${userId}, API: ${apiId}`);
    
    // Load user's current API keys
    let apiKeys: any[] = [];
    
    if (isS3Configured()) {
      try {
        console.log('📡 Loading user API keys from S3 for usage logging...');
        apiKeys = await getUserApiKeysFromS3(userId);
      } catch (error) {
        console.error('❌ Failed to load from S3 for logging, falling back to local storage:', error);
        apiKeys = await getApiKeysFromLocal(userId);
      }
    } else {
      console.log('📁 Loading user API keys from local storage for usage logging...');
      apiKeys = await getApiKeysFromLocal(userId);
    }

    // Find and update the specific API key
    const keyIndex = apiKeys.findIndex((key: any) => key.key === userApiKey);
    if (keyIndex !== -1) {
      const today = new Date().toISOString().split('T')[0];
      
      // Update key usage stats
      apiKeys[keyIndex].totalHits = (apiKeys[keyIndex].totalHits || 0) + 1;
      apiKeys[keyIndex].lastUsed = today;
      
      // Add to daily hits
      if (!Array.isArray(apiKeys[keyIndex].dailyHits)) {
        apiKeys[keyIndex].dailyHits = [];
      }
      
      const todayHit = apiKeys[keyIndex].dailyHits.find((hit: any) => hit.date === today);
      if (todayHit) {
        todayHit.hits++;
      } else {
        apiKeys[keyIndex].dailyHits.push({ date: today, hits: 1 });
      }

      // Save updated API keys
      if (isS3Configured()) {
        try {
          const { saveUserApiKeysToS3 } = await import('@/lib/s3');
          console.log('📡 Saving updated API key usage to S3...');
          await saveUserApiKeysToS3(userId, apiKeys);
          console.log('✅ API usage logged to S3');
        } catch (error) {
          console.error('❌ Failed to save usage to S3, falling back to local storage:', error);
          await saveApiKeysToLocal(userId, apiKeys);
        }
      } else {
        console.log('📁 Saving updated API key usage to local storage...');
        await saveApiKeysToLocal(userId, apiKeys);
      }
    } else {
      console.log(`⚠️ API key not found for usage logging: ${userApiKey}`);
    }
  } catch (error) {
    console.error('Error logging API usage:', error);
  }
}

// Helper function to save API keys to local storage
async function saveApiKeysToLocal(userId: string, apiKeys: any[]): Promise<void> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'users.json');
    
    // Read existing data or create new structure
    let data: any = { users: {} };
    try {
      const fileData = fs.readFileSync(dataPath, 'utf8');
      data = JSON.parse(fileData);
    } catch (error) {
      console.log('Creating new users.json file for usage logging');
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(dataPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    }

    // Ensure users object exists
    if (!data.users) {
      data.users = {};
    }

    // Update user's API keys
    if (!data.users[userId]) {
      data.users[userId] = {};
    }
    
    data.users[userId].apiKeys = apiKeys;
    
    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log(`📁 Saved ${apiKeys.length} API keys with updated usage to local storage for user: ${userId}`);
  } catch (error) {
    console.error('Error saving local API keys with usage:', error);
    throw error;
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
    // Get user API key from query params or headers
    const { searchParams } = new URL(request.url);
    const userApiKey = searchParams.get('api_key') || request.headers.get('x-api-key');

    if (!userApiKey) {
      return NextResponse.json(
        { error: 'API key is required. Provide it as ?api_key=YOUR_KEY or X-API-Key header' },
        { status: 401 }
      );
    }

    // Validate user API key with authentication
    const { isValid, userId } = await validateUserApiKey(userApiKey, request);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid API key or user not authenticated' },
        { status: 403 }
      );
    }

    // Load APIs data (now async)
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
        { error: `API endpoint not found: ${endpointPath}` },
        { status: 404 }
      );
    }

    // Log API usage for the authenticated user
    await logApiUsage(userApiKey, matchingApi.endpoint, userId!);

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
