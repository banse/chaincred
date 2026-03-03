import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE } from '@chaincred/common';

export function calculateGovernanceScore(activity: WalletActivity): CategoryScore {
  const raw = Math.min(
    activity.governanceVotes * 50 + activity.daosParticipated.length * 150,
    MAX_CATEGORY_SCORE,
  );
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.governance,
  };
}
