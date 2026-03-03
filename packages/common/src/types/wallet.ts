export interface WalletActivity {
  address: string;
  firstTxTimestamp: number;
  totalTransactions: number;
  contractsDeployed: number;
  uniqueProtocols: string[];
  chainsActive: string[];
  governanceVotes: number;
  daosParticipated: string[];
}

export interface WalletProfile {
  address: string;
  ensName?: string;
  activity: WalletActivity;
  score?: import('./score.js').WalletScore;
  badges?: import('./badge.js').Badge[];
  sybil?: import('./sybil.js').SybilResult;
}
