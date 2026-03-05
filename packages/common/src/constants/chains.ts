export interface ChainConfig {
  id: number;
  name: string;
  slug: string;
  rpcUrl: string;
  isL2: boolean;
}

/** Starknet mainnet chain ID (SN_MAIN as felt → 0x534e5f4d41494e → decimal) */
export const STARKNET_CHAIN_ID = 0x534e5f4d41494e;

/** Supported chains — PRD 7.1 */
export const SUPPORTED_CHAINS: ChainConfig[] = [
  { id: 1, name: 'Ethereum', slug: 'ethereum', rpcUrl: '', isL2: false },
  { id: 42161, name: 'Arbitrum One', slug: 'arbitrum', rpcUrl: '', isL2: true },
  { id: 10, name: 'Optimism', slug: 'optimism', rpcUrl: '', isL2: true },
  { id: 8453, name: 'Base', slug: 'base', rpcUrl: '', isL2: true },
  { id: 324, name: 'zkSync Era', slug: 'zksync', rpcUrl: '', isL2: true },
  { id: 137, name: 'Polygon', slug: 'polygon', rpcUrl: '', isL2: true },
  { id: STARKNET_CHAIN_ID, name: 'Starknet', slug: 'starknet', rpcUrl: '', isL2: true },
];

/** EVM chain IDs only (excludes Starknet) — used by HyperSync indexer */
export const EVM_CHAIN_IDS = SUPPORTED_CHAINS.filter((c) => c.id !== STARKNET_CHAIN_ID).map((c) => c.id);

export const CHAIN_IDS = SUPPORTED_CHAINS.map((c) => c.id);
