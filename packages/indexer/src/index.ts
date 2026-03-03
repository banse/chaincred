import { createClients } from './client.js';
import { processEvents } from './processor.js';
import { SUPPORTED_CHAINS } from '@chaincred/common';

async function main() {
  console.log('Starting ChainCred indexer...');
  console.log(`Indexing ${SUPPORTED_CHAINS.length} chains`);

  const clients = await createClients();

  for (const [chainId, client] of Object.entries(clients)) {
    console.log(`Starting indexer for chain ${chainId}`);
    // In production: run processEvents in parallel per chain
  }

  console.log('Indexer ready');
}

main().catch(console.error);
