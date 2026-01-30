import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ queryId: string }> }
) {
  try {
    const { queryId } = await params;
    console.log(`🔍 Helium API preview request for query ID: ${queryId}`);
    
    // Parse request body for POST parameters
    let body;
    try {
      body = await request.json();
      console.log('📨 Preview request body:', JSON.stringify(body, null, 2));
    } catch (error) {
      console.log('❌ Invalid JSON in request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Return mock data based on query ID
    if (queryId === '14744') {
      // L1 Raw Block Data mock response matching real API structure
      return NextResponse.json({
        query_result: {
          data: {
            columns: [
              { name: 'height', friendly_name: 'height', type: 'integer' },
              { name: 'time', friendly_name: 'time', type: 'string' },
              { name: 'timestamp', friendly_name: 'timestamp', type: 'string' },
              { name: 'prev_hash', friendly_name: 'prev_hash', type: 'string' },
              { name: 'block_hash', friendly_name: 'block_hash', type: 'string' },
              { name: 'transaction_count', friendly_name: 'transaction_count', type: 'integer' }
            ],
            rows: [
              [12345, '2022-08-04 12:00:00', '2022-08-04T12:00:00.000Z', '0xabc123...', '0x123abc...', 15],
              [12346, '2022-08-04 12:01:00', '2022-08-04T12:01:00.000Z', '0x123abc...', '0xdef456...', 22],
              [12347, '2022-08-04 12:02:00', '2022-08-04T12:02:00.000Z', '0xdef456...', '0x789ghi...', 8]
            ]
          }
        },
        preview_note: 'This is preview data. Use your API key for real data.'
      });
    } else if (queryId === '14745') {
      // L1 Raw Transactions mock response
      return NextResponse.json({
        query_result: {
          data: {
            columns: [
              { name: 'transaction_hash', friendly_name: 'transaction_hash', type: 'string' },
              { name: 'block_number', friendly_name: 'block_number', type: 'integer' },
              { name: 'from_address', friendly_name: 'from_address', type: 'string' },
              { name: 'to_address', friendly_name: 'to_address', type: 'string' },
              { name: 'amount', friendly_name: 'amount', type: 'number' },
              { name: 'gas_used', friendly_name: 'gas_used', type: 'integer' },
              { name: 'timestamp', friendly_name: 'timestamp', type: 'string' }
            ],
            rows: [
              ['0x456def789ghi012jkl345mno678pqr901stu234vwx567yz0', body.parameters?.start_block || 11431, '0x789ghi...abc', '0xabcjkl...ghi', 1.5, 21000, '2022-08-04T12:00:00Z'],
              ['0x789ghi012jkl345mno678pqr901stu234vwx567yz0abc', body.parameters?.end_block || 11435, '0xabcjkl...ghi', '0x789ghi...abc', 2.3, 25000, '2022-08-04T12:01:00Z']
            ]
          }
        },
        block_range: {
          start_block: body.parameters?.start_block || '11431',
          end_block: body.parameters?.end_block || '11435'
        },
        preview_note: 'This is preview data. Use your API key for real data.'
      });
    } else {
      return NextResponse.json(
        { error: `Helium API not found for query ID: ${queryId}` },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('💥 Helium API preview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}