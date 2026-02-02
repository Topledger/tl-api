export interface PaginationParams {
  offset?: number;  // Page number (1, 2, 3...)
}

export interface PaginationMetadata {
  current_page: number;
  total_pages: number;
  records_per_page: number;
  has_previous_page: boolean;
  has_next_page: boolean;
  previous_page: number | null;
  next_page: number | null;
  remaining_records: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total_records: number;
  returned_records: number;
  is_complete: boolean;
  pagination?: PaginationMetadata;
  message?: string;
  navigation?: {
    first_page: string;
    previous_page?: string;
    next_page?: string;
    last_page: string;
  };
}

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 1;
  
  return {
    offset: Math.max(1, offset), // Ensure offset is at least 1
  };
}

export function validatePaginationParams(
  offset: number, 
  totalRecords: number
): { isValid: boolean; error?: string; totalPages: number } {
  const recordsPerPage = 10000; // Fixed page size
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  
  if (offset < 1) {
    return {
      isValid: false,
      error: `Invalid offset. Offset must be >= 1`,
      totalPages
    };
  }
  
  if (offset > totalPages && totalPages > 0) {
    return {
      isValid: false,
      error: `Invalid offset. Maximum page is ${totalPages} for ${totalRecords} records`,
      totalPages
    };
  }
  
  return { isValid: true, totalPages };
}

export function createPaginatedResponse<T>(
  data: T[],
  totalRecords: number,
  offset: number,
  baseUrl: string,
  apiKey?: string
): PaginatedResponse<T> {
  const recordsPerPage = 10000; // Fixed page size
  
  // If dataset is small, return everything without pagination
  if (totalRecords <= recordsPerPage) {
    return {
      data,
      total_records: totalRecords,
      returned_records: data.length,
      is_complete: true,
      message: "Complete dataset returned (≤ 10,000 rows)"
    };
  }
  
  // Large dataset - create pagination metadata
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const remainingRecords = Math.max(0, totalRecords - (offset * recordsPerPage));
  
  const apiKeyParam = apiKey ? `&api_key=${apiKey}` : '';
  
  const navigation: any = {
    first_page: `${baseUrl}?offset=1${apiKeyParam}`,
    last_page: `${baseUrl}?offset=${totalPages}${apiKeyParam}`,
  };
  
  if (offset > 1) {
    navigation.previous_page = `${baseUrl}?offset=${offset - 1}${apiKeyParam}`;
  }
  
  if (offset < totalPages) {
    navigation.next_page = `${baseUrl}?offset=${offset + 1}${apiKeyParam}`;
  }
  
  return {
    data,
    total_records: totalRecords,
    returned_records: data.length,
    is_complete: false,
    pagination: {
      current_page: offset,
      total_pages: totalPages,
      records_per_page: recordsPerPage,
      has_previous_page: offset > 1,
      has_next_page: offset < totalPages,
      previous_page: offset > 1 ? offset - 1 : null,
      next_page: offset < totalPages ? offset + 1 : null,
      remaining_records: remainingRecords,
    },
    navigation
  };
}