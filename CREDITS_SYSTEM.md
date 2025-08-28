# Credits System Implementation

## Overview
This system implements a credits-based usage model for API calls. Each user starts with 5000 credits by default, and 1 credit is deducted for every successful API call.

## Database Schema
The `User` model now includes a `credits` field:
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  picture     String?
  plan        String   @default("Basic")
  credits     Int      @default(5000)  // New field
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  // ... relations
}
```

## Key Features

### 1. Credit Validation
- Before processing any API request, the system checks if the user has sufficient credits
- If credits < 1, the API returns a 402 (Payment Required) error

### 2. Credit Deduction
- After a successful API call, 1 credit is automatically deducted from the user's account
- Deduction happens only for successful API responses (2xx status codes)

### 3. New User Setup
- New users automatically receive 5000 credits when their account is created
- This happens during the OAuth sign-in process

### 4. Database Functions
New functions in `lib/db.ts`:
- `checkUserCredits(userId, requiredAmount)` - Check if user has enough credits
- `deductUserCredits(userId, amount)` - Deduct credits from user account
- `getUserCredits(userId)` - Get current credit balance

## API Responses

### Insufficient Credits
```json
{
  "error": "Insufficient credits. Please contact support to add more credits to your account."
}
```
Status Code: 402 (Payment Required)

### Successful API Call
- Normal API response is returned
- Credits are deducted in the background
- Credit deduction is logged in console

## Credit Management

### Update Existing Users
Run the script to give existing users 5000 credits:
```bash
npx ts-node scripts/update-existing-users-credits.ts
```

Use `--all` flag to update ALL users regardless of current credits:
```bash
npx ts-node scripts/update-existing-users-credits.ts --all
```

### Manual Credit Management
You can manually update user credits in the database:
```sql
UPDATE users SET credits = 5000 WHERE email = 'user@example.com';
```

## Error Handling
- If credit deduction fails, the API call still succeeds (non-blocking)
- Errors are logged to console for monitoring
- Fallback to JSON file system if database is unavailable

## Monitoring
- All credit operations are logged to console
- Credit deduction is tracked per API call
- User credit balance is included in session data

## Future Enhancements
- Credit usage analytics dashboard
- Different credit costs for different API endpoints
- Credit purchase/top-up functionality
- Credit usage history and reporting
