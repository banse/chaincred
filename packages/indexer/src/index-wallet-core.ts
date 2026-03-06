/**
 * Core wallet indexing logic — reusable by both CLI and API queue.
 * Indexes one address across all 6 EVM chains via HyperSync + Starknet via RPC.
 */
import { createClients } from './client.js';
import type { HypersyncClient } from './client.js';
import { createStorage } from './storage/db.js';
import type { ProcessedEvent } from './processor.js';
import { handleContractDeployment } from './handlers/contract-deployment.js';
import { handleGenericTransaction } from './handlers/generic.js';
import { getGovernanceSubtype } from './handlers/governance-vote.js';
import { lookupProtocol } from './registry/protocol-registry.js';
import {
  DAO_REGISTRY,
  isCreate2Factory,
  PERMIT_SELECTORS,
  FLASHLOAN_SELECTORS,
  ERC4337_SELECTORS,
  ERC4337_ENTRYPOINTS,
  SAFE_EXEC_SELECTOR,
  REASONED_VOTE_SELECTORS,
  MEV_CONTRACT_ADDRESSES,
  STARKNET_CHAIN_ID,
} from '@chaincred/common';
import { isValidStarknetAddress, normalizeStarknetAddress, getDb } from '@chaincred/common';
import { createStarknetClient } from './starknet-client.js';
import { processStarknetTx } from './starknet-processor.js';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

/** Per-chain batch sizes — L2s with sub-second blocks need smaller ranges to avoid HyperSync 5s timeout */
const MAX_NUM_BLOCKS: Record<number, number> = {
  1: 100_000,
  42161: 10_000,
  10: 100_000,
  8453: 100_000,
  324: 100_000,
  137: 25_000,
};
const DEFAULT_MAX_BLOCKS = 50_000;
const SIX_MONTHS = 15_768_000;

const STARKNET_BLOCK_PAGE_SIZE = 100;
const STARKNET_CONCURRENCY = 10;

export type ProgressCallback = (message: string) => void;

export interface IndexResult {
  address: string;
  totalTxs: number;
  chainsActive: number;
  elapsedMs: number;
  ensName?: string;
}

/** Same enrichment pipeline as processEvents() in processor.ts, applied to a single tx */
function enrichTransaction(chainId: number, tx: any, timestamp: number): ProcessedEvent {
  const enriched = { ...tx, timestamp };

  let event: ProcessedEvent;

  if (!tx.to) {
    event = handleContractDeployment(chainId, enriched);
  } else {
    event = handleGenericTransaction(chainId, enriched);
    const protocolDef = lookupProtocol(tx.to);
    if (protocolDef) {
      event.protocol = protocolDef.name;
      event.protocolCategory = protocolDef.category;
      if (event.timestamp > 0 && event.timestamp < protocolDef.launchTimestamp + SIX_MONTHS) {
        event.isEarlyAdoption = true;
      }
    }
    if (isCreate2Factory(tx.to)) {
      event.type = 'deployment';
      event.isCreate2 = true;
    }
    if (event.type === 'governance') {
      event.dao = DAO_REGISTRY.get(tx.to.toLowerCase());
      event.governanceSubtype = getGovernanceSubtype(tx.input || '');
      if (event.governanceSubtype === 'vote') {
        const input = tx.input || '';
        if (input.length >= 138) {
          event.voteSupport = parseInt(input.slice(136, 138), 16);
        }
      }
    }
  }

  event.txStatus = (tx as any).status ?? 1;
  const input = tx.input || '0x';
  event.calldataBytes = input.length > 2 ? Math.floor((input.length - 2) / 2) : 0;
  event.gasPriceGwei = Math.round(Number((tx as any).gasPrice ?? 0) / 1e9).toString();

  if (event.txStatus === 0) {
    const gasUsed = Number((tx as any).gasUsed ?? 0);
    const gasPrice = Number((tx as any).gasPrice ?? 0);
    event.failedTxGasEth = (gasUsed * gasPrice) / 1e18;
  }

  if (input.length >= 10) {
    const selector = input.slice(0, 10).toLowerCase();
    if (PERMIT_SELECTORS.has(selector)) event.isPermit = true;
    if (FLASHLOAN_SELECTORS.has(selector)) event.isFlashloan = true;
    if (ERC4337_SELECTORS.has(selector)) event.isErc4337 = true;
    if (selector === SAFE_EXEC_SELECTOR) event.isSafeExec = true;
    if (REASONED_VOTE_SELECTORS.has(selector)) event.isReasonedVote = true;
  }

  if (tx.to && ERC4337_ENTRYPOINTS.has(tx.to.toLowerCase())) {
    event.isSmartWallet = true;
  }

  if (tx.to && MEV_CONTRACT_ADDRESSES.has(tx.to.toLowerCase())) {
    event.isMevInteraction = true;
  }

  return event;
}

async function indexChain(
  client: HypersyncClient,
  address: string,
  onProgress?: ProgressCallback,
): Promise<ProcessedEvent[]> {
  const archiveHeight = await client.getHeight();
  let fromBlock = 0;
  const events: ProcessedEvent[] = [];

  onProgress?.(`Scanning ${client.chainName}...`);

  while (fromBlock < archiveHeight) {
    const result = await client.query({
      fromBlock,
      maxNumBlocks: MAX_NUM_BLOCKS[client.chainId] ?? DEFAULT_MAX_BLOCKS,
      transactions: [{ from: [address] }],
      fieldSelection: {
        transaction: ['Hash', 'From', 'To', 'Input', 'Value', 'BlockNumber', 'Status', 'GasPrice', 'GasUsed'],
        block: ['Number', 'Timestamp'],
      },
    });

    const blockTimestamps = new Map<number, number>();
    for (const block of result.data.blocks) {
      if (block.number != null && block.timestamp != null) {
        blockTimestamps.set(block.number, block.timestamp);
      }
    }

    for (const tx of result.data.transactions) {
      const timestamp = blockTimestamps.get(tx.blockNumber ?? 0) ?? 0;
      events.push(enrichTransaction(client.chainId, tx, timestamp));
    }

    if (result.nextBlock <= fromBlock) break;
    fromBlock = result.nextBlock;
  }

  if (events.length > 0) {
    onProgress?.(`${client.chainName}: ${events.length} txs`);
  }

  return events;
}

async function indexStarknet(address: string, onProgress?: ProgressCallback): Promise<ProcessedEvent[]> {
  const rpcUrl = process.env.STARKNET_RPC_URL;
  if (!rpcUrl) return [];

  const client = createStarknetClient(rpcUrl);
  const currentBlock = await client.getBlockNumber();
  const normalizedAddr = normalizeStarknetAddress(address);
  const events: ProcessedEvent[] = [];

  onProgress?.(`Scanning Starknet (${currentBlock.toLocaleString()} blocks)...`);

  for (let pageStart = 0; pageStart <= currentBlock; pageStart += STARKNET_BLOCK_PAGE_SIZE) {
    const pageEnd = Math.min(pageStart + STARKNET_BLOCK_PAGE_SIZE - 1, currentBlock);

    const blockNumbers: number[] = [];
    for (let b = pageStart; b <= pageEnd; b++) {
      blockNumbers.push(b);
    }

    for (let i = 0; i < blockNumbers.length; i += STARKNET_CONCURRENCY) {
      const batch = blockNumbers.slice(i, i + STARKNET_CONCURRENCY);
      const blocks = await Promise.all(
        batch.map(async (blockNum) => {
          try {
            return await client.getBlockWithTxs(blockNum);
          } catch {
            return null;
          }
        }),
      );

      for (const block of blocks) {
        if (!block) continue;

        for (const tx of block.transactions) {
          const senderNorm = tx.sender_address
            ? normalizeStarknetAddress(tx.sender_address)
            : null;
          if (senderNorm !== normalizedAddr) continue;

          events.push(processStarknetTx(tx, block.block_number, block.timestamp, STARKNET_CHAIN_ID));
        }
      }
    }

    if (pageStart > 0 && pageStart % 1000 === 0) {
      onProgress?.(`Starknet: ${pageStart.toLocaleString()} / ${currentBlock.toLocaleString()} blocks (${events.length} txs)`);
    }
  }

  return events;
}

/**
 * Index a single wallet across all supported chains.
 * Returns result with tx count and timing. Calls onProgress with status updates.
 */
export async function indexWallet(
  address: string,
  onProgress?: ProgressCallback,
): Promise<IndexResult> {
  const isStarknet = isValidStarknetAddress(address) && address.length !== 42;
  const isEvm = address.length === 42;

  if (!isStarknet && !isEvm) {
    throw new Error('Invalid address format');
  }

  const normalizedAddress = address.toLowerCase();
  const startTime = Date.now();

  let allEvents: ProcessedEvent[] = [];
  let chainsActive = 0;

  if (isEvm) {
    onProgress?.('Connecting to HyperSync...');
    const clients = await createClients();
    const activeClients = Object.values(clients);
    const chainResults = await Promise.all(
      activeClients.map(async (client) => {
        try {
          return await indexChain(client, normalizedAddress, onProgress);
        } catch (err) {
          onProgress?.(`${client.chainName}: error - ${(err as Error).message}`);
          return [] as ProcessedEvent[];
        }
      }),
    );

    for (const events of chainResults) {
      if (events.length > 0) chainsActive++;
      for (let j = 0; j < events.length; j++) allEvents.push(events[j]);
    }
  }

  if (isStarknet) {
    try {
      const starknetEvents = await indexStarknet(normalizedAddress, onProgress);
      if (starknetEvents.length > 0) chainsActive++;
      for (let j = 0; j < starknetEvents.length; j++) allEvents.push(starknetEvents[j]);
    } catch (err) {
      onProgress?.(`Starknet: error - ${(err as Error).message}`);
    }
  }

  const totalTxs = allEvents.length;
  if (totalTxs > 0) {
    onProgress?.(`Writing ${totalTxs} events to database...`);
    const storage = createStorage();
    await storage.saveEvents(allEvents);
    await storage.computeAndSaveActivity(normalizedAddress, allEvents);
  }

  // Resolve ENS name for EVM addresses
  let ensName: string | undefined;
  if (isEvm) {
    try {
      onProgress?.('Resolving ENS...');
      const viemClient = createPublicClient({
        chain: mainnet,
        transport: http(process.env.RPC_URL, { timeout: 5_000 }),
      });
      const name = await viemClient.getEnsName({ address: normalizedAddress as `0x${string}` });
      if (name) {
        const sql = getDb();
        await sql`UPDATE wallet_activity SET ens_name = ${name} WHERE address = ${normalizedAddress}`;
        ensName = name;
      }
    } catch {
      // Fail-open: skip ENS if RPC is unreachable
    }
  }

  const elapsedMs = Date.now() - startTime;
  onProgress?.(`Done: ${totalTxs} txs across ${chainsActive} chains in ${(elapsedMs / 1000).toFixed(1)}s`);

  return { address: normalizedAddress, totalTxs, chainsActive, elapsedMs, ensName };
}
