/** PRD 4.2–4.6 — Externalized signal thresholds for all 5 category calculators */

export const BUILDER_SIGNALS = {
  deployments: { perUnit: 40, cap: 280 },
  multiChainDeploys: { perUnit: 50, cap: 200 },
  constructorComplexity: { multiplier: 10, cap: 100 },
  deploymentFocus: { multiplier: 400, cap: 80 },
  create2: { perUnit: 30, cap: 120 },
  erc4337: { perUnit: 25, cap: 100 },
  longevity: { perUnit: 30, cap: 90 },
  verifiedSource: { perUnit: 50, cap: 200 },
  externalUsers: { perUnit: 15, cap: 150 },
  activeContracts: { perUnit: 40, cap: 200 },
} as const;

export const GOVERNANCE_SIGNALS = {
  votes: { perUnit: 20, cap: 400 },
  daoBreadth: { perUnit: 60, cap: 360 },
  proposals: { perUnit: 100, cap: 150 },
  delegation: { perUnit: 15, cap: 90 },
  treasuryExecution: { perUnit: 30, cap: 120 },
  crossChainGov: { perUnit: 25, cap: 150 },
  independentVotes: { perUnit: 20, cap: 120 },
  safeExecutions: { perUnit: 25, cap: 200 },
  reasonedVotes: { perUnit: 25, cap: 150 },
} as const;

export const TEMPORAL_SIGNALS = {
  walletAge: { perUnit: 50, cap: 400 },
  bearMarketTxs: { perUnit: 5, cap: 300 },
  consistency: { maxScore: 300 },
  activityEntropy: { multiplier: 200, cap: 200 },
  crossCyclePersistence: { perUnit: 75, cap: 300 },
} as const;

export const PROTOCOL_DIVERSITY_SIGNALS = {
  protocolCount: { perUnit: 18, cap: 350 },
  chainDiversity: { perUnit: 40, cap: 250 },
  crossDomainCoverage: { perUnit: 40, cap: 400 },
  earlyAdoption: { perUnit: 30, cap: 300 },
} as const;

export const COMPLEXITY_SIGNALS = {
  transactionVolume: { perUnit: 1.5, cap: 300 },
  failRatio: { multiplier: 1000, cap: 300 },
  avgCalldata: { multiplier: 10, cap: 400 },
  permit: { perUnit: 10, cap: 200 },
  flashloan: { perUnit: 50, cap: 300 },
  smartWallet: { perUnit: 15, cap: 150 },
  internalTx: { multiplier: 8, cap: 200 },
} as const;

export const BADGE_THRESHOLDS = {
  builder: { minDeployments: 3 },
  governor: { minDaos: 5, minProposals: 1 },
  explorer: { minProtocols: 20 },
  og: { beforeTimestamp: 1577836800 },
  multichain: { minChains: 4 },
  trusted: { minSafeExecutions: 2, minDaos: 3, minDelegations: 3 },
  powerUser: { minProtocolDiversityRaw: 400, minComplexityRaw: 300 },
} as const;
