import type { ProcessedEvent } from '../processor.js';

export function handleContractDeployment(chainId: number, tx: any): ProcessedEvent {
  return {
    chainId,
    blockNumber: tx.block_number || 0,
    txHash: tx.hash || '',
    from: tx.from || '',
    to: null,
    type: 'deployment',
    timestamp: tx.timestamp || 0,
  };
}
