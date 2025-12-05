import { NextRequest, NextResponse } from 'next/server';
import { getApiDataFromS3, isS3Configured } from '@/lib/s3';
import { prisma } from '@/lib/db';

interface ApiData {
  apis: Array<{
    id: string;
    endpoint: string;
    apiKey: string;
    [key: string]: any;
  }>;
}

// Load API data from S3 and database
async function getApisData(): Promise<ApiData> {
  const allApis: Array<{ id: string; endpoint: string; apiKey: string; [key: string]: any }> = [];
  
  // Load from S3
  if (isS3Configured()) {
    try {
      const s3Data = await getApiDataFromS3();
      allApis.push(...s3Data.apis);
    } catch (error) {
      console.error('Error loading API data from S3:', error);
    }
  }
  
  // Fallback to local file if S3 failed
  if (allApis.length === 0) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'data', 'api-endpoints.json');
      const fileData = fs.readFileSync(filePath, 'utf8');
      const localData = JSON.parse(fileData);
      allApis.push(...localData.apis);
    } catch (error) {
      console.error('Error loading from local file:', error);
    }
  }
  
  // Load from database
  try {
    const dbApis = await prisma.apiEndpoint.findMany({
      where: { isActive: true },
    });
    
    const dbApiItems = dbApis.map(api => ({
      id: api.id,
      endpoint: api.originalUrl,
      apiKey: '', // Database APIs don't have stored API key
      title: api.title,
      subtitle: api.subtitle,
      menuName: api.menuName,
      pageName: api.pageName,
    }));
    
    allApis.push(...dbApiItems);
  } catch (error) {
    console.error('Error loading from database:', error);
  }
  
  return { apis: allApis };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  try {
    const resolvedParams = await params;
    console.log('📖 [DOCS-PREVIEW] Processing docs preview request - NO API KEY REQUIRED');

    // Load APIs data
    const apisData = await getApisData();
    
    // Build the endpoint path from the dynamic route
    const endpointPath = '/' + resolvedParams.endpoint.join('/');
    
    // Find the matching API by path (handle path parameters like {mint})
    let matchingApi: { id: string; endpoint: string; apiKey: string; [key: string]: any } | null = null;
    let pathParams: Record<string, string> = {};
    
    for (const api of apisData.apis) {
      try {
        const apiUrl = new URL(api.endpoint);
        const apiPath = apiUrl.pathname;
        
        // Check for exact match
        if (apiPath === endpointPath) {
          matchingApi = api;
          break;
        }
        
        // Check for path parameter match (e.g., /api/top-traders/{mint} matches /api/top-traders/ABC123)
        const apiPathParts = apiPath.split('/').filter(p => p);
        const endpointPathParts = endpointPath.split('/').filter(p => p);
        
        if (apiPathParts.length === endpointPathParts.length) {
          let matches = true;
          const params: Record<string, string> = {};
          
          for (let i = 0; i < apiPathParts.length; i++) {
            if (apiPathParts[i].startsWith('{') && apiPathParts[i].endsWith('}')) {
              // This is a parameter placeholder
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
            break;
          }
        }
      } catch (error) {
        // Skip invalid URLs
        continue;
      }
    }

    if (!matchingApi) {
      return NextResponse.json(
        { error: `Documentation preview endpoint not found: ${endpointPath}` },
        { status: 404 }
      );
    }

    // Get query parameters (excluding any api_key if provided)
    const { searchParams } = new URL(request.url);
    searchParams.delete('api_key'); // Remove any api_key to prevent exposure
    
    // Build target URL with path parameters replaced
    let targetUrlString = matchingApi.endpoint;
    
    // Replace path parameters in the URL
    Object.entries(pathParams).forEach(([key, value]) => {
      targetUrlString = targetUrlString.replace(`{${key}}`, value);
    });
    
    const targetUrl = new URL(targetUrlString);
    targetUrl.search = searchParams.toString();
    
    // Only add API key if it exists (database APIs might not have one)
    if (matchingApi.apiKey) {
      targetUrl.searchParams.set('api_key', matchingApi.apiKey);
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TopLedger-Docs-Preview/1.0',
      },
    };

    console.log(`📖 [DOCS-PREVIEW] Making docs preview call to: ${matchingApi.endpoint} (API key hidden)`);

    try {
      // Make request to the actual Top Ledger API
      const response = await fetch(targetUrl.toString(), requestOptions);
      
      if (!response.ok) {
        const errorMessage = `API error: ${response.status} ${response.statusText}`;
        console.log(`❌ [DOCS-PREVIEW] API error: ${errorMessage}`);
        
        return NextResponse.json(
          { 
            error: errorMessage,
            _docs_preview: true,
            _note: "This is a documentation preview. Actual API response may vary."
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      // Truncate response for documentation preview
      let previewData = data;
      if (data?.query_result?.data?.rows && Array.isArray(data.query_result.data.rows)) {
        if (data.query_result.data.rows.length > 3) {
          previewData = {
            ...data,
            query_result: {
              ...data.query_result,
              data: {
                ...data.query_result.data,
                rows: data.query_result.data.rows.slice(0, 3)
              }
            },
            _docs_preview: true,
            _note: "Response truncated for documentation preview. Full data available in actual API calls."
          };
        } else {
          previewData = {
            ...data,
            _docs_preview: true,
            _note: "This is a documentation preview."
          };
        }
      } else if (Array.isArray(data)) {
        // Handle direct array responses
        previewData = data.slice(0, 3);
        if (data.length > 3) {
          previewData.push({
            _docs_preview: true,
            _note: "Response truncated for documentation preview. Full data available in actual API calls."
          });
        }
      } else {
        // Add preview indicator to other response types
        previewData = {
          ...data,
          _docs_preview: true,
          _note: "This is a documentation preview."
        };
      }

      console.log(`✅ [DOCS-PREVIEW] Successful docs preview response returned`);

      // Return the response with CORS headers and docs preview indicator
      return NextResponse.json(previewData, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'X-TL-Docs-Preview': 'true',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      });

    } catch (fetchError) {
      console.error('❌ [DOCS-PREVIEW] Network or parsing error:', fetchError);
      return NextResponse.json(
        { 
          error: 'Network or parsing error in docs preview mode',
          _docs_preview: true 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [DOCS-PREVIEW] Error in docs preview API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error in docs preview mode',
        _docs_preview: true 
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
