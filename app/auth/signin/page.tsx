'use client';

import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Button from '@/components/UI/Button';

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already signed in
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push('/');
      }
    };
    checkSession();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signIn('google', { callbackUrl: '/' });
      if (result?.error) {
        console.error('Sign in error:', result.error);
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background Objects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large floating shapes */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-gradient-to-br from-purple-200/25 to-pink-300/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-gradient-to-br from-pink-200/30 to-blue-300/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        
        {/* Medium floating shapes */}
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-gradient-to-br from-indigo-200/40 to-purple-200/30 rounded-full blur-2xl animate-bounce" style={{animationDuration: '6s', animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-gradient-to-br from-purple-200/35 to-pink-200/25 rounded-full blur-2xl animate-bounce" style={{animationDuration: '8s', animationDelay: '3s'}}></div>
        
        {/* Small accent shapes */}
        <div className="absolute top-1/2 left-1/6 w-32 h-32 bg-gradient-to-br from-blue-300/50 to-indigo-300/40 rounded-full blur-xl animate-pulse" style={{animationDelay: '5s'}}></div>
        <div className="absolute top-3/4 right-1/3 w-24 h-24 bg-gradient-to-br from-pink-300/45 to-purple-300/35 rounded-full blur-xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>

      {/* Top Ledger Logo */}
      <div className="absolute top-8 left-8 z-10">
        <img 
          src="https://topledger.xyz/assets/images/logo/topledger-full.svg?imwidth=384"
          alt="Top Ledger"
          className="h-8 w-auto"
        />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-sm relative z-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-sm shadow-xl p-8 border border-white/50">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-semibold text-gray-700 mb-2">Top Ledger APIs</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Access powerful Solana blockchain APIs with your Google account
            </p>
          </div>

          {/* Google Sign In Button */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              By signing in, you agree to our{' '}
              <span className="text-gray-700 hover:underline cursor-pointer">Terms of Service</span>
              {' '}and{' '}
              <span className="text-gray-700 hover:underline cursor-pointer">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 