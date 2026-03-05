import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE, COMPLEXITY_SIGNALS } from '@chaincred/common';

const S = COMPLEXITY_SIGNALS;

/** PRD 4.6 — Complexity score: tx volume, failure ratio, calldata size */
export function calculateComplexityScore(activity: WalletActivity): CategoryScore {
  // Transaction volume
  const volumeScore = Math.min(activity.totalTransactions * S.transactionVolume.perUnit, S.transactionVolume.cap);

  // Failed transaction ratio: failures = pushing limits (PRD 4.6)
  let failRatioScore = 0;
  if (activity.totalTransactions > 0) {
    const failRatio = activity.failedTransactions / activity.totalTransactions;
    failRatioScore = Math.min(Math.round(failRatio * S.failRatio.multiplier), S.failRatio.cap);
  }

  // Average calldata size: complex interactions have larger calldata
  let avgCalldataScore = 0;
  if (activity.totalTransactions > 0) {
    const avgBytes = activity.totalCalldataBytes / activity.totalTransactions;
    avgCalldataScore = Math.min(Math.round(Math.sqrt(avgBytes) * S.avgCalldata.multiplier), S.avgCalldata.cap);
  }

  // EIP-712 permit/Permit2 interactions
  const permitScore = Math.min(activity.permitInteractions * S.permit.perUnit, S.permit.cap);

  // Flashloan transactions
  const flashloanScore = Math.min(activity.flashloanTransactions * S.flashloan.perUnit, S.flashloan.cap);

  // Smart contract wallet interactions (ERC-4337 EntryPoint)
  const smartWalletScore = Math.min(activity.smartWalletInteractions * S.smartWallet.perUnit, S.smartWallet.cap);

  // Internal transaction count: sqrt(count) * multiplier
  const internalTxScore = Math.min(Math.round(Math.sqrt(activity.internalTransactions) * S.internalTx.multiplier), S.internalTx.cap);

  const raw = Math.min(
    volumeScore + failRatioScore + avgCalldataScore + permitScore + flashloanScore + smartWalletScore + internalTxScore,
    MAX_CATEGORY_SCORE,
  );
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.complexity,
    signals: {
      transactionVolume: volumeScore,
      failRatio: failRatioScore,
      avgCalldata: avgCalldataScore,
      permit: permitScore,
      flashloan: flashloanScore,
      smartWallet: smartWalletScore,
      internalTx: internalTxScore,
    },
  };
}
