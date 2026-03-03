import type { WalletActivity, WalletScore, ScoreBreakdown, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE } from '@chaincred/common';
import { calculateBuilderScore } from './categories/builder.js';
import { calculateGovernanceScore } from './categories/governance.js';
import { calculateTemporalScore } from './categories/temporal.js';
import { calculateProtocolDiversityScore } from './categories/protocol-diversity.js';
import { calculateComplexityScore } from './categories/complexity.js';
import { detectSybil } from './sybil/detector.js';

export function calculateScore(activity: WalletActivity): WalletScore {
  const builder = calculateBuilderScore(activity);
  const governance = calculateGovernanceScore(activity);
  const temporal = calculateTemporalScore(activity);
  const protocolDiversity = calculateProtocolDiversityScore(activity);
  const complexity = calculateComplexityScore(activity);

  const breakdown: ScoreBreakdown = {
    builder,
    governance,
    temporal,
    protocolDiversity,
    complexity,
  };

  const rawScore =
    builder.weighted +
    governance.weighted +
    temporal.weighted +
    protocolDiversity.weighted +
    complexity.weighted;

  const sybilResult = detectSybil(activity);
  const sybilMultiplier = sybilResult.confidence;

  const totalScore = Math.round(rawScore * sybilMultiplier);

  return {
    address: activity.address,
    totalScore,
    breakdown,
    sybilMultiplier,
    rawScore,
    timestamp: Math.floor(Date.now() / 1000),
  };
}
