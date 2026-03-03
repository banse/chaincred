import type { HypersyncClient } from './client.js';
import { handleContractDeployment } from './handlers/contract-deployment.js';
import { handleGovernanceVote } from './handlers/governance-vote.js';
import { handleTokenTransfer } from './handlers/token-transfer.js';
import { handleGenericTransaction } from './handlers/generic.js';

export interface ProcessedEvent {
  chainId: number;
  blockNumber: number;
  txHash: string;
  from: string;
  to: string | null;
  type: 'deployment' | 'governance' | 'transfer' | 'generic';
  protocol?: string;
  timestamp: number;
}

export async function processEvents(
  client: HypersyncClient,
  fromBlock: number,
): Promise<ProcessedEvent[]> {
  const result = await client.query({
    fromBlock,
    transactions: [{}],
    fieldSelection: {
      transaction: ['hash', 'from', 'to', 'input', 'value', 'block_number'],
      block: ['timestamp'],
    },
  });

  const events: ProcessedEvent[] = [];

  // Process transactions and classify them
  for (const tx of result.data || []) {
    if (!tx.to) {
      events.push(handleContractDeployment(client.chainId, tx));
    } else {
      events.push(handleGenericTransaction(client.chainId, tx));
    }
  }

  return events;
}
