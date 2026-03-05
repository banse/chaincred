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

const MAX_NUM_BLOCKS = 10_000;
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
  storage: ReturnType<typeof createStorage>,
): Promise<number> {
  const archiveHeight = await client.getHeight();
  let fromBlock = 0;
  let totalTxs = 0;

  console.log(`  [${client.chainName}] Scanning blocks 0 → ${archiveHeight.toLocaleString()}...`);

  while (fromBlock < archiveHeight) {
    const result = await client.query({
      fromBlock,
      includeAllBlocks: true,
      maxNumBlocks: MAX_NUM_BLOCKS,
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
      const event = enrichTransaction(client.chainId, tx, timestamp);
      await storage.saveEvent(event);
      totalTxs++;
    }

    if (result.nextBlock <= fromBlock) break;
    fromBlock = result.nextBlock;
  }

  if (totalTxs > 0) {
    console.log(`  [${client.chainName}] Done — ${totalTxs} transactions`);
  } else {
    console.log(`  [${client.chainName}] No activity`);
  }

  return totalTxs;
}

/** Scan Starknet blocks for transactions from a specific address */
async function indexStarknet(
  address: string,
  storage: ReturnType<typeof createStorage>,
): Promise<number> {
  const rpcUrl = process.env.STARKNET_RPC_URL;
  if (!rpcUrl) {
    console.log('  [Starknet] Skipped — STARKNET_RPC_URL not set');
    return 0;
  }

  const client = createStarknetClient(rpcUrl);
  const currentBlock = await client.getBlockNumber();
  const normalizedAddr = normalizeStarknetAddress(address);
  let totalTxs = 0;

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

          const event = processStarknetTx(tx, block.block_number, block.timestamp, STARKNET_CHAIN_ID);
          await storage.saveEvent(event);
          totalTxs++;
        }
      }
    }

    // Progress logging every 1000 blocks
    if (pageStart > 0 && pageStart % 1000 === 0) {
      console.log(`  [Starknet] Scanned ${pageStart.toLocaleString()} / ${currentBlock.toLocaleString()} blocks (${totalTxs} txs found)`);
    }
  }

  if (totalTxs > 0) {
    console.log(`  [Starknet] Done — ${totalTxs} transactions`);
  } else {
    console.log(`  [Starknet] No activity`);
  }

  return totalTxs;
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

  const storage = createStorage();
  let totalTxs = 0;
  let chainsActive = 0;

  if (isEvm) {
    // Index all 6 EVM chains via HyperSync
    const clients = await createClients();
    const activeClients = Object.values(clients).filter((client) => {
      const nameLC = client.chainName.toLowerCase();
      if ([...skipChains].some((s) => nameLC.includes(s))) {
        console.log(`  [${client.chainName}] Skipped (--skip)`);
        return false;
      }
      return true;
    });
    const results = await Promise.all(
      activeClients.map(async (client) => {
        try {
          return await indexChain(client, normalizedAddress, storage);
        } catch (err) {
          console.error(`  [${client.chainName}] Error:`, (err as Error).message);
          return 0;
        }
      }),
    );

    totalTxs = results.reduce((sum, n) => sum + n, 0);
    chainsActive = results.filter((n) => n > 0).length;
  }

  if (isStarknet) {
    // Index Starknet via RPC
    try {
      const starknetTxs = await indexStarknet(normalizedAddress, storage);
      totalTxs += starknetTxs;
      if (starknetTxs > 0) chainsActive++;
    } catch (err) {
      console.error('  [Starknet] Error:', (err as Error).message);
    }
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
