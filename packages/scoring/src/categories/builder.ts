import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE } from '@chaincred/common';

export function calculateBuilderScore(activity: WalletActivity): CategoryScore {
  const raw = Math.min(activity.contractsDeployed * 100, MAX_CATEGORY_SCORE);
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.builder,
  };
}
