'use client';

import React, { useState } from 'react';
import { PaymentRequirement } from '@/lib/x402/config';
import { useWallet } from '@/contexts/WalletContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirements: PaymentRequirement[];
  onPaymentSuccess: (requirement: PaymentRequirement) => Promise<void>;
  apiName?: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  requirements,
  onPaymentSuccess,
  apiName = 'API',
}: PaymentModalProps) {
  const { walletType, isConnected, connectEvmWallet, connectSolanaWallet, address } = useWallet();
  const [selectedRequirement, setSelectedRequirement] = useState<PaymentRequirement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  if (!isOpen) return null;

  const getNetworkInfo = (networkId: string) => {
    const networks: Record<string, { name: string; icon: string; color: string }> = {
      'base-sepolia': { name: 'Base Sepolia', icon: '⟠', color: 'bg-blue-500' },
      'base': { name: 'Base', icon: '⟠', color: 'bg-blue-600' },
      'solana-devnet': { name: 'Solana Devnet', icon: '◎', color: 'bg-purple-500' },
      'solana': { name: 'Solana', icon: '◎', color: 'bg-purple-600' },
    };
    return networks[networkId] || { name: networkId, icon: '💰', color: 'bg-gray-500' };
  };
  
  const formatPrice = (atomicAmount: string) => {
    const amount = parseInt(atomicAmount) / 1_000_000;
    return `$${amount.toFixed(6)} USDC`;
  };
  
  const compatibleRequirements = requirements.filter(req => {
    if (!isConnected) return true;
    const isEvm = ['base-sepolia', 'base', 'ethereum'].includes(req.network);
    const isSolana = ['solana-devnet', 'solana'].includes(req.network);
    return (walletType === 'evm' && isEvm) || (walletType === 'solana' && isSolana);
  });
  
  const handlePayment = async () => {
    if (!selectedRequirement) {
      setError('Please select a payment option');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      await onPaymentSuccess(selectedRequirement);
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleConnect = async (type: 'evm' | 'solana') => {
    try {
      setError(null);
      if (type === 'evm') await connectEvmWallet();
      else await connectSolanaWallet();
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-900 to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Payment Required</h3>
              <p className="text-sm text-gray-300">x402 Protocol</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Requesting access to</p>
            <p className="font-medium text-gray-900">{apiName}</p>
          </div>
          
          {!isConnected && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Connect wallet</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleConnect('evm')} className="flex items-center justify-center gap-2 p-3 border rounded-lg hover:bg-blue-50">
                  <span className="text-xl">⟠</span>
                  <span className="text-sm font-medium">Ethereum</span>
                </button>
                <button onClick={() => handleConnect('solana')} className="flex items-center justify-center gap-2 p-3 border rounded-lg hover:bg-purple-50">
                  <span className="text-xl">◎</span>
                  <span className="text-sm font-medium">Solana</span>
                </button>
              </div>
            </div>
          )}
          
          {isConnected && address && (
            <div className="mb-4 flex items-center gap-2 p-2 bg-green-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${walletType === 'evm' ? 'bg-blue-500' : 'bg-purple-500'}`} />
              <span className="text-sm text-green-700">Connected: {address.slice(0, 8)}...{address.slice(-6)}</span>
            </div>
          )}
          
          {isConnected && (
            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-gray-700">Select payment option</p>
              {compatibleRequirements.map((req, i) => {
                const net = getNetworkInfo(req.network);
                return (
                  <button key={i} onClick={() => setSelectedRequirement(req)}
                    className={`w-full p-3 rounded-lg border-2 text-left ${selectedRequirement === req ? 'border-gray-900 bg-gray-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full ${net.color} flex items-center justify-center text-white`}>{net.icon}</div>
                        <span className="font-medium">{net.name}</span>
                      </div>
                      <span className="font-mono text-sm text-gray-600">{formatPrice(req.maxAmountRequired)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          
          {error && <div className="mb-4 p-3 bg-red-50 rounded-lg"><p className="text-sm text-red-700">{error}</p></div>}
        </div>
        
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handlePayment} disabled={!isConnected || !selectedRequirement || isProcessing}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {isProcessing ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Signing...</>
              ) : 'Pay & Continue'}
            </button>
          </div>
          <p className="mt-3 text-xs text-center text-gray-500">Powered by x402 Protocol</p>
        </div>
      </div>
    </div>
  );
}

