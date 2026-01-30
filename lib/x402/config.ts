// x402 Protocol Configuration
// Based on https://github.com/coinbase/x402

export const X402_CONFIG = {
  // Version of x402 protocol
  version: 1,
  
  // Facilitator URL for payment verification and settlement
  // Using the hosted test facilitator for Base Sepolia and Solana devnet
  facilitatorUrl: process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator',
  
  // Your receiving wallet addresses for payments (separate for each chain type)
  payToAddressEvm: process.env.X402_PAY_TO_ADDRESS || '',
  payToAddressSolana: process.env.X402_PAY_TO_SOLANA || '', // Solana base58 address
  
  // Supported networks
  networks: {
    // EVM Networks
    'base-sepolia': {
      name: 'Base Sepolia (Testnet)',
      chainId: 84532,
      type: 'evm',
      asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
      rpcUrl: 'https://sepolia.base.org',
    },
    'base': {
      name: 'Base (Mainnet)',
      chainId: 8453,
      type: 'evm',
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
      rpcUrl: 'https://mainnet.base.org',
    },
    // Solana Networks
    'solana-devnet': {
      name: 'Solana Devnet',
      type: 'solana',
      // Devnet USDC - Note: You need to use a devnet USDC mint, not mainnet
      // Circle's devnet USDC: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
      asset: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      rpcUrl: 'https://api.devnet.solana.com',
    },
    'solana': {
      name: 'Solana (Mainnet)',
      type: 'solana',
      asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
      rpcUrl: 'https://api.mainnet-beta.solana.com',
    },
  },
  
  // Default pricing for API endpoints (in USD)
  defaultPrices: {
    'trading': '$0.001', // Trading APIs
    'research': '$0.0005', // Research APIs
  },
  
  // Payment timeout in seconds
  maxTimeoutSeconds: 60,
};

// Payment requirement types
export interface PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: Record<string, any>;
}

export interface PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: any;
}

export interface PaymentRequiredResponse {
  x402Version: number;
  accepts: PaymentRequirement[];
  error?: string;
}

// Helper to create payment requirements for an endpoint
export function createPaymentRequirements(
  resource: string,
  description: string,
  priceUsd: string,
  networks: string[] = ['base-sepolia', 'solana-devnet']
): PaymentRequirement[] {
  const requirements: PaymentRequirement[] = [];
  
  // Convert USD price to atomic units (assuming 6 decimals for USDC)
  const priceValue = parseFloat(priceUsd.replace('$', ''));
  const atomicAmount = Math.floor(priceValue * 1_000_000).toString();
  
  for (const networkId of networks) {
    const network = X402_CONFIG.networks[networkId as keyof typeof X402_CONFIG.networks];
    if (!network) continue;
    
    // Use correct address based on network type
    const payTo = network.type === 'solana' 
      ? X402_CONFIG.payToAddressSolana 
      : X402_CONFIG.payToAddressEvm;
    
    // Skip if no pay-to address configured for this network type
    if (!payTo) continue;
    
    requirements.push({
      scheme: 'exact',
      network: networkId,
      maxAmountRequired: atomicAmount,
      resource: resource,
      description: description,
      mimeType: 'application/json',
      payTo: payTo,
      maxTimeoutSeconds: X402_CONFIG.maxTimeoutSeconds,
      asset: network.asset,
      extra: network.type === 'evm' ? {
        name: 'USD Coin',
        version: '2',
      } : undefined,
    });
  }
  
  return requirements;
}

