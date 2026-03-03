import type { WalletActivity, SybilPenalty } from '@chaincred/common';

/**
 * PRD 5.2 — Temporal clustering detection (penalty 0.40)
 *
 * Sybil wallets often have a very compressed activity window — high transaction
 * count relative to wallet age. A real user with 500 txs over 3 years is normal;
 * a wallet with 500 txs in 2 weeks is suspicious.
 *
 * Heuristic: if avg transactions per day > 20 AND wallet age < 90 days, flag it.
 */
export function checkTemporalClustering(activity: WalletActivity): SybilPenalty {
  const now = Date.now() / 1000;
  const walletAgeDays = Math.max((now - activity.firstTxTimestamp) / 86400, 1);
  const txPerDay = activity.totalTransactions / walletAgeDays;

  const detected = txPerDay > 20 && walletAgeDays < 90;

  return {
    flag: 'temporal-clustering',
    label: 'Temporal Clustering',
    penalty: 0.40,
    detected,
    details: detected
      ? `${txPerDay.toFixed(1)} tx/day over ${Math.round(walletAgeDays)} days`
      : 'No temporal clustering detected',
  };
}

/**
 * PRD 5.2 — Action repetition detection (penalty 0.30)
 *
 * Sybil wallets tend to interact with very few protocols despite high tx counts —
 * they repeat the same actions (e.g., swap on one DEX hundreds of times).
 *
 * Heuristic: if totalTransactions > 100 AND uniqueProtocols < 3 AND chainsActive < 2,
 * the wallet is likely farming a single protocol.
 */
export function checkActionRepetition(activity: WalletActivity): SybilPenalty {
  const highTxCount = activity.totalTransactions > 100;
  const lowDiversity = activity.uniqueProtocols.length < 3;
  const singleChain = activity.chainsActive.length < 2;

  const detected = highTxCount && lowDiversity && singleChain;

  return {
    flag: 'action-repetition',
    label: 'Action Repetition',
    penalty: 0.30,
    detected,
    details: detected
      ? `${activity.totalTransactions} txs across only ${activity.uniqueProtocols.length} protocols on ${activity.chainsActive.length} chain(s)`
      : 'No action repetition detected',
  };
}

/**
 * PRD 5.2 — Zero failure rate detection (penalty 0.20)
 *
 * Real wallets inevitably have some failed transactions (reverts, out-of-gas, etc.).
 * A wallet with a very high transaction count and zero failures suggests bot behavior
 * with perfect gas estimation and pre-simulation.
 *
 * Since we don't track failure counts directly, we approximate:
 * - Very high tx count (>200) with no contract deployments and no governance votes
 *   on a single chain suggests automated behavior.
 * - Real power users who transact heavily tend to deploy contracts or participate
 *   in governance.
 */
export function checkZeroFailureRate(activity: WalletActivity): SybilPenalty {
  const highVolume = activity.totalTransactions > 200;
  const noBuilderActivity = activity.contractsDeployed === 0;
  const noGovernance = activity.governanceVotes === 0;
  const singleChain = activity.chainsActive.length <= 1;

  const detected = highVolume && noBuilderActivity && noGovernance && singleChain;

  return {
    flag: 'zero-failure-rate',
    label: 'Zero Failure Rate',
    penalty: 0.20,
    detected,
    details: detected
      ? `${activity.totalTransactions} txs with no deployments, no governance, single chain`
      : 'No zero failure rate anomaly detected',
  };
}
