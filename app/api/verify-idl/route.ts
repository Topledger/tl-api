import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the request to Top Ledger's verify-idl API
    const response = await fetch('https://apis.topledger.xyz/api/verify-idl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any required headers here
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to verify IDL' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying verify-idl API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Verify IDL API endpoint. Use POST method to verify Anchor IDL files.',
      endpoint: '/api/verify-idl',
      method: 'POST',
      description: 'Verify and validate Anchor IDL files for Solana programs with comprehensive error checking'
    },
    { status: 200 }
  );
} 