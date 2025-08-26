# Top Ledger API Wrapper Guide

## Overview

This API wrapper system creates secure endpoints for all 219 Top Ledger APIs, hiding the original API keys and allowing users to access them with their own API keys.

## How It Works

### Architecture
1. **Original APIs**: 219 Top Ledger APIs each with their own API keys (stored in `public/apis_list.json`)
2. **Wrapper APIs**: Dynamic endpoints at `/api/tl/[...path]` that proxy requests to original APIs
3. **User Authentication**: Users authenticate with their own API keys created in the Keys section
4. **Usage Tracking**: All API calls are logged and tracked per user API key

### Example Flow
```
User Request → /api/tl/tl-research/api/queries/13448/results.json?api_key=USER_KEY
     ↓
Wrapper validates USER_KEY
     ↓
Wrapper calls → https://analytics.topledger.xyz/tl-research/api/queries/13448/results.json?api_key=ORIGINAL_KEY
     ↓
Response returned to user + usage logged
```

## API Endpoints

### Get All Available APIs
```bash
GET /api/tl-apis
```
Returns list of all 219 wrapped APIs with their wrapper URLs.

### Use Any Wrapped API
```bash
GET /api/tl/[original-path]?api_key=YOUR_USER_API_KEY
POST /api/tl/[original-path]?api_key=YOUR_USER_API_KEY
```

## Examples

### 1. Get API List
```bash
curl "http://localhost:3000/api/tl-apis"
```

### 2. Use Compute Units API
```bash
curl "http://localhost:3000/api/tl/tl-research/api/queries/13448/results.json?api_key=AAohjJhtsyggedgavpjn"
```

### 3. Use DEX Volume API
```bash
curl "http://localhost:3000/api/tl/tl/api/queries/13192/results.json?api_key=AAohjJhtsyggedgavpjn"
```

## Authentication

### User API Keys
- Create API keys in the "API Keys" section of the dashboard
- Use these keys to authenticate with wrapper APIs
- Each key tracks usage and hits

### Validation
- All wrapper API calls require a valid user API key
- Invalid keys return 403 Forbidden
- Missing keys return 401 Unauthorized

## Usage Tracking

### Automatic Logging
- Every API call increments user's total hits
- Daily usage is tracked per API key
- Credits are deducted from user account
- Last used timestamp is updated

### Data Stored
- Total hits per API key
- Daily hit breakdown
- Usage data for analytics
- Credit consumption

## Available API Categories

### 14 Main Categories
1. **Compute Units** (13 APIs) - CU pricing, consumption, overspending
2. **DEX** (13 APIs) - Trading volume, TVL, aggregators
3. **Launchpads** (6 APIs) - Token launches, fees, revenue
4. **MEV** (6 APIs) - Sandwich attacks, value extraction
5. **Overview** (11 APIs) - Network usage, market dynamics
6. **Projects** (63 APIs) - Protocol-specific analytics
7. **Protocol Revenue** (11 APIs) - dApp revenue, network fees
8. **REV** (5 APIs) - Economic value, issuance, burn
9. **SF Dashboards** (74 APIs) - Solana Foundation dashboards
10. **Stablecoins** (10 APIs) - USDC/USDT analytics
11. **Test** (3 APIs) - Testing endpoints
12. **Valuation Insights** (1 API) - Protocol valuations
13. **Wrapped BTC** (11 APIs) - Bitcoin on Solana
14. **xStocks** (8 APIs) - Tokenized equities

### 40+ Page Categories
Including: DeFi, AI Tokens, Consumer, Depin, Treasury, VC Funding, Transaction Activity, Network Usage, and many more.

## Error Handling

### Common Errors
- `401`: Missing API key
- `403`: Invalid API key
- `404`: API endpoint not found
- `500`: Top Ledger API error or internal error

### Response Format
```json
{
  "error": "Invalid API key",
  "details": "Additional error information"
}
```

## Frontend Integration

### Updated Interface
- Displays all 219 wrapped APIs
- Category and page filtering
- API key selection dropdown
- Copy wrapper URLs with user API key

### Copy Functionality
The "Copy endpoint" button now generates URLs like:
```
http://localhost:3000/api/tl/tl-research/api/queries/13448/results.json?api_key=USER_KEY
```

## Security Features

### API Key Protection
- Original Top Ledger API keys are hidden from users
- Only server-side code has access to original keys
- User keys are validated before proxying requests

### Usage Limits
- Credit-based system prevents abuse
- Per-key usage tracking
- Rate limiting through credit deduction

## Development

### Test Endpoint
```bash
GET /api/test-wrapper?api_key=YOUR_KEY
```
Tests the wrapper system with a sample API call.

### File Structure
```
app/api/
├── tl/[...endpoint]/route.ts    # Dynamic wrapper endpoints
├── tl-apis/route.ts             # API listing endpoint
└── test-wrapper/route.ts        # Test endpoint

public/
└── apis_list.json               # Original API definitions

data/
└── users.json                   # User data and API keys
```

## Next Steps

1. **Rate Limiting**: Add request rate limits per API key
2. **Caching**: Implement response caching for better performance
3. **Analytics**: Enhanced usage analytics and reporting
4. **Webhooks**: Real-time usage notifications
5. **API Documentation**: Auto-generated docs for each endpoint
