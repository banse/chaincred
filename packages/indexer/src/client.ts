import { HypersyncClient as RealHypersyncClient } from '@envio-dev/hypersync-client';
import type { Query, QueryResponse } from '@envio-dev/hypersync-client';
import { SUPPORTED_CHAINS } from '@chaincred/common';

export interface HypersyncClient {
  chainId: number;
  chainName: string;
  query: (params: Query) => Promise<QueryResponse>;
  getHeight: () => Promise<number>;
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

    const hypersync = new RealHypersyncClient({ url, apiToken: process.env.HYPERSYNC_API_TOKEN ?? '' });

    clients[chain.id] = {
      chainId: chain.id,
      chainName: chain.name,
      query: (params) => hypersync.get(params),
      getHeight: () => hypersync.getHeight(),
    };
  }

  return clients;
}
