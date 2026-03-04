export type SybilFlag =
  | 'temporal-clustering'
  | 'action-repetition'
  | 'funding-graph-clustering'
  | 'cross-chain-mirroring'
  | 'cex-withdrawal-freshness'
  | 'zero-failure-rate'
  | 'perfect-gas-patterns'
  | 'mev-bot-activity'
  | 'funding-source-cluster'
  | 'cex-fresh-wallet';

export interface SybilPenalty {
  flag: SybilFlag;
  label: string;
  penalty: number;
  detected: boolean;
  details?: string;
}

export interface SybilResult {
  address: string;
  confidence: number;
  flags: SybilPenalty[];
}
