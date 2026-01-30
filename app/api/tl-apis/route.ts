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
        '/api/helium/queries/14744/results': [
          { name: 'height', type: 'integer', description: 'Block height on Helium L1', example: '12345' },
          { name: 'time', type: 'string', description: 'Human readable block time', example: '2022-08-04 12:00:00' },
          { name: 'timestamp', type: 'string', description: 'Block timestamp', example: '2022-08-04T12:00:00Z' },
          { name: 'prev_hash', type: 'string', description: 'Previous block hash', example: '0xabc123...' },
          { name: 'block_hash', type: 'string', description: 'Current block hash', example: '0x123abc...' },
          { name: 'transaction_count', type: 'integer', description: 'Number of transactions in block', example: '15' },
          { name: 'hbbft_round', type: 'integer', description: 'HBBFT consensus round', example: '100' },
          { name: 'election_epoch', type: 'integer', description: 'Election epoch number', example: '5' },
          { name: 'epoch_start', type: 'string', description: 'Epoch start indicator', example: 'true/false' },
        ],
        '/api/helium/queries/14745/results': [
          { name: 'transaction_hash', type: 'string', description: 'Hash of the transaction', example: '0x456def...' },
          { name: 'block_number', type: 'integer', description: 'Block number containing transaction', example: '11431' },
          { name: 'from_address', type: 'string', description: 'Sender address', example: '0x789ghi...' },
          { name: 'to_address', type: 'string', description: 'Recipient address', example: '0xabcjkl...' },
          { name: 'amount', type: 'number', description: 'Transaction amount', example: '1.5' },
          { name: 'gas_used', type: 'integer', description: 'Gas used by transaction', example: '21000' },
          { name: 'timestamp', type: 'string', description: 'Transaction timestamp', example: '2022-08-04T12:00:00Z' },
        ],
        // Helium Oracle APIs (generic columns - will be updated with real data)
        '/api/helium/oracle/iot/entropy': [
          { name: 'block_date', type: 'date', description: 'Block date for the data', example: '2026-01-01' },
          { name: 'table_name', type: 'string', description: 'Source table name', example: 'helium_oracle_iot_entropy' },
          { name: 'record_count', type: 'integer', description: 'Number of records', example: '5432' },
          { name: 'data_size_bytes', type: 'integer', description: 'Data size in bytes', example: '524288' },
          { name: 'last_updated', type: 'timestamp', description: 'Last update timestamp', example: '2026-01-01T12:00:00Z' },
        ],
        '/api/helium/oracle/iot/gatewayrewardshare': [
          { name: 'block_date', type: 'date', description: 'Block date for the data', example: '2026-01-01' },
          { name: 'gateway_address', type: 'string', description: 'Gateway address', example: '0x123abc...' },
          { name: 'reward_amount', type: 'number', description: 'Reward amount', example: '1.5' },
          { name: 'share_percentage', type: 'number', description: 'Reward share percentage', example: '0.15' },
        ],
        '/api/helium/oracle/iot/beaconingreport': [
          { name: 'block_date', type: 'date', description: 'Block date for the data', example: '2026-01-01' },
          { name: 'beacon_id', type: 'string', description: 'Beacon identifier', example: 'beacon_123' },
          { name: 'signal_strength', type: 'number', description: 'Signal strength', example: '-85.5' },
          { name: 'location_accuracy', type: 'number', description: 'Location accuracy in meters', example: '10.5' },
        ],
        '/api/helium/oracle/iot/invalidbeaconreport': [
          { name: 'block_date', type: 'date', description: 'Block date for the data', example: '2026-01-01' },
          { name: 'beacon_id', type: 'string', description: 'Invalid beacon identifier', example: 'beacon_456' },
          { name: 'reason', type: 'string', description: 'Reason for invalidity', example: 'Low signal strength' },
          { name: 'error_code', type: 'integer', description: 'Error code', example: '404' },
        ],
        '/api/helium/oracle/iot/invalidwitnessreport': [
          { name: 'block_date', type: 'date', description: 'Block date for the data', example: '2026-01-01' },
          { name: 'witness_id', type: 'string', description: 'Invalid witness identifier', example: 'witness_789' },
          { name: 'reason', type: 'string', description: 'Reason for invalidity', example: 'Distance too far' },
          { name: 'distance', type: 'number', description: 'Distance in km', example: '15.2' },
        ],
        '/api/helium/oracle/iot/poc': [
          { name: 'block_date', type: 'date', description: 'Block date for the data', example: '2026-01-01' },
          { name: 'hotspot_address', type: 'string', description: 'Hotspot address', example: '0xabc123...' },
          { name: 'poc_score', type: 'number', description: 'Proof of Coverage score', example: '0.95' },
          { name: 'challenge_count', type: 'integer', description: 'Number of challenges', example: '24' },
        ],
        '/api/helium/oracle/iot/rewardshare': [
          { name: 'block_date', type: 'date', description: 'Block date for the data', example: '2026-01-01' },
          { name: 'participant_address', type: 'string', description: 'Participant address', example: '0xdef456...' },
          { name: 'reward_amount', type: 'number', description: 'IoT reward amount', example: '2.5' },
          { name: 'activity_type', type: 'string', description: 'Type of IoT activity', example: 'data_transfer' },
        ],
        '/api/helium/oracle/iot/witnessingreport': [
          { name: 'block_date', type: 'date', description: 'Block date for the data', example: '2026-01-01' },
          { name: 'witness_address', type: 'string', description: 'Witness hotspot address', example: '0x789def...' },
          { name: 'signal_strength', type: 'number', description: 'Witness signal strength', example: '-75.2' },
          { name: 'frequency', type: 'number', description: 'Radio frequency', example: '915.0' },
        ],
        '/api/helium/oracle/iot/packetreport': [
          { name: 'block_date', type: 'date', description: 'Block date for the data', example: '2026-01-01' },
          { name: 'packet_id', type: 'string', description: 'Packet identifier', example: 'pkt_123456' },
          { name: 'payload_size', type: 'integer', description: 'Payload size in bytes', example: '128' },
          { name: 'gateway_address', type: 'string', description: 'Gateway that received packet', example: '0x123ghi...' },
        ],
        '/api/helium/oracle/iot/rewardmanifest': [
          { name: 'block_date', type: 'date', description: 'Block date for the data', example: '2026-01-01' },
          { name: 'manifest_id', type: 'string', description: 'Reward manifest identifier', example: 'manifest_iot_123' },
          { name: 'total_rewards', type: 'number', description: 'Total IoT rewards', example: '1000.5' },
          { name: 'participant_count', type: 'integer', description: 'Number of participants', example: '150' },
        ],
        '/api/helium/oracle/mobile/cellspeedtest': [
          { name: 'block_date', type: 'date', description: 'Block date for the data', example: '2026-01-01' },
          { name: 'cell_id', type: 'string', description: 'Cell tower identifier', example: 'cell_mobile_123' },
          { name: 'download_speed', type: 'number', description: 'Download speed in Mbps', example: '45.2' },
          { name: 'upload_speed', type: 'number', description: 'Upload speed in Mbps', example: '12.8' },
        ],
        '/api/helium/oracle/mobile/datatransfer': [
          { name: 'block_date', type: 'date', description: 'Block date for the data', example: '2026-01-01' },
          { name: 'session_id', type: 'string', description: 'Data transfer session ID', example: 'session_456' },
          { name: 'bytes_transferred', type: 'integer', description: 'Bytes transferred', example: '1048576' },
          { name: 'duration_seconds', type: 'integer', description: 'Session duration in seconds', example: '3600' },
        ],
        '/api/helium/oracle/mobile/rewardshare': [
          { name: 'block_date', type: 'date', description: 'Block date for the data', example: '2026-01-01' },
          { name: 'participant_address', type: 'string', description: 'Mobile participant address', example: '0xabc789...' },
          { name: 'reward_amount', type: 'number', description: 'Mobile reward amount', example: '3.2' },
          { name: 'service_type', type: 'string', description: 'Type of mobile service', example: '5G_coverage' },
        ],
        '/api/helium/oracle/mobile/rewardmanifest': [
          { name: 'block_date', type: 'date', description: 'Block date for the data', example: '2026-01-01' },
          { name: 'manifest_id', type: 'string', description: 'Mobile reward manifest ID', example: 'manifest_mobile_456' },
          { name: 'total_rewards', type: 'number', description: 'Total mobile rewards', example: '2500.75' },
          { name: 'coverage_area', type: 'string', description: 'Coverage area', example: 'urban_zone_1' },
        ],
        '/api/helium/oracle/mobile/speedtestavg': [
          { name: 'block_date', type: 'date', description: 'Block date for the data', example: '2026-01-01' },
          { name: 'region', type: 'string', description: 'Geographic region', example: 'north_america' },
          { name: 'avg_download_speed', type: 'number', description: 'Average download speed', example: '42.5' },
          { name: 'avg_upload_speed', type: 'number', description: 'Average upload speed', example: '15.3' },
        ],
        '/api/helium/oracle/mobile/heartbeat': [
          { name: 'block_date', type: 'date', description: 'Block date for the data', example: '2026-01-01' },
          { name: 'hotspot_address', type: 'string', description: 'Mobile hotspot address', example: '0xdef123...' },
          { name: 'heartbeat_count', type: 'integer', description: 'Number of heartbeats', example: '144' },
          { name: 'uptime_percentage', type: 'number', description: 'Uptime percentage', example: '98.5' },
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

    // Helium APIs are now loaded from database along with other APIs

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
