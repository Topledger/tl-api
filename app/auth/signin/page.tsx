'use client';

import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Button from '@/components/UI/Button';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';

export default function SignInPage() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);

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


  const handleViewDocs = () => {
    router.push('/docs');
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    // Use redirect instead of waiting for result for faster UX
    await signIn('google', { callbackUrl: '/dashboard', redirect: true });
  };

  const handleDiscordSignIn = async () => {
    setDiscordLoading(true);
    // Use redirect instead of waiting for result for faster UX
    await signIn('discord', { callbackUrl: '/dashboard', redirect: true });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="hexPattern" width="100" height="87" patternUnits="userSpaceOnUse">
              <polygon
                points="50,5 85,25 85,65 50,85 15,65 15,25"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="1"
                opacity="0.8"
              />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#hexPattern)" />

          {/* Large accent hexagons */}
          <g opacity="0.4">
            <polygon
              points="200,100 270,140 270,220 200,260 130,220 130,140"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <polygon
              points="700,300 770,340 770,420 700,460 630,420 630,340"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <polygon
              points="400,600 470,640 470,720 400,760 330,720 330,640"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          </g>

          {/* Connecting lines */}
          <g opacity="0.3">
            <line x1="200" y1="260" x2="630" y2="340" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="270" y1="220" x2="700" y2="300" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="700" y1="460" x2="400" y2="600" stroke="#e5e7eb" strokeWidth="1"/>
          </g>

          {/* Small geometric shapes */}
          <g opacity="0.5">
            <circle cx="150" cy="400" r="3" fill="#d1d5db"/>
            <circle cx="800" cy="200" r="3" fill="#d1d5db"/>
            <circle cx="600" cy="700" r="3" fill="#d1d5db"/>
            <circle cx="300" cy="800" r="3" fill="#d1d5db"/>
          </g>
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-20">
      <Header 
          showLogo={true}
          hideDefaultButton={true}
          menuItems={[
            { label: 'Documentation', onClick: handleViewDocs }
          ]}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        {/* Main Card */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-8">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-light text-gray-900 mb-3">Sign In</h1>
              <p className="text-gray-600 text-sm leading-relaxed">
              Power your apps with TopLedger’s
              Solana data APIs
              </p>
            </div>

            {/* Sign In Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading || discordLoading}
                className="w-full bg-black text-white py-3 px-4 text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {googleLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <button
                onClick={handleDiscordSignIn}
                disabled={googleLoading || discordLoading}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {discordLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="#5865f2">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.211.375-.445.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    Continue with Discord
                  </>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                By signing in, you agree to our{' '}
                <span className="text-gray-700 hover:underline cursor-pointer" onClick={() => router.push('/terms?noLayout=true')}>Terms of Service</span>
                {' '}and{' '}
                <span className="text-gray-700 hover:underline cursor-pointer" onClick={() => router.push('/privacy?noLayout=true')} >Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative z-20">
        <Footer />
      </div>
    </div>
  );
} 