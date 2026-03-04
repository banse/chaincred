#!/usr/bin/env bun
/**
 * Single-wallet indexer — indexes one address across all 6 chains via HyperSync.
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
} from '@chaincred/common';

const MAX_NUM_BLOCKS = 10_000;
const SIX_MONTHS = 15_768_000;

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

async function main() {
  const address = process.argv[2];
  if (!address || !address.startsWith('0x') || address.length !== 42) {
    console.error('Usage: bun run index-wallet <0x address>');
    process.exit(1);
  }

  const normalizedAddress = address.toLowerCase();
  console.log(`\nIndexing wallet: ${address}`);
  const startTime = Date.now();

  const clients = await createClients();
  const storage = createStorage();

  const results = await Promise.all(
    Object.values(clients).map(async (client) => {
      try {
        return await indexChain(client, normalizedAddress, storage);
      } catch (err) {
        console.error(`  [${client.chainName}] Error:`, (err as Error).message);
        return 0;
      }
    }),
  );

  const totalTxs = results.reduce((sum, n) => sum + n, 0);
  const chainsActive = results.filter((n) => n > 0).length;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\nDone: ${totalTxs} txs across ${chainsActive} chains in ${elapsed}s`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
