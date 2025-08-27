import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isS3Configured, getUserApiKeysFromS3, getApiDataFromS3 } from '@/lib/s3';
import { logApiCall, prisma } from '@/lib/db';

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

// Validate user API key with database lookup
async function validateUserApiKey(userApiKey: string, request: NextRequest): Promise<{ isValid: boolean; userId?: string }> {
  try {
    console.log(`🔐 Validating API key: ${userApiKey}`);

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
      console.log(`✅ Valid API key found in database: ${apiKey.name} for user: ${apiKey.user.email}`);
      return { isValid: true, userId: apiKey.userId };
    }

    // Fallback to old session-based validation for backward compatibility
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const userId = session.user.email.replace('@', '_').replace('.', '_');
      console.log(`🔐 Trying session-based validation for user: ${userId}`);

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
    }

    console.log(`❌ Invalid API key: ${userApiKey}`);
    return { isValid: false };
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

// Log API usage for authenticated user - New Database Version
async function logApiUsageToDatabase(
  userApiKey: string, 
  apiId: string, 
  userId: string, 
  method: string,
  statusCode: number,
  responseTime?: number,
  userAgent?: string,
  ipAddress?: string,
  errorMessage?: string
) {
  try {
    console.log(`📊 Logging API usage to database for user: ${userId}, API: ${apiId}`);
    
    // Find the API key record in database
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
      console.log(`⚠️ API key not found in database: ${userApiKey}`);
      return;
    }

    // Use the actual user ID from the API key relationship
    const actualUserId = apiKey.userId;

    // Log the API call to database
    await logApiCall({
      userId: actualUserId,
      apiKeyId: apiKey.id,
      endpoint: apiId,
      method,
      statusCode,
      responseTime,
      userAgent,
      ipAddress,
      errorMessage
    });

    console.log('✅ API usage logged to database');
  } catch (error) {
    console.error('Error logging API usage to database:', error);
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
    
    // Create the wrapped endpoint path that users see
    const wrappedEndpointPath = `/api/tl${endpointPath}`;
    
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

    // Track start time for response time measurement
    const startTime = Date.now();
    let statusCode = 200;
    let errorMessage: string | undefined;

    try {
      // Make request to the actual Top Ledger API
      const response = await fetch(targetUrl.toString(), requestOptions);
      statusCode = response.status;
      
      if (!response.ok) {
        errorMessage = `Top Ledger API error: ${response.status} ${response.statusText}`;
        
        // Log failed API call
        await logApiUsageToDatabase(
          userApiKey, 
          wrappedEndpointPath, 
          userId!, 
          method,
          statusCode,
          Date.now() - startTime,
          request.headers.get('user-agent') || undefined,
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          errorMessage
        );

        return NextResponse.json(
          { error: errorMessage },
          { status: response.status }
        );
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      // Log successful API call to database
      await logApiUsageToDatabase(
        userApiKey, 
        wrappedEndpointPath, 
        userId!, 
        method,
        statusCode,
        responseTime,
        request.headers.get('user-agent') || undefined,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      );

      // Return the response with CORS headers
      return NextResponse.json(data, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        },
      });

    } catch (fetchError) {
      statusCode = 500;
      errorMessage = 'Network or parsing error';
      
      // Log failed API call
      await logApiUsageToDatabase(
        userApiKey, 
        matchingApi.endpoint, 
        userId!, 
        method,
        statusCode,
        Date.now() - startTime,
        request.headers.get('user-agent') || undefined,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        errorMessage
      );

      throw fetchError; // Re-throw to be caught by outer try-catch
    }

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
