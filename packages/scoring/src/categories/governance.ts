import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE, GOVERNANCE_SIGNALS } from '@chaincred/common';

const S = GOVERNANCE_SIGNALS;

/** PRD 4.3 — Governance score: votes, DAO breadth, proposals, delegation */
export function calculateGovernanceScore(activity: WalletActivity): CategoryScore {
  // Votes
  const voteScore = Math.min(activity.governanceVotes * S.votes.perUnit, S.votes.cap);

  // DAO breadth
  const daoScore = Math.min(activity.daosParticipated.length * S.daoBreadth.perUnit, S.daoBreadth.cap);

  // Proposals authored
  const proposalScore = Math.min(activity.proposalsCreated * S.proposals.perUnit, S.proposals.cap);

  // Delegation events
  const delegateScore = Math.min(activity.delegationEvents * S.delegation.perUnit, S.delegation.cap);

  // Treasury execution events (queue/execute)
  const executionScore = Math.min(activity.executionEvents * S.treasuryExecution.perUnit, S.treasuryExecution.cap);

  // Cross-chain governance
  const crossChainGovScore = Math.min(activity.governanceChains.length * S.crossChainGov.perUnit, S.crossChainGov.cap);

  // Independent voting (against/abstain votes)
  const independentVoteScore = Math.min(activity.independentVotes * S.independentVotes.perUnit, S.independentVotes.cap);

  // Safe multi-sig execTransaction calls
  const safeScore = Math.min(activity.safeExecutions * S.safeExecutions.perUnit, S.safeExecutions.cap);

  // Reasoned votes (castVoteWithReason)
  const reasonedScore = Math.min(activity.reasonedVotes * S.reasonedVotes.perUnit, S.reasonedVotes.cap);

  const raw = Math.min(
    voteScore + daoScore + proposalScore + delegateScore + executionScore + crossChainGovScore + independentVoteScore + safeScore + reasonedScore,
    MAX_CATEGORY_SCORE,
  );
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.governance,
  };
}
