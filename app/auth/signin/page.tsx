'use client';

import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Button from '@/components/UI/Button';
import Footer from '@/components/Layout/Footer';
import { useSolanaAuth } from '@/hooks/useSolanaAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function SignInPage() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  
  // Solana wallet integration
  const { connected, publicKey, wallets } = useWallet();
  const { signInWithSolana, isLoading: solanaLoading, error: solanaError } = useSolanaAuth();
  
  // Check if any Solana wallets are available/installed
  const availableWallets = wallets.filter(wallet => wallet.readyState === 'Installed');
  const hasWalletExtensions = availableWallets.length > 0;

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
    setGoogleLoading(true);
    try {
      const result = await signIn('google', { callbackUrl: '/' });
      if (result?.error) {
        console.error('Sign in error:', result.error);
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDiscordSignIn = async () => {
    setDiscordLoading(true);
    try {
      const result = await signIn('discord', { callbackUrl: '/' });
      if (result?.error) {
        console.error('Sign in error:', result.error);
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setDiscordLoading(false);
    }
  };

  const handleSolanaSignIn = async () => {
    try {
      const result = await signInWithSolana();
      if (result.success) {
        router.push('/');
      } else {
        console.error('Solana sign in error:', result.error);
      }
    } catch (error) {
      console.error('Solana sign in error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100 flex flex-col relative overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-4">
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
            Power your apps with TopLedger’s<br />Solana data APIs
            </p>
          </div>

          {/* Sign In Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading || discordLoading || solanaLoading}
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {googleLoading ? (
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

            <button
              onClick={handleDiscordSignIn}
              disabled={googleLoading || discordLoading || solanaLoading}
              className="w-full bg-[#5865F2] text-white py-3 px-4 rounded-sm font-medium hover:bg-[#4752C4] focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {discordLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.211.375-.445.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Continue with Discord
                </>
              )}
            </button>

            {/* Solana Wallet Button - Only show if wallet extensions are detected */}
            {hasWalletExtensions && (
              <>
                {!connected ? (
                  <div className="w-full">
                    <WalletMultiButton className="!w-full !text-gray-700 !py-3 !px-4 !rounded-sm !font-medium hover:!from-purple-700 hover:!to-blue-700 !transition-all !duration-200 !flex !items-center !justify-center" />
                  </div>
                ) : (
                  <button
                    onClick={handleSolanaSignIn}
                    disabled={solanaLoading || googleLoading || discordLoading}
                    className="w-full text-gray-700 border-gray-300 border py-3 px-4 rounded-sm font-medium hover:border-white hover:bg-gray-100 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {solanaLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <svg className="w-5 h-4 mr-3" viewBox="0 0 101 88" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6912C0.558829 87.4897 0.31074 87.2029 0.160416 86.8659C0.0100923 86.529 -0.0359181 86.1566 0.0280382 85.7945C0.0919944 85.4324 0.263131 85.0964 0.520422 84.8278L17.2061 67.408C17.5676 67.0306 18.0047 66.7295 18.4904 66.5234C18.9762 66.3172 19.5002 66.2104 20.0301 66.2095H99.0644C99.4415 66.2095 99.8104 66.3169 100.126 66.5183C100.441 66.7198 100.689 67.0067 100.84 67.3436C100.99 67.6806 101.036 68.0529 100.972 68.415C100.908 68.7771 100.737 69.1131 100.48 69.3817ZM83.8068 34.3032C83.4444 33.9248 83.0058 33.6231 82.5185 33.4169C82.0312 33.2108 81.5055 33.1045 80.9743 33.1048H1.93563C1.55849 33.1048 1.18957 33.2121 0.874202 33.4136C0.558829 33.6151 0.31074 33.9019 0.160416 34.2388C0.0100923 34.5758 -0.0359181 34.9482 0.0280382 35.3103C0.0919944 35.6723 0.263131 36.0083 0.520422 36.277L17.2061 53.6968C17.5676 54.0742 18.0047 54.3752 18.4904 54.5814C18.9762 54.7875 19.5002 54.8944 20.0301 54.8952H99.0644C99.4415 54.8952 99.8104 54.7879 100.126 54.5864C100.441 54.3849 100.689 54.0981 100.84 53.7612C100.99 53.4242 101.036 53.0518 100.972 52.6897C100.908 52.3277 100.737 51.9917 100.48 51.723L83.8068 34.3032ZM1.93563 21.7905H80.9743C81.5055 21.7907 82.0312 21.6845 82.5185 21.4783C83.0058 21.2721 83.4444 20.9704 83.8068 20.592L100.48 3.17219C100.737 2.90357 100.908 2.56758 100.972 2.2055C101.036 1.84342 100.99 1.47103 100.84 1.13408C100.689 0.79713 100.441 0.510296 100.126 0.308823C99.8104 0.107349 99.4415 1.24074e-05 99.0644 0L20.0301 0C19.5002 0.000878397 18.9762 0.107699 18.4904 0.313848C18.0047 0.519998 17.5676 0.821087 17.2061 1.19848L0.524723 18.6183C0.267681 18.8866 0.0966198 19.2223 0.0325185 19.5839C-0.0315829 19.9456 0.0140624 20.3177 0.163856 20.6545C0.31365 20.9913 0.561081 21.2781 0.875804 21.4799C1.19053 21.6817 1.55886 21.7896 1.93563 21.7905Z" fill="url(#paint0_linear_174_4403)"/>
                          <defs>
                            <linearGradient id="paint0_linear_174_4403" x1="8.52558" y1="90.0973" x2="88.9933" y2="-3.01622" gradientUnits="userSpaceOnUse">
                              <stop offset="0.08" stopColor="#9945FF"/>
                              <stop offset="0.3" stopColor="#8752F3"/>
                              <stop offset="0.5" stopColor="#5497D5"/>
                              <stop offset="0.6" stopColor="#43B4CA"/>
                              <stop offset="0.72" stopColor="#28E0B9"/>
                              <stop offset="0.97" stopColor="#19FB9B"/>
                            </linearGradient>
                          </defs>
                        </svg>
                        Continue with Solana wallet
                      </>
                    )}
                  </button>
                )}

                {/* Solana Error Display */}
                {solanaError && (
                  <div className="text-red-500 text-sm text-center mt-2">
                    {solanaError}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
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
      
      <Footer />
    </div>
  );
} 