import { NextRequest, NextResponse } from 'next/server';
import { getApiDataFromS3 } from '@/lib/s3';

interface ApiData {
  apis: Array<{
    id: string;
    endpoint: string;
    apiKey: string;
    [key: string]: any;
  }>;
}

// Load API data from S3
async function getApisData(): Promise<ApiData> {
  try {
    return await getApiDataFromS3();
  } catch (error) {
    console.error('Error loading API data from S3:', error);
    
    // Fallback to local file
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'data', 'api-endpoints.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileData);
  }
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
    
    // Find the matching API by path
    const matchingApi = apisData.apis.find(api => {
      const apiPath = new URL(api.endpoint).pathname;
      return apiPath === endpointPath || apiPath.endsWith(endpointPath);
    });

    if (!matchingApi) {
      return NextResponse.json(
        { error: `Documentation preview endpoint not found: ${endpointPath}` },
        { status: 404 }
      );
    }

    // Get query parameters (excluding any api_key if provided)
    const { searchParams } = new URL(request.url);
    searchParams.delete('api_key'); // Remove any api_key to prevent exposure
    
    // Build target URL with the stored API key (hidden from client)
    const targetUrl = new URL(matchingApi.endpoint);
    targetUrl.search = searchParams.toString();
    targetUrl.searchParams.set('api_key', matchingApi.apiKey);

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
