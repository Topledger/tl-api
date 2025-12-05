import { NextResponse } from 'next/server';
import { getApiDataFromS3, isS3Configured } from '@/lib/s3';
import { prisma } from '@/lib/db';

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
  page?: string; // Added: needed for project filtering (optional for database APIs)
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
    const wrappedApis: WrappedApi[] = [];
    let s3ApisData: ApiData | null = null;

    // Load APIs from S3
    if (isS3Configured()) {
      try {
    console.log('✅ S3 configured, attempting to load API data from S3...');
        s3ApisData = await getApiDataFromS3();
      console.log('✅ Successfully loaded API data from S3 (admin/api-data/api-data.json)');
        
        // Transform S3 APIs to wrapper format
        const s3WrappedApis: WrappedApi[] = (s3ApisData?.apis || []).map((api, index) => {
      const originalUrl = new URL(api.endpoint);
      const apiPath = originalUrl.pathname;
      
      // Create wrapper URL
      const wrapperPath = `/api/tl${apiPath}`;

          const wrappedApi: WrappedApi = {
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
            responseColumns: api.responseColumns || undefined, // Ensure responseColumns are included
        description: api.description,
          };

          // Log if responseColumns exist for debugging
          if (wrappedApi.responseColumns && wrappedApi.responseColumns.length > 0) {
            console.log(`✅ [API-LOAD] API "${api.title}" has ${wrappedApi.responseColumns.length} response columns`);
          }

          return wrappedApi;
        });

        wrappedApis.push(...s3WrappedApis);
      } catch (s3Error) {
        console.error('❌ Failed to load from S3:', s3Error);
      }
    }

    // Load APIs from database (for trading APIs and any other DB-stored APIs)
    try {
      const dbApis = await prisma.apiEndpoint.findMany({
        where: {
          isActive: true,
        },
      });

      console.log(`✅ Loaded ${dbApis.length} APIs from database`);

      // Define response columns for trading APIs
      const tradingApiResponseColumns: Record<string, Array<{
        name: string;
        type: string;
        description?: string;
        example?: string;
      }>> = {
        '/api/top-traders/{mint}': [
          { name: 'wallet_address', type: 'string', description: 'The wallet address of the trader', example: 'FXSeErxiB6Jp3L9ZfuUU9SSwx7oKwpveQbPNf6XkP9XA' },
          { name: 'realized_pnl_usd', type: 'number', description: 'Realized profit/loss in USD', example: '0.00919376778343971' },
          { name: 'realized_pnl_pct', type: 'number', description: 'Realized profit/loss as percentage', example: '0.019780505391615234' },
          { name: 'unrealized_pnl_usd', type: 'number', description: 'Unrealized profit/loss in USD', example: '0' },
          { name: 'unrealized_pnl_pct', type: 'number', description: 'Unrealized profit/loss as percentage', example: '0' },
          { name: 'first_buy_ts', type: 'number', description: 'Timestamp of first buy transaction', example: '1764921238' },
          { name: 'last_activity_token_ts', type: 'number', description: 'Timestamp of last token activity', example: '1764921290' },
          { name: 'last_activity_total_ts', type: 'number', description: 'Timestamp of last total activity', example: '1764923893' },
          { name: 'buy_count', type: 'number', description: 'Number of buy transactions', example: '1' },
          { name: 'sell_count', type: 'number', description: 'Number of sell transactions', example: '1' },
          { name: 'bought_usd', type: 'number', description: 'Total amount bought in USD', example: '46.47893267346374' },
          { name: 'sold_usd', type: 'number', description: 'Total amount sold in USD', example: '46.488126441247175' },
          { name: 'bought_tokens', type: 'number', description: 'Total tokens bought', example: '11762053.867591' },
          { name: 'sold_tokens', type: 'number', description: 'Total tokens sold', example: '11762053.867591' },
          { name: 'bought_native', type: 'number', description: 'Total native tokens (SOL) bought', example: '0.332499999' },
          { name: 'sold_native', type: 'number', description: 'Total native tokens (SOL) sold', example: '0.332499998' },
          { name: 'transferred_amount', type: 'number', description: 'Amount of tokens transferred', example: '0' },
          { name: 'current_token_balance', type: 'number', description: 'Current token balance', example: '0' },
          { name: 'token_balance_usd', type: 'number', description: 'Current token balance in USD', example: '0' },
          { name: 'current_sol_balance', type: 'number', description: 'Current SOL balance', example: '0.035941303' },
        ],
        '/api/top-holders/{mint}': [
          { name: 'wallet_address', type: 'string', description: 'The wallet address of the holder', example: 'dtrzJPj7yDdvm6eRqBAgxsK2sMJeD9HhBEBB3XMedXy' },
          { name: 'current_token_balance', type: 'number', description: 'Current token balance held', example: '35323.892708' },
          { name: 'token_balance_usd', type: 'number', description: 'Current token balance in USD', example: '0.13762012203627877' },
          { name: 'holder_rank', type: 'number', description: 'Rank of the holder (1 = top holder)', example: '1' },
          { name: 'unrealized_pnl_usd', type: 'number', description: 'Unrealized profit/loss in USD', example: '-0.00006222274372122416' },
          { name: 'unrealized_pnl_pct', type: 'number', description: 'Unrealized profit/loss as percentage', example: '-0.045192972142251576' },
          { name: 'realized_pnl_usd', type: 'number', description: 'Realized profit/loss in USD', example: '0.0' },
          { name: 'realized_pnl_pct', type: 'number', description: 'Realized profit/loss as percentage', example: '0.0' },
          { name: 'first_buy_timestamp', type: 'number', description: 'Timestamp of first buy transaction', example: '1764925534' },
          { name: 'last_activity_timestamp', type: 'number', description: 'Timestamp of last activity for this token', example: '1764925534' },
          { name: 'last_global_activity_timestamp', type: 'number', description: 'Timestamp of last global activity', example: '1764925534' },
          { name: 'buy_count', type: 'number', description: 'Number of buy transactions', example: '1' },
          { name: 'sell_count', type: 'number', description: 'Number of sell transactions', example: '0' },
          { name: 'bought_usd', type: 'number', description: 'Total amount bought in USD', example: '0.13768234478' },
          { name: 'sold_usd', type: 'number', description: 'Total amount sold in USD', example: '0.0' },
          { name: 'bought_tokens', type: 'number', description: 'Total tokens bought', example: '35323.892708' },
          { name: 'sold_tokens', type: 'number', description: 'Total tokens sold', example: '0.0' },
          { name: 'bought_native', type: 'number', description: 'Total native tokens (SOL) bought', example: '0.001' },
          { name: 'sold_native', type: 'number', description: 'Total native tokens (SOL) sold', example: '0.0' },
          { name: 'current_sol_balance', type: 'number', description: 'Current SOL balance', example: '21.608882322' },
          { name: 'transferred_amount', type: 'number', description: 'Amount of tokens transferred', example: '0.0' },
        ],
      };

      // Transform database APIs to wrapper format
      const dbWrappedApis: WrappedApi[] = dbApis.map((api, index) => {
        // Get response columns for trading APIs
        const responseColumns = tradingApiResponseColumns[api.path] || undefined;

        return {
          id: `db_api_${api.id}`,
          title: api.title,
          subtitle: api.subtitle || '',
          path: api.path,
          wrapperUrl: api.wrapperUrl,
          menuName: api.menuName,
          pageName: api.pageName,
          page: undefined, // Database APIs don't have page field
          method: api.method,
          originalUrl: api.originalUrl,
          responseColumns: responseColumns, // Add response columns for trading APIs
          description: api.subtitle || undefined,
        };
      });

      wrappedApis.push(...dbWrappedApis);
    } catch (dbError) {
      console.error('❌ Failed to load from database:', dbError);
    }

    // Remove duplicates based on path (database APIs take precedence, but preserve responseColumns from S3)
    const uniqueApis = new Map<string, WrappedApi>();
    
    // First add S3 APIs
    const s3Apis = wrappedApis.filter(api => api.id.startsWith('tl_api_'));
    s3Apis.forEach(api => {
      uniqueApis.set(api.path, api);
    });

    // Then add database APIs (will overwrite S3 APIs if path matches, but preserve responseColumns)
    const dbApis = wrappedApis.filter(api => api.id.startsWith('db_api_'));
    dbApis.forEach(api => {
      const existingApi = uniqueApis.get(api.path);
      // If there's an existing S3 API with responseColumns, preserve them
      if (existingApi && existingApi.responseColumns && existingApi.responseColumns.length > 0) {
        uniqueApis.set(api.path, {
          ...api,
          responseColumns: existingApi.responseColumns, // Preserve responseColumns from S3
        });
      } else {
        uniqueApis.set(api.path, api);
      }
    });

    const finalApis = Array.from(uniqueApis.values());

    return NextResponse.json({
      totalApis: finalApis.length,
      extractedAt: s3ApisData?.extractedAt || new Date().toISOString(),
      apis: finalApis,
    });

  } catch (error) {
    console.error('Error loading wrapped APIs:', error);
    return NextResponse.json(
      { error: 'Failed to load APIs' },
      { status: 500 }
    );
  }
}
