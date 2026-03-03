import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE } from '@chaincred/common';

export function calculateComplexityScore(activity: WalletActivity): CategoryScore {
  const raw = Math.min(activity.totalTransactions * 5, MAX_CATEGORY_SCORE);
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.complexity,
  };
}
