'use client';

import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnect, useAccount } from 'wagmi';
import Button from '@/components/UI/Button';
import Footer from '@/components/Layout/Footer';

export default function SignInPage() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [solanaLoading, setSolanaLoading] = useState(false);
  const [ethereumLoading, setEthereumLoading] = useState(false);
  
  // Solana wallet hooks
  const { wallets: solanaWallets, publicKey: solanaPublicKey, disconnect: disconnectSolana, connected, connecting, select, connect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  
  // Ethereum wallet hooks
  const { connect: connectEthereum, connectors } = useConnect();
  const { address: ethereumAddress, isConnected } = useAccount();

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

  // Handle Solana wallet connection
  useEffect(() => {
    if (solanaPublicKey && connected) {
      // Check if user manually signed out to prevent auto-login
      const manualSignOut = localStorage.getItem('manualSignOut');
      if (manualSignOut === 'true') {
        setSolanaLoading(false);
        return;
      }
      
      // Clear loading state and proceed with auth
      setSolanaLoading(false);
      handleSolanaAuth(solanaPublicKey.toString());
    }
  }, [solanaPublicKey, connected]);

  // Handle Ethereum wallet connection  
  useEffect(() => {
    if (isConnected && ethereumAddress) {
      // Check if user manually signed out to prevent auto-login
      const manualSignOut = localStorage.getItem('manualSignOut');
      if (manualSignOut === 'true') {
        setEthereumLoading(false);
        return;
      }
      
      handleEthereumAuth(ethereumAddress);
    }
  }, [isConnected, ethereumAddress]);

  const handleSolanaAuth = async (publicKey: string) => {
    try {
      const result = await signIn('solana-wallet', {
        publicKey: publicKey,
        signature: 'temp-signature',
        callbackUrl: '/'
      });
      
      if (result?.error) {
        alert('Authentication failed');
      }
    } catch (error) {
      alert('Authentication failed');
    } finally {
      setSolanaLoading(false);
    }
  };

  const handleEthereumAuth = async (address: string) => {
    try {
      const result = await signIn('ethereum-wallet', {
        address: address,
        signature: 'temp-signature',
        callbackUrl: '/'
      });
      
      if (result?.error) {
        alert('Authentication failed');
      }
    } catch (error) {
      alert('Authentication failed');
    } finally {
      setEthereumLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    // Clear manual sign out flag since user is deliberately signing in
    localStorage.removeItem('manualSignOut');
    
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
    // Clear manual sign out flag since user is deliberately signing in
    localStorage.removeItem('manualSignOut');
    
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

  const handleSolanaWalletConnect = async () => {
    setSolanaLoading(true);
    localStorage.removeItem('manualSignOut');
    
    try {
      if (solanaPublicKey) {
        handleSolanaAuth(solanaPublicKey.toString());
        return;
      }
      
      const phantomWallet = solanaWallets.find(wallet => wallet.adapter.name === 'Phantom');
      if (phantomWallet) {
        select(phantomWallet.adapter.name);
        await connect();
      } else {
        alert('Phantom wallet not found. Please install Phantom wallet.');
        setSolanaLoading(false);
      }
    } catch (error) {
      setSolanaLoading(false);
    }
  };

  const handleEthereumWalletConnect = async () => {
    setEthereumLoading(true);
    localStorage.removeItem('manualSignOut');
    
    try {
      const metaMaskConnector = connectors.find(connector => connector.name === 'MetaMask');
      if (metaMaskConnector) {
        await connectEthereum({ connector: metaMaskConnector });
      } else {
        alert('MetaMask not found. Please install MetaMask.');
        setEthereumLoading(false);
      }
    } catch (error) {
      alert('Failed to connect to Ethereum wallet');
      setEthereumLoading(false);
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
            {/* Social Login Buttons */}
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading || discordLoading || solanaLoading || ethereumLoading}
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
              disabled={googleLoading || discordLoading || solanaLoading || ethereumLoading}
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

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or connect wallet</span>
              </div>
            </div>

            {/* Wallet Login Buttons */}
            <button
              onClick={handleSolanaWalletConnect}
              disabled={googleLoading || discordLoading || solanaLoading || ethereumLoading}
              className="w-full bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white py-3 px-4 rounded-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#9945FF] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {solanaLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.4 4.9c.2-.2.4-.3.7-.3h13.5c.6 0 .9.7.5 1.1l-3.9 3.9c-.2.2-.4.3-.7.3H3.5c-.6 0-.9-.7-.5-1.1L7.4 4.9zm0 6.4c.2-.2.4-.3.7-.3h13.5c.6 0 .9.7.5 1.1l-3.9 3.9c-.2.2-.4.3-.7.3H3.5c-.6 0-.9-.7-.5-1.1l4.4-3.9zm9.5 6.4c-.2.2-.4.3-.7.3H2.7c-.6 0-.9-.7-.5-1.1l3.9-3.9c.2-.2.4-.3.7-.3h13.5c.6 0 .9.7.5 1.1l-3.9 3.9z"/>
                  </svg>
                  Connect Solana Wallet
                </>
              )}
            </button>

            <button
              onClick={handleEthereumWalletConnect}
              disabled={googleLoading || discordLoading || solanaLoading || ethereumLoading}
              className="w-full bg-[#627EEA] text-white py-3 px-4 rounded-sm font-medium hover:bg-[#5A6FDD] focus:outline-none focus:ring-2 focus:ring-[#627EEA] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {ethereumLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
                  </svg>
                  Connect Ethereum Wallet
                </>
              )}
            </button>
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