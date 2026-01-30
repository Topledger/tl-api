import { NextRequest, NextResponse } from 'next/server';
import { prisma, checkUserCredits, deductUserCredits, logApiCall } from '@/lib/db';

// Mapping from URL paths to table_ref values
const pathToTableRef: Record<string, string> = {
  // IoT APIs
  'iot/entropy': 'helium_oracle_iot_entropy',
  'iot/gatewayrewardshare': 'helium_oracle_iot_gatewayrewardshare',
  'iot/beaconingreport': 'helium_oracle_iot_iotbeaconingestreport',
  'iot/invalidbeaconreport': 'helium_oracle_iot_iotinvalidbeaconreport',
  'iot/invalidwitnessreport': 'helium_oracle_iot_iotinvalidwitnessreport',
  'iot/poc': 'helium_oracle_iot_iotpoc',
  'iot/rewardshare': 'helium_oracle_iot_iotrewardshare',
  'iot/witnessingreport': 'helium_oracle_iot_iotwitnessingestreport',
  'iot/packetreport': 'helium_oracle_iot_packetreport',
  'iot/rewardmanifest': 'helium_oracle_iot_rewardmanifestiot',
  
  // Mobile APIs
  'mobile/cellspeedtest': 'helium_oracle_mobile_cellspeedtestingestreport',
  'mobile/datatransfer': 'helium_oracle_mobile_datatransfersessioningestreport',
  'mobile/rewardshare': 'helium_oracle_mobile_mobilerewardshare',
  'mobile/rewardmanifest': 'helium_oracle_mobile_rewardmanifestmobile',
  'mobile/speedtestavg': 'helium_oracle_mobile_speedtestavg',
  'mobile/heartbeat': 'helium_oracle_mobile_validatedheartbeat',
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathString = path.join('/');
    console.log(`🔍 Helium Oracle API request for path: ${pathString}`);
    
    // Get table_ref from path mapping
    const tableRef = pathToTableRef[pathString];
    if (!tableRef) {
      console.log(`❌ Unknown Helium Oracle path: ${pathString}`);
      return NextResponse.json(
        { error: `Unknown Helium Oracle API: ${pathString}` },
        { status: 404 }
      );
    }
    
    console.log(`📋 Using table_ref: ${tableRef}`);
    
    // Extract and validate API key
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('api_key');

    if (!apiKey) {
      console.log('❌ No API key provided');
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    console.log(`🔑 API key: ${apiKey.substring(0, 8)}...`);

    // Validate API key and check credits
    const userApiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        key: apiKey,
        isActive: true
      },
      include: {
        user: true
      }
    });

    if (!userApiKeyRecord) {
      console.log('❌ Invalid API key or user not authenticated');
      return NextResponse.json(
        { error: 'Invalid API key or user not authenticated' },
        { status: 401 }
      );
    }

    const userId = userApiKeyRecord.userId;
    const apiKeyId = userApiKeyRecord.id;

    // Check if user has sufficient credits
    const hasCredits = await checkUserCredits(userId, 1);
    if (!hasCredits) {
      console.log('❌ Insufficient credits');
      return NextResponse.json(
        { error: 'Insufficient credits. Please contact support to add more credits to your account.' },
        { status: 402 }
      );
    }

    console.log(`✅ User authenticated: ${userApiKeyRecord.user.email}, Credits available`);

    // Construct the endpoint path for database lookup
    const endpointPath = `/api/helium/oracle/${pathString}`;
    console.log(`🔍 Looking for endpoint path: ${endpointPath}`);

    // Find the API endpoint in database
    const apiEndpoint = await prisma.apiEndpoint.findUnique({
      where: { path: endpointPath },
    });

    if (!apiEndpoint) {
      console.log(`❌ Helium Oracle API not found in database for path: ${pathString}`);
      return NextResponse.json(
        { error: `Helium Oracle API not found for path: ${pathString}` },
        { status: 404 }
      );
    }

    console.log(`🗄️ Found API in database: ${apiEndpoint.title}`);
    console.log(`🎯 Original URL: ${apiEndpoint.originalUrl}`);

    // Parse request body for POST parameters
    let body;
    try {
      body = await request.json();
      console.log('📨 Request body:', JSON.stringify(body, null, 2));
    } catch (error) {
      console.log('❌ Invalid JSON in request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate required parameters
    if (!body.parameters || !body.parameters.block_date) {
      console.log('❌ Missing required block_date parameter');
      return NextResponse.json(
        { error: 'Missing required parameter: block_date is required' },
        { status: 400 }
      );
    }

    console.log(`📅 Block date: ${body.parameters.block_date}`);

    // Add table_ref to parameters
    const enhancedBody = {
      ...body,
      parameters: {
        ...body.parameters,
        table_ref: tableRef
      }
    };

    console.log(`📋 Enhanced body with table_ref: ${JSON.stringify(enhancedBody, null, 2)}`);

    // Use the Helium API key for query 14746
    const heliumApiKey = process.env.HELIUM_API_KEY_14746 || 'XyY8TpgWcqhvRMQ94VnYJYHpMgqka8QTkigUexvn';
    const externalUrl = `${apiEndpoint.originalUrl}?api_key=${heliumApiKey}`;

    console.log(`🌐 Making external request to: ${externalUrl}`);

    // Make the external API call
    const externalResponse = await fetch(externalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enhancedBody),
    });

    console.log(`📡 External API response status: ${externalResponse.status}`);

    if (!externalResponse.ok) {
      const errorText = await externalResponse.text();
      console.log(`❌ External API error: ${errorText}`);
      return NextResponse.json(
        { error: `External API error: ${errorText}` },
        { status: externalResponse.status }
      );
    }

    const responseData = await externalResponse.json();
    console.log(`✅ External API response received: ${JSON.stringify(responseData).length} characters`);

    // Deduct credit for successful API call
    await deductUserCredits(userId, 1);
    
    // Log the API call
    await logApiCall({
      userId: userId,
      apiKeyId: apiKeyId,
      endpoint: endpointPath,
      method: 'POST',
      statusCode: 200,
    });
    
    console.log(`💳 Credit deducted successfully`);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('💥 Helium Oracle API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}