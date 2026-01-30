'use client';

import React from 'react';
import { WalletProvider } from '@/contexts/WalletContext';

interface ProvidersProps {
  children: React.ReactNode;
}

// Simple wrapper that provides wallet context
// Using direct window.ethereum and window.solana for wallet connections
// This avoids wagmi connector build issues
export default function WagmiProvider({ children }: ProvidersProps) {
  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  );
}
