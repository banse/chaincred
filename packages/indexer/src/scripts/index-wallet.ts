#!/usr/bin/env bun
/**
 * Single-wallet indexer — indexes one address across all 6 EVM chains via HyperSync,
 * plus Starknet via RPC (if STARKNET_RPC_URL is set and address is Starknet format).
 * Usage: bun run index-wallet <address>
 */
import { createClients } from '../client.js';
import type { HypersyncClient } from '../client.js';
import { createStorage } from '../storage/db.js';
import type { ProcessedEvent } from '../processor.js';
import { handleContractDeployment } from '../handlers/contract-deployment.js';
import { handleGenericTransaction } from '../handlers/generic.js';
import { getGovernanceSubtype } from '../handlers/governance-vote.js';
import { lookupProtocol } from '../registry/protocol-registry.js';
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
import { createStarknetClient } from '../starknet-client.js';
import { processStarknetTx } from '../starknet-processor.js';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

/** Per-chain batch sizes — L2s with sub-second blocks need smaller ranges to avoid HyperSync 5s timeout */
const MAX_NUM_BLOCKS: Record<number, number> = {
  1: 100_000, // Ethereum — 12s blocks, moderate density
  42161: 10_000, // Arbitrum — 0.25s blocks, very dense
  10: 100_000, // Optimism — 2s blocks, moderate
  8453: 100_000, // Base — 2s blocks, moderate
  324: 100_000, // zkSync — moderate density
  137: 25_000, // Polygon — 2s blocks, fairly dense
};
const DEFAULT_MAX_BLOCKS = 50_000;
const SIX_MONTHS = 15_768_000;

/** Starknet scanning config */
const STARKNET_BLOCK_PAGE_SIZE = 100;
const STARKNET_CONCURRENCY = 10;

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
): Promise<ProcessedEvent[]> {
  const archiveHeight = await client.getHeight();
  let fromBlock = 0;
  const events: ProcessedEvent[] = [];

  console.log(`  [${client.chainName}] Scanning blocks 0 → ${archiveHeight.toLocaleString()}...`);

  while (fromBlock < archiveHeight) {
    const result = await client.query({
      fromBlock,
      maxNumBlocks: MAX_NUM_BLOCKS[client.chainId] ?? DEFAULT_MAX_BLOCKS,
      transactions: [{ from: [address] }],
      fieldSelection: {
        transaction: ['Hash', 'From', 'To', 'Input', 'Value', 'BlockNumber', 'Status', 'GasPrice'],
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
    console.log(`  [${client.chainName}] Done — ${events.length} transactions`);
  } else {
    console.log(`  [${client.chainName}] No activity`);
  }

  return events;
}

/** Scan Starknet blocks for transactions from a specific address */
async function indexStarknet(address: string): Promise<ProcessedEvent[]> {
  const rpcUrl = process.env.STARKNET_RPC_URL;
  if (!rpcUrl) {
    console.log('  [Starknet] Skipped — STARKNET_RPC_URL not set');
    return [];
  }

  const client = createStarknetClient(rpcUrl);
  const currentBlock = await client.getBlockNumber();
  const normalizedAddr = normalizeStarknetAddress(address);
  const events: ProcessedEvent[] = [];

  console.log(`  [Starknet] Scanning blocks 0 → ${currentBlock.toLocaleString()} (RPC, filtered client-side)...`);

  for (let pageStart = 0; pageStart <= currentBlock; pageStart += STARKNET_BLOCK_PAGE_SIZE) {
    const pageEnd = Math.min(pageStart + STARKNET_BLOCK_PAGE_SIZE - 1, currentBlock);

    // Fetch blocks concurrently in batches
    const blockNumbers: number[] = [];
    for (let b = pageStart; b <= pageEnd; b++) {
      blockNumbers.push(b);
    }

    // Process in concurrent batches of STARKNET_CONCURRENCY
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
          // Filter: only txs from the target address
          const senderNorm = tx.sender_address
            ? normalizeStarknetAddress(tx.sender_address)
            : null;
          if (senderNorm !== normalizedAddr) continue;

          events.push(processStarknetTx(tx, block.block_number, block.timestamp, STARKNET_CHAIN_ID));
        }
      }
    }

    // Progress logging every 1000 blocks
    if (pageStart > 0 && pageStart % 1000 === 0) {
      console.log(`  [Starknet] Scanned ${pageStart.toLocaleString()} / ${currentBlock.toLocaleString()} blocks (${events.length} txs found)`);
    }
  }

  if (events.length > 0) {
    console.log(`  [Starknet] Done — ${events.length} transactions`);
  } else {
    console.log(`  [Starknet] No activity`);
  }

  return events;
}

async function main() {
  const address = process.argv[2];
  if (!address || !address.startsWith('0x')) {
    console.error('Usage: bun run index-wallet <0x address> [--skip chain1,chain2]');
    process.exit(1);
  }

  // Parse --skip flag: e.g. --skip arbitrum,polygon
  const skipIdx = process.argv.indexOf('--skip');
  const skipChains = new Set(
    skipIdx > -1 ? (process.argv[skipIdx + 1] || '').toLowerCase().split(',') : [],
  );

  const isStarknet = isValidStarknetAddress(address) && address.length !== 42;
  const isEvm = address.length === 42;

  if (!isStarknet && !isEvm) {
    console.error('Invalid address format. Provide an EVM (0x + 40 hex) or Starknet (0x + up to 64 hex) address.');
    process.exit(1);
  }

  const normalizedAddress = address.toLowerCase();
  console.log(`\nIndexing wallet: ${address}${isStarknet ? ' (Starknet)' : ''}`);
  const startTime = Date.now();

  let allEvents: ProcessedEvent[] = [];
  let chainsActive = 0;

  if (isEvm) {
    // Index all 6 EVM chains via HyperSync — collect events in memory
    const clients = await createClients();
    const activeClients = Object.values(clients).filter((client) => {
      const nameLC = client.chainName.toLowerCase();
      if ([...skipChains].some((s) => nameLC.includes(s))) {
        console.log(`  [${client.chainName}] Skipped (--skip)`);
        return false;
      }
      return true;
    });
    const chainResults = await Promise.all(
      activeClients.map(async (client) => {
        try {
          return await indexChain(client, normalizedAddress);
        } catch (err) {
          console.error(`  [${client.chainName}] Error:`, (err as Error).message);
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
    // Index Starknet via RPC — collect events in memory
    try {
      const starknetEvents = await indexStarknet(normalizedAddress);
      if (starknetEvents.length > 0) chainsActive++;
      for (let j = 0; j < starknetEvents.length; j++) allEvents.push(starknetEvents[j]);
    } catch (err) {
      console.error('  [Starknet] Error:', (err as Error).message);
    }
  }

  // Batch write phase — all events at once
  const totalTxs = allEvents.length;
  if (totalTxs > 0) {
    console.log(`\nWriting ${totalTxs} events to database...`);
    const storage = createStorage();
    await storage.saveEvents(allEvents);
    await storage.computeAndSaveActivity(normalizedAddress, allEvents);
  }

  // Resolve ENS name for EVM addresses and cache in DB
  if (isEvm) {
    try {
      const viemClient = createPublicClient({
        chain: mainnet,
        transport: http(process.env.RPC_URL, { timeout: 5_000 }),
      });
      const ensName = await viemClient.getEnsName({ address: normalizedAddress as `0x${string}` });
      if (ensName) {
        const sql = getDb();
        await sql`UPDATE wallet_activity SET ens_name = ${ensName} WHERE address = ${normalizedAddress}`;
        console.log(`ENS: ${ensName}`);
      }
    } catch {
      // Fail-open: skip ENS if RPC is unreachable
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone: ${totalTxs} txs across ${chainsActive} chains in ${elapsed}s`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
