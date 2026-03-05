import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE } from '@chaincred/common';

/** PRD 4.6 — Complexity score: tx volume, failure ratio, calldata size */
export function calculateComplexityScore(activity: WalletActivity): CategoryScore {
  // Transaction volume: 1.5 pts each, capped at 300
  const volumeScore = Math.min(activity.totalTransactions * 1.5, 300);

  // Failed transaction ratio: failures = pushing limits (PRD 4.6)
  let failRatioScore = 0;
  if (activity.totalTransactions > 0) {
    const failRatio = activity.failedTransactions / activity.totalTransactions;
    failRatioScore = Math.min(Math.round(failRatio * 1000), 300);
  }

  // Average calldata size: complex interactions have larger calldata
  // Simple ETH transfer = 0 bytes, DeFi swap = 200-2000 bytes
  let avgCalldataScore = 0;
  if (activity.totalTransactions > 0) {
    const avgBytes = activity.totalCalldataBytes / activity.totalTransactions;
    avgCalldataScore = Math.min(Math.round(Math.sqrt(avgBytes) * 10), 400);
  }

  // EIP-712 permit/Permit2 interactions: 10 pts each, capped at 200
  const permitScore = Math.min(activity.permitInteractions * 10, 200);

  // Flashloan transactions: 50 pts each, capped at 300
  const flashloanScore = Math.min(activity.flashloanTransactions * 50, 300);

  // Smart contract wallet interactions (ERC-4337 EntryPoint): 15 pts each, capped at 150
  const smartWalletScore = Math.min(activity.smartWalletInteractions * 15, 150);

  // Internal transaction count: sqrt(count) * 8, capped at 200
  const internalTxScore = Math.min(Math.round(Math.sqrt(activity.internalTransactions) * 8), 200);

  const raw = Math.min(
    volumeScore + failRatioScore + avgCalldataScore + permitScore + flashloanScore + smartWalletScore + internalTxScore,
    MAX_CATEGORY_SCORE,
  );
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.complexity,
  };
}
