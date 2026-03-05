/**
 * Lightweight Starknet JSON-RPC client for block/tx fetching.
 * Uses STARKNET_RPC_URL env var (e.g. Alchemy Starknet endpoint).
 */

export interface StarknetTransaction {
  type: 'INVOKE' | 'DEPLOY_ACCOUNT' | 'DECLARE' | 'L1_HANDLER' | 'DEPLOY';
  transaction_hash: string;
  sender_address?: string;
  contract_address?: string;
  calldata?: string[];
  max_fee?: string;
  nonce?: string;
  version?: string;
}

export interface StarknetBlock {
  block_number: number;
  timestamp: number;
  transactions: StarknetTransaction[];
}

export interface StarknetReceipt {
  transaction_hash: string;
  actual_fee: { amount: string; unit: string };
  execution_status: 'SUCCEEDED' | 'REVERTED';
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function rpcCall<T>(url: string, method: string, params: unknown[]): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = (await res.json()) as { result?: T; error?: { code: number; message: string } };

      if (json.error) {
        throw new Error(`RPC error ${json.error.code}: ${json.error.message}`);
      }

      return json.result as T;
    } catch (err) {
      lastError = err as Error;
      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

export interface StarknetClient {
  getBlockNumber(): Promise<number>;
  getBlockWithTxs(blockNumber: number): Promise<StarknetBlock>;
  getTransactionReceipt(txHash: string): Promise<StarknetReceipt>;
  rpcUrl: string;
}

export function createStarknetClient(rpcUrl?: string): StarknetClient {
  const url = rpcUrl ?? process.env.STARKNET_RPC_URL;
  if (!url) {
    throw new Error('STARKNET_RPC_URL environment variable is required');
  }

  return {
    rpcUrl: url,

    async getBlockNumber(): Promise<number> {
      return rpcCall<number>(url, 'starknet_blockNumber', []);
    },

    async getBlockWithTxs(blockNumber: number): Promise<StarknetBlock> {
      return rpcCall<StarknetBlock>(url, 'starknet_getBlockWithTxs', [
        { block_number: blockNumber },
      ]);
    },

    async getTransactionReceipt(txHash: string): Promise<StarknetReceipt> {
      return rpcCall<StarknetReceipt>(url, 'starknet_getTransactionReceipt', [txHash]);
    },
  };
}
