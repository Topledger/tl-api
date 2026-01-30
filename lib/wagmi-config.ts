// Chain configurations for EVM wallet connections
// Note: We use direct window.ethereum for wallet connections to avoid build issues

export const chains = {
  base: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
  },
  baseSepolia: {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
  },
  mainnet: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
  },
  sepolia: {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.gateway.tenderly.co',
  },
};

// Helper to get the current chain for a network
export function getChainForNetwork(network: string) {
  switch (network) {
    case 'base':
      return chains.base;
    case 'base-sepolia':
      return chains.baseSepolia;
    case 'ethereum':
      return chains.mainnet;
    case 'ethereum-sepolia':
      return chains.sepolia;
    default:
      return chains.baseSepolia;
  }
}

// Helper to switch chain
export async function switchChain(chainId: number) {
  const ethereum = (window as any).ethereum;
  if (!ethereum) return;
  
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error: any) {
    // Chain not added, try to add it
    if (error.code === 4902) {
      const chain = Object.values(chains).find(c => c.id === chainId);
      if (chain) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${chainId.toString(16)}`,
            chainName: chain.name,
            rpcUrls: [chain.rpcUrl],
          }],
        });
      }
    }
  }
}
