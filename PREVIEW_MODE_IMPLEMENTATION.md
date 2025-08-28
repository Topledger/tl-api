# Preview Mode Implementation

## Overview
Implemented a preview mode system that allows users to see API responses in the UI without consuming credits.

## Implementation Details

### 1. Preview API Endpoint
**Path**: `/api/tl-preview/[...endpoint]`

- **Purpose**: Provides API responses for UI demonstration without credit consumption
- **Features**:
  - Full API validation (authentication required)
  - No credit checking or deduction
  - Response truncation for display (first 5 rows for queries)
  - Special headers: `X-TL-Preview-Mode: true`
  - Preview note in response: `_preview_note` field

### 2. Updated UI Components

#### ApiDetailsModal.tsx
- **Changed**: `fetchSampleResponse()` now uses preview endpoint
- **Added**: Preview mode indicator badge
- **Result**: Modal responses don't consume credits

#### Header.tsx  
- **Added**: Real-time credits display from database
- **Features**:
  - Fetches current credits every 30 seconds
  - Shows warning icon (⚠️) when credits < 1000
  - Clean, modern styling

### 3. Credits API Endpoint
**Path**: `/api/user/credits`

- **Purpose**: Provides current user credit balance
- **Authentication**: Requires valid session
- **Response**: `{ credits: number, email: string, name: string }`

## Usage Comparison

### 🔴 Real API Calls (Credit Consuming)
```
GET /api/tl/tl-research/api/queries/13448/results.json?api_key=YOUR_KEY
```
- ✅ Full response data
- ❌ Consumes 1 credit
- ✅ Real-time data

### 🟢 Preview API Calls (No Credits)
```
GET /api/tl-preview/tl-research/api/queries/13448/results.json?api_key=YOUR_KEY
```
- ✅ Sample response data (truncated)
- ✅ No credits consumed
- ✅ Perfect for UI demos
- ✅ Header: `X-TL-Preview-Mode: true`

## User Experience

### Before Implementation
- Modal responses consumed credits
- Users hesitant to explore APIs
- Credits depleted from demo usage

### After Implementation  
- ✅ Modal responses are free (preview mode)
- ✅ Real-time credit counter in header
- ✅ Clear preview mode indicators
- ✅ Users can explore freely without cost

## Benefits

1. **Cost-Free Exploration**: Users can view API responses without credit charges
2. **Real-Time Credits**: Always show current credit balance
3. **Clear Distinction**: Visual indicators separate preview from real usage
4. **Better UX**: Encourages API exploration and testing

## Technical Notes

- Preview endpoint reuses main API validation logic
- Response truncation prevents overwhelming UI
- Maintains full API compatibility
- Automatic fallback for edge cases
