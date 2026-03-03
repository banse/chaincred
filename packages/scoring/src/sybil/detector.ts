import type { WalletActivity, SybilResult, SybilPenalty } from '@chaincred/common';
import {
  checkTemporalClustering,
  checkActionRepetition,
  checkZeroFailureRate,
} from './heuristics.js';

export function detectSybil(activity: WalletActivity): SybilResult {
  const penalties: SybilPenalty[] = [
    checkTemporalClustering(activity),
    checkActionRepetition(activity),
    checkZeroFailureRate(activity),
  ];

  let confidence = 1.0;
  for (const penalty of penalties) {
    if (penalty.detected) {
      confidence *= 1 - penalty.penalty;
    }
  }

  return {
    address: activity.address,
    confidence,
    flags: penalties,
  };
}
