# Solana Wallet Authentication Implementation

## Overview

This implementation adds Solana wallet authentication to the existing NextAuth-based authentication system. Users can now sign in using their Solana wallets without needing to make any on-chain transactions.

## Security Features

- **Web2-style authentication**: Message signing only, no on-chain transactions required
- **Nonce-based replay attack prevention**: Each authentication uses a one-time nonce
- **Short-lived nonces**: Nonces expire after 5 minutes
- **Signature verification**: Backend verifies signatures using `tweetnacl`
- **JWT integration**: Seamless integration with existing session management

## Implementation Details

### Backend Endpoints

#### `GET /api/auth/nonce`
Returns a new cryptographically secure nonce for authentication.

**Response:**
```json
{
  "nonce": "hex-encoded-random-bytes",
  "expiresAt": "2024-01-15T10:30:00.000Z"
}
```

#### `POST /api/auth/verify`
Verifies the wallet signature and returns a JWT token.

**Request:**
```json
{
  "publicKey": "base58-encoded-public-key",
  "signature": "base58-encoded-signature",
  "message": "Sign this message to authenticate with Top Ledger APIs.\n\nNonce: {nonce}",
  "nonce": "hex-encoded-nonce"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "publickey@solana.wallet",
    "name": "Solana User (12345678...)",
    "publicKey": "base58-public-key",
    "plan": "Basic",
    "credits": { "used": 0, "remaining": 30000, "total": 30000 }
  }
}
```

### Frontend Components

#### Wallet Provider
- Configured for mainnet with popular wallet adapters (Phantom, Solflare, Torus, Ledger)
- Wraps the entire application in `app/layout.tsx`

#### Authentication Hook (`useSolanaAuth`)
- Handles the complete authentication flow
- Connects wallet, gets nonce, signs message, verifies signature
- Returns authentication state and error handling

#### Sign-in Page Updates
- Added Solana wallet connect button
- Shows different states: Connect → Sign In → Loading
- Displays wallet address when connected
- Error handling and user feedback

### Database Changes

#### Prisma Schema Updates
Added `publicKey` field to User model:
```prisma
model User {
  // ... existing fields
  publicKey   String?  @unique  // Solana wallet public key
  // ... rest of fields
}
```

#### User Management
- Solana users get synthetic email: `{publicKey}@solana.wallet`
- Automatic user creation with default credits (30,000)
- Display name: `Solana User ({first-8-chars}...)`
- Backward compatibility with existing JSON file system

### NextAuth Integration

#### Custom Credentials Provider
```typescript
CredentialsProvider({
  id: 'solana',
  name: 'Solana Wallet',
  // ... handles JWT verification and user lookup
})
```

#### Session Management
- Solana users integrate seamlessly with existing session callbacks
- `publicKey` field added to session user object
- Same credit system and plan management as other users

## Security Considerations

### Replay Attack Prevention
- Nonces are one-time use only
- Nonces expire after 5 minutes
- Automatic cleanup of expired nonces

### Message Format
Standardized message format prevents confusion attacks:
```
Sign this message to authenticate with Top Ledger APIs.

Nonce: {cryptographic-nonce}
```

### Signature Verification
- Uses `tweetnacl.sign.detached.verify()` for Ed25519 signature verification
- Validates message content matches expected format
- Checks signature against provided public key

## Usage Instructions

### For Users
1. Visit the sign-in page
2. Click "Connect Wallet" (if not connected)
3. Select your preferred wallet (Phantom, Solflare, etc.)
4. Authorize the connection in your wallet
5. Click "Sign in with Solana"
6. Sign the message in your wallet
7. You're now authenticated!

### For Developers
The implementation is modular and can be extended:

```typescript
// Use the authentication hook
import { useSolanaAuth } from '@/hooks/useSolanaAuth';

function MyComponent() {
  const { signInWithSolana, isLoading, error } = useSolanaAuth();
  
  const handleAuth = async () => {
    const result = await signInWithSolana();
    if (result.success) {
      // Handle successful authentication
    }
  };
}
```

## Environment Variables

No additional environment variables required. Uses existing:
- `NEXTAUTH_SECRET` - For JWT signing
- `DATABASE_URL` - For user storage

## File Structure

```
├── app/api/auth/
│   ├── nonce/route.ts          # Nonce generation endpoint
│   └── verify/route.ts         # Signature verification endpoint
├── components/Providers/
│   └── WalletProvider.tsx      # Solana wallet context provider
├── hooks/
│   └── useSolanaAuth.ts        # Authentication hook
├── lib/
│   └── auth.ts                 # Updated NextAuth configuration
├── types/
│   └── next-auth.d.ts          # Extended session types
└── app/auth/signin/page.tsx    # Updated sign-in page
```

## Dependencies Added

```json
{
  "@solana/wallet-adapter-base": "^0.9.x",
  "@solana/wallet-adapter-react": "^0.15.x",
  "@solana/wallet-adapter-react-ui": "^0.9.x",
  "@solana/wallet-adapter-wallets": "^0.19.x",
  "@solana/web3.js": "^1.x",
  "tweetnacl": "^1.x",
  "bs58": "^5.x",
  "jsonwebtoken": "^9.x",
  "@types/bs58": "^4.x",
  "@types/jsonwebtoken": "^9.x"
}
```

## Production Considerations

1. **Database Migration**: Run `npx prisma migrate deploy` to add the `publicKey` field
2. **Nonce Storage**: Consider using Redis instead of in-memory storage for production
3. **Rate Limiting**: Add rate limiting to nonce generation endpoint
4. **Monitoring**: Add logging for authentication attempts and failures
5. **Backup**: Ensure user data backup includes Solana wallet users

## Testing

The implementation includes comprehensive error handling and user feedback. Test cases should cover:

- Successful wallet connection and authentication
- Nonce expiration and replay attack prevention
- Invalid signature rejection
- Network error handling
- Wallet disconnection scenarios
