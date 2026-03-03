import { SUPPORTED_CHAINS } from '@chaincred/common';
import type { ChainConfig } from '@chaincred/common';

export interface HypersyncClient {
  chainId: number;
  chainName: string;
  // Placeholder for @envio-dev/hypersync-client instance
  query: (params: any) => Promise<any>;
}

const HYPERSYNC_URLS: Record<number, string> = {
  1: 'https://eth.hypersync.xyz',
  42161: 'https://arbitrum.hypersync.xyz',
  10: 'https://optimism.hypersync.xyz',
  8453: 'https://base.hypersync.xyz',
  324: 'https://zksync.hypersync.xyz',
  137: 'https://polygon.hypersync.xyz',
};

export async function createClients(): Promise<Record<number, HypersyncClient>> {
  const clients: Record<number, HypersyncClient> = {};

  for (const chain of SUPPORTED_CHAINS) {
    const url = HYPERSYNC_URLS[chain.id];
    if (!url) continue;

    clients[chain.id] = {
      chainId: chain.id,
      chainName: chain.name,
      query: async (_params: any) => {
        // TODO: Initialize real HyperSync client
        // const { HypersyncClient } = await import('@envio-dev/hypersync-client');
        // return HypersyncClient.new({ url });
        return { data: [], nextBlock: 0 };
      },
    };
  }

  return clients;
}
