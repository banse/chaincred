import type { ProcessedEvent } from '../processor.js';

export function handleTokenTransfer(chainId: number, tx: any): ProcessedEvent {
  return {
    chainId,
    blockNumber: tx.block_number || 0,
    txHash: tx.hash || '',
    from: tx.from || '',
    to: tx.to || '',
    type: 'transfer',
    timestamp: tx.timestamp || 0,
  };
}
