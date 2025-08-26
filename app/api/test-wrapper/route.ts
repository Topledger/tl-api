import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('api_key');

  if (!apiKey) {
    return NextResponse.json(
      { 
        error: 'Missing API key',
        usage: 'Add ?api_key=YOUR_KEY to test the wrapper',
        example: '/api/test-wrapper?api_key=your-api-key-here'
      },
      { status: 400 }
    );
  }

  try {
    // Test one of the wrapped APIs - let's try a simple one
    const testUrl = `${request.nextUrl.origin}/api/tl/tl-research/api/queries/13448/results.json?api_key=${apiKey}`;
    
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'API call failed',
          status: response.status,
          statusText: response.statusText,
          testUrl
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Wrapper API is working!',
      testEndpoint: testUrl,
      sampleData: data,
      totalRecords: Array.isArray(data) ? data.length : 'Not an array'
    });

  } catch (error) {
    console.error('Test wrapper error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
