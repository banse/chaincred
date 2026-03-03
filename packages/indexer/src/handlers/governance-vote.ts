import type { ProcessedEvent } from '../processor.js';

// Known governance contract method signatures
const VOTE_SIGNATURES = [
  '0x56781388', // castVote(uint256,uint8)
  '0x7b3c71d3', // castVoteWithReason(uint256,uint8,string)
];

export function handleGovernanceVote(chainId: number, tx: any): ProcessedEvent {
  return {
    chainId,
    blockNumber: tx.block_number || 0,
    txHash: tx.hash || '',
    from: tx.from || '',
    to: tx.to || '',
    type: 'governance',
    timestamp: tx.timestamp || 0,
  };
}

export function isGovernanceVote(input: string): boolean {
  if (!input || input.length < 10) return false;
  const selector = input.slice(0, 10);
  return VOTE_SIGNATURES.includes(selector);
}
