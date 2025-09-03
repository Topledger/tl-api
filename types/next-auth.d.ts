import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      publicKey?: string; // Solana wallet public key
      plan?: string;
      credits?: {
        used: number;
        remaining: number;
        total: number;
      };
      billingCycle?: {
        start: string;
        end: string;
      };
    };
  }

  interface User {
    id: string;
    publicKey?: string; // Solana wallet public key
    plan?: string;
    credits?: {
      used: number;
      remaining: number;
      total: number;
    };
    billingCycle?: {
      start: string;
      end: string;
    };
  }
} 