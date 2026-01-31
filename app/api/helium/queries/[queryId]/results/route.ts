import { NextRequest, NextResponse } from 'next/server';
import { prisma, checkUserCredits, deductUserCredits, logApiCall } from '@/lib/db';
import { parsePaginationParams } from '@/lib/pagination';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ queryId: string }> }
) {
  try {
    const { queryId } = await params;
    console.log(`🔍 Helium API request for query ID: ${queryId}`);
    
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
    const endpointPath = `/api/helium/queries/${queryId}/results`;
    console.log(`🔍 Looking for endpoint path: ${endpointPath}`);

    // Find the API endpoint in database
    const apiEndpoint = await prisma.apiEndpoint.findUnique({
      where: { path: endpointPath },
    });

    if (!apiEndpoint) {
      console.log(`❌ Helium API not found in database for query ID: ${queryId}`);
      return NextResponse.json(
        { error: `Helium API not found for query ID: ${queryId}` },
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

    // Validate required parameters based on query ID
    if (!body.parameters) {
      console.log('❌ Missing parameters object');
      return NextResponse.json(
        { error: 'Missing parameters object' },
        { status: 400 }
      );
    }

    // Different query IDs have different parameter requirements
    if (queryId === '14744') {
      // L1 Raw Block Data requires date parameters
      if (!body.parameters.start_date || !body.parameters.end_date) {
        console.log('❌ Missing required date parameters for Block Data API');
        return NextResponse.json(
          { error: 'Missing required parameters: start_date and end_date are required for Block Data API' },
          { status: 400 }
        );
      }
      console.log(`📅 Date range: ${body.parameters.start_date} to ${body.parameters.end_date}`);
    } else if (queryId === '14745') {
      // L1 Raw Transactions requires block parameters
      if (!body.parameters.start_block || !body.parameters.end_block) {
        console.log('❌ Missing required block parameters for Transactions API');
        return NextResponse.json(
          { error: 'Missing required parameters: start_block and end_block are required for Transactions API' },
          { status: 400 }
        );
      }
      console.log(`🔗 Block range: ${body.parameters.start_block} to ${body.parameters.end_block}`);
    } else {
      console.log(`❌ Unknown query ID: ${queryId}`);
      return NextResponse.json(
        { error: `Unknown query ID: ${queryId}` },
        { status: 400 }
      );
    }

    // Use the correct Helium API key for each query ID
    const heliumApiKeys = {
      '14744': process.env.HELIUM_API_KEY_14744 || '0sNsulZAK9s3CLXvHpB8Y9Gra2doheEhcX3mdL2o', // L1 Raw Block Data
      '14745': process.env.HELIUM_API_KEY_14745 || 'FwcnvsK8C20N3Ate3LC0TGNmlYdiGh5FsdubybDW', // L1 Raw Transactions
    };
    
    const heliumApiKey = heliumApiKeys[queryId as keyof typeof heliumApiKeys];
    if (!heliumApiKey) {
      console.log(`❌ No API key configured for Helium query ID: ${queryId}`);
      return NextResponse.json(
        { error: `API key not configured for query ID: ${queryId}` },
        { status: 500 }
      );
    }
    
    const externalUrl = `${apiEndpoint.originalUrl}?api_key=${heliumApiKey}`;

    console.log(`🌐 Making external request to: ${externalUrl}`);

    // Make the external API call
    const externalResponse = await fetch(externalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
    console.error('💥 Helium API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}