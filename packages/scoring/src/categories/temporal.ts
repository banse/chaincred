import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE, isInBearMarket } from '@chaincred/common';

export function calculateTemporalScore(activity: WalletActivity): CategoryScore {
  const walletAgeYears = (Date.now() / 1000 - activity.firstTxTimestamp) / (365 * 86400);
  const raw = Math.min(walletAgeYears * 200, MAX_CATEGORY_SCORE);
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.temporal,
  };
}
