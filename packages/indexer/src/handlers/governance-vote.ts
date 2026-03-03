import type { ProcessedEvent } from '../processor.js';

export type GovernanceSubtype = 'vote' | 'propose' | 'delegate' | 'queue-execute';

// Known governance contract method signatures (4-byte selectors)
const VOTE_SELECTORS = [
  '0x56781388', // castVote(uint256,uint8)
  '0x7b3c71d3', // castVoteWithReason(uint256,uint8,string)
  '0x5f398a14', // castVoteWithReasonAndParams(uint256,uint8,string,bytes)
  '0x3bccf4fd', // castVoteBySig(uint256,uint8,uint8,bytes32,bytes32)
  '0x15373e3d', // castVoteWithReasonAndParamsBySig(...)
];

const PROPOSE_SELECTORS = [
  '0x7d5e81e2', // propose(address[],uint256[],bytes[],string)
  '0xda95691a', // propose(address[],uint256[],string[],bytes[],string) (GovernorBravo)
];

const DELEGATE_SELECTORS = [
  '0x5c19a95c', // delegate(address)
  '0xc3cda520', // delegateBySig(address,uint256,uint256,uint8,bytes32,bytes32)
];

const QUEUE_EXECUTE_SELECTORS = [
  '0xddf0b009', // queue(uint256)
  '0xfe0d94c1', // execute(uint256)
];

const ALL_GOVERNANCE_SELECTORS = [
  ...VOTE_SELECTORS,
  ...PROPOSE_SELECTORS,
  ...DELEGATE_SELECTORS,
  ...QUEUE_EXECUTE_SELECTORS,
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
    governanceSubtype: getGovernanceSubtype(tx.input || ''),
    txStatus: 1,
    calldataBytes: 0,
    gasPriceGwei: '0',
  };
}

export function isGovernanceVote(input: string): boolean {
  if (!input || input.length < 10) return false;
  const selector = input.slice(0, 10).toLowerCase();
  return ALL_GOVERNANCE_SELECTORS.includes(selector);
}

export function getGovernanceSubtype(input: string): GovernanceSubtype | undefined {
  if (!input || input.length < 10) return undefined;
  const selector = input.slice(0, 10).toLowerCase();
  if (VOTE_SELECTORS.includes(selector)) return 'vote';
  if (PROPOSE_SELECTORS.includes(selector)) return 'propose';
  if (DELEGATE_SELECTORS.includes(selector)) return 'delegate';
  if (QUEUE_EXECUTE_SELECTORS.includes(selector)) return 'queue-execute';
  return undefined;
}
