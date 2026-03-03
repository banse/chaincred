import type { WalletActivity, SybilPenalty } from '@chaincred/common';

/** PRD 5.2 — Temporal clustering detection (penalty 0.40) */
export function checkTemporalClustering(activity: WalletActivity): SybilPenalty {
  // Placeholder: always returns not detected
  return {
    flag: 'temporal-clustering',
    label: 'Temporal Clustering',
    penalty: 0.40,
    detected: false,
    details: 'No temporal clustering detected',
  };
}

/** PRD 5.2 — Action repetition detection (penalty 0.30) */
export function checkActionRepetition(activity: WalletActivity): SybilPenalty {
  // Placeholder: always returns not detected
  return {
    flag: 'action-repetition',
    label: 'Action Repetition',
    penalty: 0.30,
    detected: false,
    details: 'No action repetition detected',
  };
}

/** PRD 5.2 — Zero failure rate detection (penalty 0.20) */
export function checkZeroFailureRate(activity: WalletActivity): SybilPenalty {
  // Placeholder: always returns not detected
  return {
    flag: 'zero-failure-rate',
    label: 'Zero Failure Rate',
    penalty: 0.20,
    detected: false,
    details: 'No zero failure rate anomaly detected',
  };
}
