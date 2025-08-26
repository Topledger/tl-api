import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
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
  method: string;
  originalUrl: string;
}

export async function GET() {
  try {
    let apisData: ApiData;

    // Try to load from S3 first, fall back to local file
    if (isS3Configured()) {
      console.log('✅ S3 configured, attempting to load API data from S3...');
      try {
        apisData = await getApiDataFromS3();
        console.log('✅ Successfully loaded API data from S3 (admin/api-data/api-data.json)');
      } catch (s3Error) {
        console.error('❌ Failed to load from S3, falling back to local file:', s3Error);
        // Fall back to local file
        const apisPath = path.join(process.cwd(), 'public', 'apis_list.json');
        console.log('📁 Loading from local file:', apisPath);
        const fileData = fs.readFileSync(apisPath, 'utf8');
        apisData = JSON.parse(fileData);
        console.log('✅ Successfully loaded from local fallback file');
      }
    } else {
      
      // Load from local file
      throw new Error('failed to load');
     
      
      
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
        method: 'GET', // Most Top Ledger APIs are GET, but can handle POST too
        originalUrl: api.endpoint,
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
