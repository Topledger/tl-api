import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { validateAndConsumeNonce } from '../nonce/route';
import { getOrCreateSolanaUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicKey, signature, message, nonce } = body;

    // Validate required fields
    if (!publicKey || !signature || !message || !nonce) {
      return NextResponse.json(
        { error: 'Missing required fields: publicKey, signature, message, nonce' },
        { status: 400 }
      );
    }

    // Validate and consume the nonce (prevents replay attacks)
    if (!validateAndConsumeNonce(nonce)) {
      return NextResponse.json(
        { error: 'Invalid, expired, or already used nonce' },
        { status: 401 }
      );
    }

    // Verify the expected message format
    const expectedMessage = `Sign this message to authenticate with Top Ledger APIs.\n\nNonce: ${nonce}`;
    if (message !== expectedMessage) {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 401 }
      );
    }

    // Verify the signature
    try {
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = bs58.decode(publicKey);

      const isValidSignature = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );

      if (!isValidSignature) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Signature verification error:', error);
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 401 }
      );
    }

    // Create or get user by wallet address
    const userData = await getOrCreateSolanaUser(publicKey);

    // Generate JWT token
    const token = sign(
      {
        sub: userData.id,
        email: userData.email,
        publicKey,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      },
      process.env.NEXTAUTH_SECRET!
    );

    return NextResponse.json({
      token,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        publicKey,
        plan: userData.plan,
        credits: userData.credits,
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
