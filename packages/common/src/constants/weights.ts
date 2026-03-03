import type { ScoreCategory } from '../types/score.js';

/** PRD 4.1 — Category weights for expertise score */
export const CATEGORY_WEIGHTS: Record<ScoreCategory, number> = {
  builder: 0.3,
  governance: 0.25,
  temporal: 0.2,
  protocolDiversity: 0.15,
  complexity: 0.1,
} as const;

/** Maximum raw score per category before weighting */
export const MAX_CATEGORY_SCORE = 1000;

/** Maximum total expertise score */
export const MAX_TOTAL_SCORE = 1000;
