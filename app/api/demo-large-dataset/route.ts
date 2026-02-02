import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { 
  parsePaginationParams, 
  validatePaginationParams, 
  createPaginatedResponse 
} from '@/lib/pagination';

// Demo API that simulates a large dataset (like 3 million rows)
// This shows how pagination works with different dataset sizes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract API key for authentication
    const apiKey = searchParams.get('api_key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }
    
    // Validate API key
    const userApiKey = await prisma.apiKey.findFirst({
      where: { key: apiKey, isActive: true },
      include: { user: true }
    });
    
    if (!userApiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    // Get dataset type from query params (for demo purposes)
    const datasetType = searchParams.get('dataset') || 'large';
    
    console.log(`📊 Large Dataset API request from user: ${userApiKey.user.email}`);
    console.log(`📋 Dataset type: ${datasetType}`);
    
    // Parse pagination parameters
    const { offset } = parsePaginationParams(searchParams);
    console.log(`📄 Pagination: offset=${offset}`);
    
    // Simulate different dataset sizes for testing
    let totalRecords: number;
    let mockData: any[];
    
    switch (datasetType) {
      case 'small':
        totalRecords = 5000; // Small dataset - should return all data
        break;
      case 'medium':
        totalRecords = 25000; // Medium dataset - requires pagination  
        break;
      case 'large':
        totalRecords = 2847391; // Large dataset - 2.8M rows
        break;
      case 'huge':
        totalRecords = 5000000; // Huge dataset - 5M rows
        break;
      default:
        totalRecords = 2847391;
    }
    
    console.log(`📊 Simulated total records: ${totalRecords}`);
    
    // Validate pagination parameters
    const validation = validatePaginationParams(offset!, totalRecords);
    if (!validation.isValid) {
      return NextResponse.json({
        error: validation.error,
        total_records: totalRecords,
        total_pages: validation.totalPages,
        valid_range: `1-${validation.totalPages}`,
        dataset_type: datasetType
      }, { status: 400 });
    }
    
    // Generate mock data for the current page
    const recordsPerPage = 10000; // Fixed page size
    const skip = (offset! - 1) * recordsPerPage;
    const actualRecordsToReturn = Math.min(recordsPerPage, totalRecords - skip);
    
    mockData = Array.from({ length: actualRecordsToReturn }, (_, index) => {
      const recordIndex = skip + index + 1;
      return {
        id: `record_${recordIndex}`,
        timestamp: new Date(Date.now() - (recordIndex * 60000)).toISOString(), // 1 minute apart
        wallet_address: `0x${recordIndex.toString(16).padStart(40, '0')}`,
        amount: Math.random() * 1000,
        transaction_type: ['buy', 'sell', 'transfer'][recordIndex % 3],
        block_number: 10000000 + recordIndex,
        gas_fee: Math.random() * 0.01,
        status: recordIndex % 100 === 0 ? 'failed' : 'success', // 1% failure rate
        metadata: {
          page: offset,
          position_in_page: index + 1,
          global_position: recordIndex
        }
      };
    });
    
    console.log(`✅ Generated ${mockData.length} mock records for page ${offset}`);
    
    // Create paginated response
    const response = createPaginatedResponse(
      mockData,
      totalRecords,
      offset!,
      `/api/demo-large-dataset?dataset=${datasetType}`,
      apiKey
    );
    
    // Add demo-specific metadata
    (response as any).demo_info = {
      dataset_type: datasetType,
      note: 'This is a demo API showing pagination with different dataset sizes',
      try_different_sizes: {
        small: `/api/demo-large-dataset?dataset=small&api_key=${apiKey}`,
        medium: `/api/demo-large-dataset?dataset=medium&api_key=${apiKey}`,
        large: `/api/demo-large-dataset?dataset=large&api_key=${apiKey}`,
        huge: `/api/demo-large-dataset?dataset=huge&api_key=${apiKey}`
      }
    };
    
    // Add performance warnings for deep pagination
    if (offset! > 100) {
      (response as any).warning = {
        type: 'large_offset',
        message: `Deep pagination (page ${offset}) may be slow for ${totalRecords.toLocaleString()} records`,
        suggestion: 'Consider using filters to reduce dataset size',
        performance_tip: 'Offsets > 1M records are not recommended for production use'
      };
    }
    
    // Add helpful instructions
    if (response.is_complete) {
      (response as any).instructions = {
        message: 'Complete dataset returned - no pagination needed',
        tip: `Try dataset=large for pagination demo: /api/demo-large-dataset?dataset=large&api_key=${apiKey}`
      };
    } else {
      (response as any).instructions = {
        message: `This dataset has ${validation.totalPages} pages. Use 'offset' parameter to get more data.`,
        examples: {
          next_page: response.navigation?.next_page,
          specific_page: `/api/demo-large-dataset?dataset=${datasetType}&offset=50&api_key=${apiKey}`,
          last_page: response.navigation?.last_page
        }
      };
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('💥 Error in demo large dataset API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}