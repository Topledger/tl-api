import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the request to Top Ledger's instruction API
    const response = await fetch('https://apis.topledger.xyz/api/instruction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any required headers here
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch instruction data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying instruction API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Instruction API endpoint. Use POST method to analyze Solana instructions.',
      endpoint: '/api/instruction',
      method: 'POST',
      description: 'Get instruction data and metadata for Solana program analysis and debugging'
    },
    { status: 200 }
  );
} 