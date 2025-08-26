# S3 User-Specific Storage Implementation

## Overview
API keys are now stored in S3 with complete user isolation. Each user's API keys are stored separately and only accessible to that specific user.

## S3 Storage Structure

```
your-s3-bucket/
├── admin/
│   └── api-data/
│       └── api-data.json              # Global API endpoints data
└── users/
    ├── {user_id}/
    │   └── api-keys.json              # User's personal API keys
    ├── another_user_email_com/
    │   └── api-keys.json              # Another user's API keys
    └── ...
```

## User ID Format
User IDs are created from email addresses by replacing special characters:
- `@` becomes `_`
- `.` becomes `_`

**Examples:**
- `lokesh@topledger.com` → `lokesh_topledger_com`
- `user.name@example.org` → `user_name_example_org`

## API Endpoints with Authentication

All API key endpoints now require authentication:

### 🔐 GET `/api/keys`
- **Auth Required:** Yes
- **Returns:** User's personal API keys only
- **S3 Path:** `users/{user_id}/api-keys.json`

### 🔐 POST `/api/keys` 
- **Auth Required:** Yes
- **Action:** Creates new API key for authenticated user
- **Storage:** Saves to user's personal S3 file

### 🔐 PUT `/api/keys`
- **Auth Required:** Yes  
- **Action:** Updates API key name (user can only edit their own keys)
- **Validation:** Ensures key belongs to authenticated user

### 🔐 DELETE `/api/keys?id={keyId}`
- **Auth Required:** Yes
- **Action:** Deletes API key (user can only delete their own keys)
- **Validation:** Ensures key belongs to authenticated user

## Security Features

### ✅ User Isolation
- Each user can only see/edit/delete their own API keys
- API keys are stored in separate S3 files per user
- User ID is derived from authenticated session

### ✅ Authentication Required
- All endpoints check for valid NextAuth session
- Unauthenticated requests return 401 Unauthorized
- User identity verified on every request

### ✅ Authorization Checks
- Users cannot access other users' API keys
- Update/Delete operations verify key ownership
- 404 returned for non-existent or unauthorized keys

## Fallback Behavior

### S3 Configured ✅
1. **Primary:** Load/Save from S3 (`users/{user_id}/api-keys.json`)
2. **Fallback:** If S3 fails, use local storage with user isolation

### S3 Not Configured ⚠️
1. **Fallback Only:** Use local storage (`data/users.json`)
2. **User Isolation:** Still maintained via user ID structure

## Data Format

### API Key Object
```json
{
  "id": "key_1234567890",
  "name": "My API Key",
  "key": "AbCdEf1234567890",
  "createdAt": "2025-01-26",
  "lastUsed": null,
  "totalHits": 0,
  "dailyHits": []
}
```

### S3 File Structure
```json
[
  {
    "id": "key_1234567890",
    "name": "Production Key",
    "key": "AbCdEf1234567890",
    "createdAt": "2025-01-26",
    "lastUsed": "2025-01-26",
    "totalHits": 150,
    "dailyHits": [...]
  },
  {
    "id": "key_0987654321", 
    "name": "Development Key",
    "key": "XyZaBc0987654321",
    "createdAt": "2025-01-25",
    "lastUsed": null,
    "totalHits": 0,
    "dailyHits": []
  }
]
```

## Benefits

### 🚀 Scalability
- No shared files between users
- Parallel user operations
- S3's infinite scalability

### 🔒 Security  
- Complete user isolation
- No data leakage between users
- Authenticated access only

### 🔄 Reliability
- Automatic fallback to local storage
- Graceful degradation if S3 unavailable
- Error recovery and logging

## Testing User Isolation

1. **Login as User A** → Create API keys → See only your keys
2. **Login as User B** → Create API keys → See only your keys  
3. **Verify S3** → Check separate files in `users/` directory
4. **Check Logs** → User-specific operations logged with user ID

## Migration Notes

- **Existing users:** API keys remain in local storage until S3 is configured
- **New users:** API keys go directly to S3 (if configured)
- **No data loss:** Fallback ensures continuity during S3 setup
