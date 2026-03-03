import type { ProcessedEvent } from '../processor.js';

// Known governance contract method signatures (4-byte selectors)
const VOTE_SIGNATURES = [
  // Voting
  '0x56781388', // castVote(uint256,uint8)
  '0x7b3c71d3', // castVoteWithReason(uint256,uint8,string)
  '0x5f398a14', // castVoteWithReasonAndParams(uint256,uint8,string,bytes)
  '0x3bccf4fd', // castVoteBySig(uint256,uint8,uint8,bytes32,bytes32)
  // Proposals
  '0x7d5e81e2', // propose(address[],uint256[],bytes[],string)
  '0xda95691a', // propose(address[],uint256[],string[],bytes[],string) (GovernorBravo)
  // Delegation
  '0x5c19a95c', // delegate(address)
  '0xc3cda520', // delegateBySig(address,uint256,uint256,uint8,bytes32,bytes32)
  // Snapshot-style (on-chain)
  '0x15373e3d', // castVoteWithReasonAndParamsBySig(...)
  // Queue / Execute (governance lifecycle)
  '0xddf0b009', // queue(uint256)
  '0xfe0d94c1', // execute(uint256)
];

export function handleGovernanceVote(chainId: number, tx: any): ProcessedEvent {
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

export function isGovernanceVote(input: string): boolean {
  if (!input || input.length < 10) return false;
  const selector = input.slice(0, 10).toLowerCase();
  return VOTE_SIGNATURES.includes(selector);
}
