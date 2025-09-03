import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// In-memory store for nonces (in production, use Redis or database)
// Each nonce expires after 5 minutes
const nonceStore = new Map<string, { expires: number; used: boolean }>();

// Clean up expired nonces every minute
setInterval(() => {
  const now = Date.now();
  for (const [nonce, data] of nonceStore.entries()) {
    if (data.expires < now) {
      nonceStore.delete(nonce);
    }
  }
}, 60000);

export async function GET(request: NextRequest) {
  try {
    // Generate a random nonce
    const nonce = randomBytes(32).toString('hex');
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes from now
    
    // Store the nonce
    nonceStore.set(nonce, { expires, used: false });
    
    return NextResponse.json({
      nonce,
      expiresAt: new Date(expires).toISOString()
    });
  } catch (error) {
    console.error('Error generating nonce:', error);
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}

// Helper function to validate and consume a nonce
export function validateAndConsumeNonce(nonce: string): boolean {
  const nonceData = nonceStore.get(nonce);
  
  if (!nonceData) {
    return false; // Nonce doesn't exist
  }
  
  if (nonceData.used) {
    return false; // Nonce already used (replay attack prevention)
  }
  
  if (nonceData.expires < Date.now()) {
    nonceStore.delete(nonce);
    return false; // Nonce expired
  }
  
  // Mark nonce as used and remove it
  nonceStore.delete(nonce);
  return true;
}
