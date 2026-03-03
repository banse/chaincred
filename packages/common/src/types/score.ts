export interface CategoryScore {
  raw: number;
  weighted: number;
}

export interface ScoreBreakdown {
  builder: CategoryScore;
  governance: CategoryScore;
  temporal: CategoryScore;
  protocolDiversity: CategoryScore;
  complexity: CategoryScore;
}

export interface WalletScore {
  address: string;
  totalScore: number;
  breakdown: ScoreBreakdown;
  sybilMultiplier: number;
  rawScore: number;
  timestamp: number;
}

export type ScoreCategory = keyof ScoreBreakdown;
