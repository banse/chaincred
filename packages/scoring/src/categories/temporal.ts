import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE } from '@chaincred/common';

/** PRD 4.4 — Temporal score: wallet age, bear market activity, consistency */
export function calculateTemporalScore(activity: WalletActivity): CategoryScore {
  const now = Date.now() / 1000;
  const walletAgeYears = Math.max((now - activity.firstTxTimestamp) / (365 * 86400), 0);

  // Wallet age: 50 pts per year, capped at 400 (8 years)
  const ageScore = Math.min(walletAgeYears * 50, 400);

  // Bear market activity: 5 pts per bear-market tx, capped at 300
  const bearScore = Math.min(activity.bearMarketTxs * 5, 300);

  // Consistency: ratio of active months to wallet age in months
  const walletAgeMonths = Math.max(walletAgeYears * 12, 1);
  const consistencyRatio = Math.min(activity.activeMonths / walletAgeMonths, 1);
  const consistencyScore = consistencyRatio * 300;

  // Activity entropy: distinct hours-of-day — humans use 8–15+, bots 2–3
  const entropyScore = Math.min((activity.distinctTxHours / 24) * 200, 200);

  // Cross-cycle persistence: active in multiple bear/bull cycles = very strong long-term signal
  const crossCycleScore = Math.min(activity.bearMarketPeriodsActive * 75, 300);

  const raw = Math.min(
    Math.round(ageScore + bearScore + consistencyScore + entropyScore + crossCycleScore),
    MAX_CATEGORY_SCORE,
  );
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.temporal,
  };
}
