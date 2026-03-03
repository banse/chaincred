import type { WalletActivity, SybilResult, SybilPenalty } from '@chaincred/common';
import {
  checkTemporalClustering,
  checkActionRepetition,
  checkFundingGraph,
  checkCrossChainMirror,
  checkCexFreshness,
  checkZeroFailureRate,
  checkGasPatterns,
} from './heuristics.js';

export function detectSybil(activity: WalletActivity): SybilResult {
  const penalties: SybilPenalty[] = [
    checkTemporalClustering(activity),
    checkActionRepetition(activity),
    checkFundingGraph(activity),
    checkCrossChainMirror(activity),
    checkCexFreshness(activity),
    checkZeroFailureRate(activity),
    checkGasPatterns(activity),
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
