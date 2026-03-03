import type { HypersyncClient } from './client.js';
import { handleContractDeployment } from './handlers/contract-deployment.js';
import { handleGenericTransaction } from './handlers/generic.js';
import { getGovernanceSubtype, type GovernanceSubtype } from './handlers/governance-vote.js';
import { getProtocolName, lookupProtocol } from './registry/protocol-registry.js';
import { DAO_REGISTRY } from '@chaincred/common';

export interface ProcessedEvent {
  chainId: number;
  blockNumber: number;
  txHash: string;
  from: string;
  to: string | null;
  type: 'deployment' | 'governance' | 'transfer' | 'generic';
  protocol?: string;
  protocolCategory?: string;
  dao?: string;
  governanceSubtype?: GovernanceSubtype;
  txStatus: number;
  calldataBytes: number;
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
      transaction: ['Hash', 'From', 'To', 'Input', 'Value', 'BlockNumber', 'Status'],
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

    let event: ProcessedEvent;

    if (!tx.to) {
      event = handleContractDeployment(client.chainId, enriched);
    } else {
      event = handleGenericTransaction(client.chainId, enriched);
      const protocolDef = lookupProtocol(tx.to);
      if (protocolDef) {
        event.protocol = protocolDef.name;
        event.protocolCategory = protocolDef.category;
      }
      if (event.type === 'governance') {
        event.dao = DAO_REGISTRY.get(tx.to.toLowerCase());
        event.governanceSubtype = getGovernanceSubtype(tx.input || '');
      }
    }

    // Enrich all events with status and calldata
    event.txStatus = (tx as any).status ?? 1;
    const input = tx.input || '0x';
    event.calldataBytes = input.length > 2 ? Math.floor((input.length - 2) / 2) : 0;

    events.push(event);
  }

  return { events, nextBlock: result.nextBlock };
}
