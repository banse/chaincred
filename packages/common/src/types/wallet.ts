export interface WalletActivity {
  address: string;
  firstTxTimestamp: number;
  totalTransactions: number;
  contractsDeployed: number;
  /** PRD 4.2 — Chains on which this wallet deployed contracts */
  deploymentChains: string[];
  /** PRD 4.2 — Total calldata bytes of deployment transactions (constructor size) */
  deploymentCalldataBytes: number;
  uniqueProtocols: string[];
  chainsActive: string[];
  governanceVotes: number;
  daosParticipated: string[];
  /** PRD 4.3 — Governance proposals authored (propose() calls) */
  proposalsCreated: number;
  /** PRD 4.3 — Delegation events (delegate/delegateBySig calls) */
  delegationEvents: number;
  /** PRD 4.4 — Transactions during bear market windows */
  bearMarketTxs: number;
  /** PRD 4.4 — Distinct calendar months with activity */
  activeMonths: number;
  /** PRD 4.5 — Distinct protocol categories (defi, social, governance, etc.) */
  protocolCategories: string[];
  /** PRD 4.6 — Reverted transactions (tx.status == 0) */
  failedTransactions: number;
  /** PRD 4.6 — Total calldata bytes across all transactions */
  totalCalldataBytes: number;
  /** PRD 5.2 — Distinct addresses this wallet sent value to */
  uniqueRecipients: number;
  /** PRD 5.2 — Chain:protocol pairs for cross-chain mirroring detection */
  chainProtocolPairs: string[];
  /** PRD 5.2 — Distinct gas prices used (rounded to gwei) */
  distinctGasPrices: number;
}

export interface WalletProfile {
  address: string;
  ensName?: string;
  activity: WalletActivity;
  score?: import('./score.js').WalletScore;
  badges?: import('./badge.js').Badge[];
  sybil?: import('./sybil.js').SybilResult;
}
