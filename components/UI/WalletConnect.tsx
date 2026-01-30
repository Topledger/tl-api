'use client';

import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';

interface WalletConnectProps {
  onConnect?: () => void;
  className?: string;
}

export default function WalletConnect({ onConnect, className = '' }: WalletConnectProps) {
  const {
    walletType,
    address,
    isConnected,
    isConnecting,
    connectEvmWallet,
    connectSolanaWallet,
    disconnect,
  } = useWallet();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  
  // Handle wallet connection
  const handleConnectEvm = async () => {
    setError(null);
    try {
      await connectEvmWallet();
      setShowWalletOptions(false);
      onConnect?.();
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    }
  };
  
  const handleConnectSolana = async () => {
    setError(null);
    try {
      await connectSolanaWallet();
      setShowWalletOptions(false);
      onConnect?.();
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    }
  };
  
  // Connected state
  if (isConnected && address) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {/* Wallet icon */}
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
            walletType === 'evm' ? 'bg-blue-500' : 'bg-purple-500'
          }`}>
            {walletType === 'evm' ? 'E' : 'S'}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {formatAddress(address)}
          </span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Dropdown */}
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs text-gray-500">Connected with</p>
                <p className="text-sm font-medium text-gray-900">
                  {walletType === 'evm' ? 'Ethereum/Base' : 'Solana'}
                </p>
              </div>
              <button
                onClick={() => {
                  disconnect();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
  
  // Not connected state
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowWalletOptions(!showWalletOptions)}
        disabled={isConnecting}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Connect Wallet</span>
          </>
        )}
      </button>
      
      {/* Wallet options dropdown */}
      {showWalletOptions && !isConnecting && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowWalletOptions(false);
              setError(null);
            }}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">Connect Wallet</p>
              <p className="text-xs text-gray-500">Pay for API calls with x402</p>
            </div>
            
            {error && (
              <div className="mx-4 my-2 p-2 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
            
            {/* Ethereum option */}
            <button
              onClick={handleConnectEvm}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 9l10 7 10-7-10-7zM2 17l10 7 10-7-10-5.5L2 17z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Ethereum / Base</p>
                <p className="text-xs text-gray-500">MetaMask, Coinbase Wallet</p>
              </div>
            </button>
            
            {/* Solana option */}
            <button
              onClick={handleConnectSolana}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.5 6.5L12 2l7.5 4.5v11L12 22l-7.5-4.5v-11zm1.5 9.5l6 3.5 6-3.5v-8l-6-3.5-6 3.5v8z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Solana</p>
                <p className="text-xs text-gray-500">Phantom, Solflare</p>
              </div>
            </button>
            
            <div className="px-4 pt-2 pb-1 border-t border-gray-100 mt-1">
              <p className="text-xs text-gray-400 text-center">
                Powered by x402 Protocol
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

