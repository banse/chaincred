import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE } from '@chaincred/common';

/** PRD 4.4 — Temporal score: wallet age, bear market activity, consistency */
export function calculateTemporalScore(activity: WalletActivity): CategoryScore {
  const now = Date.now() / 1000;
  const walletAgeYears = Math.max((now - activity.firstTxTimestamp) / (365 * 86400), 0);

  // Wallet age: 100 pts per year, capped at 400 (4 years)
  const ageScore = Math.min(walletAgeYears * 100, 400);

  // Bear market activity: 10 pts per bear-market tx, capped at 300
  const bearScore = Math.min(activity.bearMarketTxs * 10, 300);

  // Consistency: ratio of active months to wallet age in months
  const walletAgeMonths = Math.max(walletAgeYears * 12, 1);
  const consistencyRatio = Math.min(activity.activeMonths / walletAgeMonths, 1);
  const consistencyScore = consistencyRatio * 300;

  // Activity entropy: distinct hours-of-day — humans use 8–15+, bots 2–3
  const entropyScore = Math.min((activity.distinctTxHours / 24) * 200, 200);

  const raw = Math.min(Math.round(ageScore + bearScore + consistencyScore + entropyScore), MAX_CATEGORY_SCORE);
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.temporal,
  };
}
