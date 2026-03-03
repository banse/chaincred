import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE } from '@chaincred/common';

/** PRD 4.6 — Complexity score: tx volume, failure ratio, calldata size */
export function calculateComplexityScore(activity: WalletActivity): CategoryScore {
  // Transaction volume: 3 pts each, capped at 300
  const volumeScore = Math.min(activity.totalTransactions * 3, 300);

  // Failed transaction ratio: failures = pushing limits (PRD 4.6)
  let failRatioScore = 0;
  if (activity.totalTransactions > 0) {
    const failRatio = activity.failedTransactions / activity.totalTransactions;
    failRatioScore = Math.min(Math.round(failRatio * 2000), 300);
  }

  // Average calldata size: complex interactions have larger calldata
  // Simple ETH transfer = 0 bytes, DeFi swap = 200-2000 bytes
  let avgCalldataScore = 0;
  if (activity.totalTransactions > 0) {
    const avgBytes = activity.totalCalldataBytes / activity.totalTransactions;
    avgCalldataScore = Math.min(Math.round(Math.sqrt(avgBytes) * 20), 400);
  }

  // EIP-712 permit/Permit2 interactions: 20 pts each, capped at 200
  const permitScore = Math.min(activity.permitInteractions * 20, 200);

  // Flashloan transactions: 100 pts each, capped at 300
  const flashloanScore = Math.min(activity.flashloanTransactions * 100, 300);

  // Smart contract wallet interactions (ERC-4337 EntryPoint): 30 pts each, capped at 150
  const smartWalletScore = Math.min(activity.smartWalletInteractions * 30, 150);

  // Internal transaction count: sqrt(count) * 15, capped at 200
  const internalTxScore = Math.min(Math.round(Math.sqrt(activity.internalTransactions) * 15), 200);

  const raw = Math.min(
    volumeScore + failRatioScore + avgCalldataScore + permitScore + flashloanScore + smartWalletScore + internalTxScore,
    MAX_CATEGORY_SCORE,
  );
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.complexity,
  };
}
