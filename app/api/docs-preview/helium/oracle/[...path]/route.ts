import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathString = path.join('/');
    console.log(`🔍 Helium Oracle API preview request for path: ${pathString}`);
    
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

    // Return mock data based on path
    const mockData = {
      query_result: {
        data: {
          columns: [
            { name: 'block_date', friendly_name: 'block_date', type: 'date' },
            { name: 'table_name', friendly_name: 'table_name', type: 'string' },
            { name: 'record_count', friendly_name: 'record_count', type: 'integer' },
            { name: 'data_size_bytes', friendly_name: 'data_size_bytes', type: 'integer' },
            { name: 'last_updated', friendly_name: 'last_updated', type: 'timestamp' }
          ],
          rows: [
            [
              body.parameters?.block_date || '2026-01-01',
              pathString.replace('/', '_'),
              Math.floor(Math.random() * 10000) + 1000,
              Math.floor(Math.random() * 1000000) + 100000,
              new Date().toISOString()
            ],
            [
              body.parameters?.block_date || '2026-01-01',
              pathString.replace('/', '_'),
              Math.floor(Math.random() * 10000) + 1000,
              Math.floor(Math.random() * 1000000) + 100000,
              new Date().toISOString()
            ]
          ]
        }
      },
      parameters: {
        block_date: body.parameters?.block_date || '2026-01-01',
        table_ref: `helium_oracle_${pathString.replace('/', '_')}`,
      },
      preview_note: 'This is preview data. Use your API key for real data.'
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('💥 Helium Oracle API preview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}