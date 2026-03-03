export interface ChainConfig {
  id: number;
  name: string;
  slug: string;
  rpcUrl: string;
  isL2: boolean;
}

/** Supported chains — PRD 7.1 */
export const SUPPORTED_CHAINS: ChainConfig[] = [
  { id: 1, name: 'Ethereum', slug: 'ethereum', rpcUrl: '', isL2: false },
  { id: 42161, name: 'Arbitrum One', slug: 'arbitrum', rpcUrl: '', isL2: true },
  { id: 10, name: 'Optimism', slug: 'optimism', rpcUrl: '', isL2: true },
  { id: 8453, name: 'Base', slug: 'base', rpcUrl: '', isL2: true },
  { id: 324, name: 'zkSync Era', slug: 'zksync', rpcUrl: '', isL2: true },
  { id: 137, name: 'Polygon', slug: 'polygon', rpcUrl: '', isL2: true },
];

export const CHAIN_IDS = SUPPORTED_CHAINS.map((c) => c.id);
