import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the request to Top Ledger's discriminator API
    const response = await fetch('https://apis.topledger.xyz/api/discriminator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any required headers here
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch discriminator data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying discriminator API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Discriminator API endpoint. Use POST method to resolve instruction discriminators.',
      endpoint: '/api/discriminator',
      method: 'POST',
      description: 'Resolve instruction discriminators to human-readable instruction names and metadata'
    },
    { status: 200 }
  );
} 