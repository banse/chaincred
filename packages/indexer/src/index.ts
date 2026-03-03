import { createClients } from './client.js';
import type { HypersyncClient } from './client.js';
import { processEvents } from './processor.js';
import { createStorage, type StorageLayer } from './storage/db.js';
import { SUPPORTED_CHAINS } from '@chaincred/common';

const POLL_INTERVAL_MS = 30_000;

async function indexChain(client: HypersyncClient, storage: StorageLayer) {
  let fromBlock = await storage.getLastProcessedBlock(client.chainId);
  const archiveHeight = await client.getHeight();
  console.log(`[${client.chainName}] Syncing blocks ${fromBlock} → ${archiveHeight}`);

  while (fromBlock < archiveHeight) {
    const { events, nextBlock } = await processEvents(client, fromBlock);
    console.log(`[${client.chainName}] Page ${fromBlock}–${nextBlock}: ${events.length} events`);

    for (const event of events) {
      await storage.saveEvent(event);
    }

    // Always advance cursor to nextBlock (fixes empty-range stalls)
    await storage.setLastProcessedBlock(client.chainId, nextBlock);

    if (nextBlock <= fromBlock) break; // safety guard
    fromBlock = nextBlock;
  }
}

async function runCycle(clients: Record<number, HypersyncClient>, storage: StorageLayer) {
  await Promise.all(
    Object.values(clients).map(async (client) => {
      try {
        await indexChain(client, storage);
      } catch (err) {
        console.error(`[${client.chainName}] Error:`, err);
      }
    }),
  );
}

async function main() {
  console.log('Starting ChainCred indexer...');
  console.log(`Indexing ${SUPPORTED_CHAINS.length} chains`);

  const clients = await createClients();
  const storage = createStorage();

  // Initial run
  await runCycle(clients, storage);

  // Poll every 30 seconds
  setInterval(() => runCycle(clients, storage), POLL_INTERVAL_MS);
  console.log('Indexer running — polling every 30s');
}

main().catch(console.error);
