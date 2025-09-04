import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
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