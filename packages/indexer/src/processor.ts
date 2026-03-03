import type { HypersyncClient } from './client.js';
import { handleContractDeployment } from './handlers/contract-deployment.js';
import { handleGenericTransaction } from './handlers/generic.js';
import { getProtocolName } from './registry/protocol-registry.js';
import { DAO_REGISTRY } from '@chaincred/common';

export interface ProcessedEvent {
  chainId: number;
  blockNumber: number;
  txHash: string;
  from: string;
  to: string | null;
  type: 'deployment' | 'governance' | 'transfer' | 'generic';
  protocol?: string;
  dao?: string;
  timestamp: number;
}

export async function processEvents(
  client: HypersyncClient,
  fromBlock: number,
): Promise<{ events: ProcessedEvent[]; nextBlock: number }> {
  const result = await client.query({
    fromBlock,
    includeAllBlocks: true,
    maxNumBlocks: 2000,
    transactions: [{}],
    fieldSelection: {
      transaction: ['Hash', 'From', 'To', 'Input', 'Value', 'BlockNumber'],
      block: ['Number', 'Timestamp'],
    },
  });

  // Build block number → timestamp map
  const blockTimestamps = new Map<number, number>();
  for (const block of result.data.blocks) {
    if (block.number != null && block.timestamp != null) {
      blockTimestamps.set(block.number, block.timestamp);
    }
  }

  const events: ProcessedEvent[] = [];

  for (const tx of result.data.transactions) {
    const enriched = {
      ...tx,
      timestamp: blockTimestamps.get(tx.blockNumber ?? 0) ?? 0,
    };

    if (!tx.to) {
      events.push(handleContractDeployment(client.chainId, enriched));
    } else {
      const event = handleGenericTransaction(client.chainId, enriched);
      event.protocol = getProtocolName(tx.to) ?? event.protocol;
      if (event.type === 'governance') {
        event.dao = DAO_REGISTRY.get(tx.to.toLowerCase());
      }
      events.push(event);
    }
  }

  return { events, nextBlock: result.nextBlock };
}
