import { NextResponse } from 'next/server';
import { getApiDataFromS3, isS3Configured } from '@/lib/s3';

interface ApiItem {
  endpoint: string;
  apiKey: string;
  title: string;
  subtitle: string;
  page: string;
  pageName: string;
  menuId: string;
  menuName: string;
  responseColumns?: Array<{
    name: string;
    type: string;
    description?: string;
    example?: string;
  }>;
  description?: string;
}

interface ApiData {
  totalApis: number;
  extractedAt: string;
  apis: ApiItem[];
}

interface WrappedApi {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  wrapperUrl: string;
  menuName: string;
  pageName: string;
  page: string; // Added: needed for project filtering
  method: string;
  originalUrl: string;
  responseColumns?: Array<{
    name: string;
    type: string;
    description?: string;
    example?: string;
  }>;
  description?: string;
}

export async function GET() {
  try {
    let apisData: ApiData;

    // Only load from S3, no fallback
    if (!isS3Configured()) {
      console.log('❌ S3 not configured, returning empty API list');
      return NextResponse.json({
        totalApis: 0,
        extractedAt: new Date().toISOString(),
        apis: [],
      });
    }

    console.log('✅ S3 configured, attempting to load API data from S3...');
    try {
      apisData = await getApiDataFromS3();
      console.log('✅ Successfully loaded API data from S3 (admin/api-data/api-data.json)');
      console.log('📊 Sample API item with columns:', apisData.apis[0]);
    } catch (s3Error) {
      console.error('❌ Failed to load from S3:', s3Error);
      // Return empty list instead of falling back
      return NextResponse.json({
        totalApis: 0,
        extractedAt: new Date().toISOString(),
        apis: [],
      });
    }

    // Transform APIs to wrapper format
    const wrappedApis: WrappedApi[] = apisData.apis.map((api, index) => {
      const originalUrl = new URL(api.endpoint);
      const apiPath = originalUrl.pathname;
      
      // Create wrapper URL
      const wrapperPath = `/api/tl${apiPath}`;

      return {
        id: `tl_api_${index + 1}`,
        title: api.title,
        subtitle: api.subtitle,
        path: apiPath,
        wrapperUrl: wrapperPath,
        menuName: api.menuName,
        pageName: api.pageName,
        page: api.page, // Added: pass through the page field for project filtering
        method: 'GET', // Most Top Ledger APIs are GET, but can handle POST too
        originalUrl: api.endpoint,
        responseColumns: api.responseColumns,
        description: api.description,
      };
    });

    return NextResponse.json({
      totalApis: wrappedApis.length,
      extractedAt: apisData.extractedAt,
      apis: wrappedApis,
    });

  } catch (error) {
    console.error('Error loading wrapped APIs:', error);
    return NextResponse.json(
      { error: 'Failed to load APIs' },
      { status: 500 }
    );
  }
}
