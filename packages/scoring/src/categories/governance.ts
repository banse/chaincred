import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE } from '@chaincred/common';

/** PRD 4.3 — Governance score: votes, DAO breadth, proposals, delegation */
export function calculateGovernanceScore(activity: WalletActivity): CategoryScore {
  // Votes: 40 pts each, capped at 400
  const voteScore = Math.min(activity.governanceVotes * 40, 400);

  // DAO breadth: 120 pts per DAO, capped at 360
  const daoScore = Math.min(activity.daosParticipated.length * 120, 360);

  // Proposals authored: 150 pts each, capped at 150 (rare + very high signal)
  const proposalScore = Math.min(activity.proposalsCreated * 150, 150);

  // Delegation events: 30 pts each, capped at 90
  const delegateScore = Math.min(activity.delegationEvents * 30, 90);

  // Treasury execution events (queue/execute): 60 pts each, capped at 120
  const executionScore = Math.min(activity.executionEvents * 60, 120);

  // Cross-chain governance: 50 pts per chain, capped at 150
  const crossChainGovScore = Math.min(activity.governanceChains.length * 50, 150);

  // Independent voting (against/abstain votes): 40 pts each, capped at 120
  const independentVoteScore = Math.min(activity.independentVotes * 40, 120);

  const raw = Math.min(
    voteScore + daoScore + proposalScore + delegateScore + executionScore + crossChainGovScore + independentVoteScore,
    MAX_CATEGORY_SCORE,
  );
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.governance,
  };
}
