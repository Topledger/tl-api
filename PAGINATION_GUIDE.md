# 📄 Pagination System Guide

## Overview
All APIs with large datasets (>10,000 rows) now support automatic pagination. Small datasets return all data immediately.

## How It Works

### Default Behavior (No Offset)
```bash
# First call - no offset parameter
GET /api/large-dataset?api_key=YOUR_KEY

# If ≤10K rows: Returns all data with is_complete: true
# If >10K rows: Returns first 10K rows with pagination metadata
```

### Pagination Parameters
```bash
# Page-based pagination (recommended)
?offset=1    # First 10K rows (default)
?offset=2    # Rows 10,001-20,000
?offset=3    # Rows 20,001-30,000
?offset=N    # Rows ((N-1)*10K + 1) to (N*10K)

# Optional: Custom page size
?offset=2&limit=5000    # Page 2 with 5K records instead of 10K
```

## Response Format

### Small Dataset Response
```json
{
  "data": [...],
  "total_records": 8431,
  "returned_records": 8431,
  "is_complete": true,
  "pagination": null,
  "message": "Complete dataset returned (≤ 10,000 rows)"
}
```

### Large Dataset Response
```json
{
  "data": [...], // 10,000 records
  "total_records": 2847391,
  "returned_records": 10000,
  "is_complete": false,
  "pagination": {
    "current_page": 1,
    "total_pages": 285,
    "records_per_page": 10000,
    "has_previous_page": false,
    "has_next_page": true,
    "previous_page": null,
    "next_page": 2,
    "remaining_records": 2837391
  },
  "navigation": {
    "first_page": "/api/large-dataset?offset=1&api_key=YOUR_KEY",
    "next_page": "/api/large-dataset?offset=2&api_key=YOUR_KEY",
    "last_page": "/api/large-dataset?offset=285&api_key=YOUR_KEY"
  }
}
```

## Usage Examples

### 1. Check Dataset Size
```bash
# First call to see if pagination is needed
curl "/api/large-dataset?api_key=YOUR_KEY"

# Check is_complete field:
# - true: You have all the data
# - false: More data available, see pagination.total_pages
```

### 2. Navigate Pages
```bash
# Get specific pages
curl "/api/large-dataset?offset=1&api_key=YOUR_KEY"   # First page
curl "/api/large-dataset?offset=2&api_key=YOUR_KEY"   # Second page
curl "/api/large-dataset?offset=50&api_key=YOUR_KEY"  # Page 50
curl "/api/large-dataset?offset=285&api_key=YOUR_KEY" # Last page
```

### 3. Custom Page Sizes
```bash
# Smaller pages (minimum 1,000)
curl "/api/large-dataset?offset=1&limit=2000&api_key=YOUR_KEY"

# Larger pages (maximum 50,000)
curl "/api/large-dataset?offset=1&limit=25000&api_key=YOUR_KEY"
```

## Error Handling

### Invalid Offset
```json
{
  "error": "Invalid offset. Maximum page is 285 for 2847391 records",
  "total_records": 2847391,
  "total_pages": 285,
  "valid_range": "1-285"
}
```

### Performance Warnings
```json
{
  "data": [...],
  "warning": {
    "type": "large_offset",
    "message": "Deep pagination (page 150) may be slow for 5,000,000 records",
    "suggestion": "Consider using filters to reduce dataset size"
  }
}
```

## Client-Side Helper

### JavaScript Implementation
```javascript
class ApiPaginator {
  constructor(endpoint, apiKey) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.currentOffset = 1;
    this.totalPages = null;
  }
  
  async getPage(offset = 1) {
    const url = `${this.endpoint}?offset=${offset}&api_key=${this.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    this.currentOffset = offset;
    this.totalPages = data.pagination?.total_pages || null;
    
    return data;
  }
  
  async getNextPage() {
    if (this.hasNextPage()) {
      return this.getPage(this.currentOffset + 1);
    }
    return null;
  }
  
  async getAllPages(maxPages = 10) {
    const allData = [];
    let page = 1;
    
    while (page <= maxPages) {
      const result = await this.getPage(page);
      
      if (result.is_complete) {
        allData.push(...result.data);
        break;
      }
      
      allData.push(...result.data);
      
      if (!result.pagination.has_next_page) break;
      page++;
    }
    
    return allData;
  }
  
  hasNextPage() {
    return this.totalPages && this.currentOffset < this.totalPages;
  }
}

// Usage:
const paginator = new ApiPaginator('/api/large-dataset', 'your-key');

// Get first page
const firstPage = await paginator.getPage(1);

// Get all pages (up to 10 pages max for safety)
const allData = await paginator.getAllPages(10);
```

## Best Practices

### For API Users:
1. **Always check** `is_complete` in the first response
2. **Use pagination metadata** to know how many more pages are available
3. **Consider filters** instead of deep pagination (offset > 100)
4. **Monitor response times** - deeper pages may be slower

### For Large Datasets:
1. **Start with filtering** - most users don't need all records
2. **Use reasonable page sizes** - 10K is usually optimal
3. **Cache frequently accessed pages** - especially page 1
4. **Consider export APIs** for users needing complete datasets

## Testing URLs

Try these with your API key:
- **Small dataset**: `/api/demo-large-dataset?dataset=small&api_key=YOUR_KEY`
- **Large dataset**: `/api/demo-large-dataset?dataset=large&api_key=YOUR_KEY`
- **Page 2**: `/api/demo-large-dataset?dataset=large&offset=2&api_key=YOUR_KEY`
- **Custom limit**: `/api/demo-large-dataset?dataset=large&offset=1&limit=5000&api_key=YOUR_KEY`