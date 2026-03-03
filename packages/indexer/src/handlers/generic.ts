import type { ProcessedEvent } from '../processor.js';
import { isGovernanceVote } from './governance-vote.js';

export function handleGenericTransaction(chainId: number, tx: any): ProcessedEvent {
  const input = tx.input || '0x';

  // Check if this is a governance vote
  if (isGovernanceVote(input)) {
    return {
      chainId,
      blockNumber: tx.blockNumber || 0,
      txHash: tx.hash || '',
      from: tx.from || '',
      to: tx.to || '',
      type: 'governance',
      timestamp: tx.timestamp || 0,
    };
  }

  return {
    chainId,
    blockNumber: tx.blockNumber || 0,
    txHash: tx.hash || '',
    from: tx.from || '',
    to: tx.to || '',
    type: 'generic',
    timestamp: tx.timestamp || 0,
  };
}
