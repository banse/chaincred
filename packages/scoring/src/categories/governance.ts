import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE } from '@chaincred/common';

/** PRD 4.3 — Governance score: votes, DAO breadth, proposals, delegation */
export function calculateGovernanceScore(activity: WalletActivity): CategoryScore {
  // Votes: 20 pts each, capped at 400
  const voteScore = Math.min(activity.governanceVotes * 20, 400);

  // DAO breadth: 60 pts per DAO, capped at 360
  const daoScore = Math.min(activity.daosParticipated.length * 60, 360);

  // Proposals authored: 100 pts each, capped at 150 (rare + very high signal)
  const proposalScore = Math.min(activity.proposalsCreated * 100, 150);

  // Delegation events: 15 pts each, capped at 90
  const delegateScore = Math.min(activity.delegationEvents * 15, 90);

  // Treasury execution events (queue/execute): 30 pts each, capped at 120
  const executionScore = Math.min(activity.executionEvents * 30, 120);

  // Cross-chain governance: 25 pts per chain, capped at 150
  const crossChainGovScore = Math.min(activity.governanceChains.length * 25, 150);

  // Independent voting (against/abstain votes): 20 pts each, capped at 120
  const independentVoteScore = Math.min(activity.independentVotes * 20, 120);

  // Safe multi-sig execTransaction calls: 25 pts each, capped at 200
  const safeScore = Math.min(activity.safeExecutions * 25, 200);

  // Reasoned votes (castVoteWithReason): 25 pts each, capped at 150
  const reasonedScore = Math.min(activity.reasonedVotes * 25, 150);

  const raw = Math.min(
    voteScore + daoScore + proposalScore + delegateScore + executionScore + crossChainGovScore + independentVoteScore + safeScore + reasonedScore,
    MAX_CATEGORY_SCORE,
  );
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.governance,
  };
}
