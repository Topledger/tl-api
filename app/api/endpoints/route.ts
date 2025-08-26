import { NextResponse } from 'next/server';
import { mockApiEndpoints } from '@/lib/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  let filteredEndpoints = mockApiEndpoints;

  // Filter by search term
  if (search) {
    filteredEndpoints = mockApiEndpoints.filter(
      (endpoint) =>
        endpoint.name.toLowerCase().includes(search.toLowerCase()) ||
        endpoint.path.toLowerCase().includes(search.toLowerCase()) ||
        endpoint.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedEndpoints = filteredEndpoints.slice(startIndex, endIndex);

  return NextResponse.json({
    endpoints: paginatedEndpoints,
    total: filteredEndpoints.length,
    page,
    totalPages: Math.ceil(filteredEndpoints.length / limit),
  });
} 