import { NextResponse } from 'next/server';
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
    // Load APIs data
    const apisPath = path.join(process.cwd(), 'public', 'apis_list.json');
    const fileData = fs.readFileSync(apisPath, 'utf8');
    const apisData: ApiData = JSON.parse(fileData);

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
