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
 * PRD 5.2 — Funding graph clustering detection (penalty 0.50)
 *
 * Sybil clusters are typically funded by a single source wallet that distributes
 * to 10+ wallets with similar behavior. This proxy detects cluster coordinators —
 * wallets that send to many unique recipients with low protocol diversity.
 *
 * Heuristic: if uniqueRecipients > 10 AND uniqueProtocols < 3, flag it.
 */
export function checkFundingGraph(activity: WalletActivity): SybilPenalty {
  const manyRecipients = activity.uniqueRecipients > 10;
  const lowDiversity = activity.uniqueProtocols.length < 3;

  const detected = manyRecipients && lowDiversity;

  return {
    flag: 'funding-graph-clustering',
    label: 'Funding Graph Clustering',
    penalty: 0.50,
    detected,
    details: detected
      ? `Sent to ${activity.uniqueRecipients} unique addresses with only ${activity.uniqueProtocols.length} protocols`
      : 'No funding graph clustering detected',
  };
}

/**
 * PRD 5.2 — Cross-chain mirroring detection (penalty 0.60)
 *
 * Automated sybil farms often execute identical protocol interactions across
 * multiple chains simultaneously. If 3+ chains show the same protocol set,
 * the wallet is likely mirroring behavior programmatically.
 *
 * Heuristic: group chainProtocolPairs by chain, find the largest set of chains
 * that share an identical protocol set. If 3+ chains match, flag it.
 */
export function checkCrossChainMirror(activity: WalletActivity): SybilPenalty {
  if (activity.chainProtocolPairs.length === 0 || activity.chainsActive.length < 3) {
    return {
      flag: 'cross-chain-mirroring',
      label: 'Cross-Chain Mirroring',
      penalty: 0.60,
      detected: false,
      details: 'No cross-chain mirroring detected',
    };
  }

  // Group protocols by chain: { "ethereum": ["uniswap", "aave"], "arbitrum": ["uniswap", "aave"] }
  const chainProtocols = new Map<string, string[]>();
  for (const pair of activity.chainProtocolPairs) {
    const colonIdx = pair.indexOf(':');
    if (colonIdx === -1) continue;
    const chain = pair.slice(0, colonIdx);
    const protocol = pair.slice(colonIdx + 1);
    const list = chainProtocols.get(chain) ?? [];
    list.push(protocol);
    chainProtocols.set(chain, list);
  }

  // Create sorted set signature per chain
  const setSignatures = new Map<string, number>();
  for (const [, protocols] of chainProtocols) {
    const sig = [...protocols].sort().join(',');
    setSignatures.set(sig, (setSignatures.get(sig) ?? 0) + 1);
  }

  // Find max chains with identical protocol sets
  let maxMirror = 0;
  for (const count of setSignatures.values()) {
    if (count > maxMirror) maxMirror = count;
  }

  const detected = maxMirror >= 3;

  return {
    flag: 'cross-chain-mirroring',
    label: 'Cross-Chain Mirroring',
    penalty: 0.60,
    detected,
    details: detected
      ? `${maxMirror} chains with identical protocol sets`
      : 'No cross-chain mirroring detected',
  };
}

/**
 * PRD 5.2 — CEX withdrawal freshness (graduated penalty up to 0.30)
 *
 * New wallets funded from centralized exchanges are suspicious — they may be
 * fresh sybil accounts. The penalty graduates linearly from 30% (brand new)
 * to 0% (30+ days old).
 *
 * Heuristic: if wallet age < 30 days, penalty = 0.30 * (1 - ageDays/30).
 */
export function checkCexFreshness(activity: WalletActivity): SybilPenalty {
  const now = Date.now() / 1000;
  const ageDays = Math.max((now - activity.firstTxTimestamp) / 86400, 0);

  if (ageDays >= 30) {
    return {
      flag: 'cex-withdrawal-freshness',
      label: 'CEX Withdrawal Freshness',
      penalty: 0,
      detected: false,
      details: 'Wallet age exceeds 30 days',
    };
  }

  const penalty = 0.30 * (1 - ageDays / 30);

  return {
    flag: 'cex-withdrawal-freshness',
    label: 'CEX Withdrawal Freshness',
    penalty: Math.round(penalty * 100) / 100, // Round to 2 decimal places
    detected: true,
    details: `Wallet is ${Math.round(ageDays)} days old (penalty: ${(penalty * 100).toFixed(0)}%)`,
  };
}

/**
 * PRD 5.2 — Zero failure rate detection (penalty 0.20)
 *
 * Real wallets inevitably have some failed transactions (reverts, out-of-gas, etc.).
 * A wallet with a very high transaction count and zero failures suggests bot behavior
 * with perfect gas estimation and pre-simulation.
 *
 * Heuristic: if totalTransactions > 200 AND failedTransactions === 0, flag it.
 */
export function checkZeroFailureRate(activity: WalletActivity): SybilPenalty {
  const highVolume = activity.totalTransactions > 200;
  const zeroFailures = activity.failedTransactions === 0;

  const detected = highVolume && zeroFailures;

  return {
    flag: 'zero-failure-rate',
    label: 'Zero Failure Rate',
    penalty: 0.20,
    detected,
    details: detected
      ? `${activity.totalTransactions} txs with zero failures`
      : 'No zero failure rate anomaly detected',
  };
}

/**
 * PRD 5.2 — Perfect gas price patterns detection (penalty 0.15)
 *
 * Bots typically use the same gas price or a very small set of gas prices
 * for all transactions. Real users encounter varying network conditions
 * resulting in diverse gas prices. A ratio of distinct gas prices to total
 * transactions below 5% with 50+ txs suggests automation.
 *
 * Heuristic: if totalTransactions > 50 AND distinctGasPrices / totalTransactions < 0.05, flag it.
 */
export function checkGasPatterns(activity: WalletActivity): SybilPenalty {
  if (activity.totalTransactions < 50 || activity.distinctGasPrices === 0) {
    return {
      flag: 'perfect-gas-patterns',
      label: 'Perfect Gas Patterns',
      penalty: 0.15,
      detected: false,
      details: 'Insufficient data for gas pattern analysis',
    };
  }

  const ratio = activity.distinctGasPrices / activity.totalTransactions;
  const detected = ratio < 0.05;

  return {
    flag: 'perfect-gas-patterns',
    label: 'Perfect Gas Patterns',
    penalty: 0.15,
    detected,
    details: detected
      ? `Only ${activity.distinctGasPrices} distinct gas prices across ${activity.totalTransactions} txs (${(ratio * 100).toFixed(1)}%)`
      : 'Gas price diversity is normal',
  };
}
