/**
 * Scoring parameter history — tracks all weight and signal changes for easy rollback.
 * Each entry records the date, reason, and full parameter snapshot.
 *
 * To rollback: copy the desired version's values into weights.ts and signals.ts.
 */

export const SCORING_HISTORY = [
  {
    version: 'v1',
    date: '2024-12-01',
    reason: 'Initial scoring parameters from PRD 4.1–4.6',
    weights: {
      builder: 0.3,
      governance: 0.25,
      temporal: 0.2,
      protocolDiversity: 0.15,
      complexity: 0.1,
    },
    signals: {
      builder: {
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
      },
      governance: {
        votes: { perUnit: 20, cap: 400 },
        daoBreadth: { perUnit: 60, cap: 360 },
        proposals: { perUnit: 100, cap: 150 },
        delegation: { perUnit: 15, cap: 90 },
        treasuryExecution: { perUnit: 30, cap: 120 },
        crossChainGov: { perUnit: 25, cap: 150 },
        independentVotes: { perUnit: 20, cap: 120 },
        safeExecutions: { perUnit: 25, cap: 200 },
        reasonedVotes: { perUnit: 25, cap: 150 },
      },
      temporal: {
        walletAge: { perUnit: 50, cap: 400 },
        bearMarketTxs: { perUnit: 5, cap: 300 },
        consistency: { maxScore: 300 },
        activityEntropy: { multiplier: 200, cap: 200 },
        crossCyclePersistence: { perUnit: 75, cap: 300 },
      },
      protocolDiversity: {
        protocolCount: { perUnit: 18, cap: 350 },
        chainDiversity: { perUnit: 40, cap: 250 },
        crossDomainCoverage: { perUnit: 40, cap: 400 },
        earlyAdoption: { perUnit: 30, cap: 300 },
      },
      complexity: {
        transactionVolume: { perUnit: 1.5, cap: 300 },
        failRatio: { multiplier: 1000, cap: 300 },
        avgCalldata: { multiplier: 10, cap: 400 },
        permit: { perUnit: 10, cap: 200 },
        flashloan: { perUnit: 50, cap: 300 },
        smartWallet: { perUnit: 15, cap: 150 },
        internalTx: { multiplier: 8, cap: 200 },
      },
    },
    badgeThresholds: {
      builder: { minDeployments: 3 },
      governor: { minDaos: 5, minProposals: 1 },
      explorer: { minProtocols: 20 },
      og: { beforeTimestamp: 1577836800 },
      multichain: { minChains: 4 },
      trusted: { minSafeExecutions: 2, minDaos: 3, minDelegations: 3 },
      powerUser: { minProtocolDiversityRaw: 400, minComplexityRaw: 300 },
    },
    referenceWallet: {
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      name: 'vitalik.eth',
      totalScore: 704,
      breakdown: {
        builder: { raw: 1000, weighted: 300 },
        governance: { raw: 320, weighted: 80 },
        temporal: { raw: 1000, weighted: 200 },
        protocolDiversity: { raw: 410, weighted: 62 },
        complexity: { raw: 625, weighted: 63 },
      },
    },
  },
  {
    version: 'v2',
    date: '2026-03-06',
    reason:
      'Rebalance: governance weight reduced (most governance is offchain/Snapshot), ' +
      'redistribute to temporal/diversity/complexity. Diversity signal caps boosted ' +
      'for protocol count and early adoption. Complexity internal tx cap raised. ' +
      'Target: vitalik.eth ≈ 900+ (expertise ceiling reference).',
    weights: {
      builder: 0.3,
      governance: 0.1,
      temporal: 0.25,
      protocolDiversity: 0.2,
      complexity: 0.15,
    },
    signals: {
      builder: {
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
      },
      governance: {
        votes: { perUnit: 20, cap: 400 },
        daoBreadth: { perUnit: 60, cap: 360 },
        proposals: { perUnit: 100, cap: 150 },
        delegation: { perUnit: 15, cap: 90 },
        treasuryExecution: { perUnit: 30, cap: 120 },
        crossChainGov: { perUnit: 25, cap: 150 },
        independentVotes: { perUnit: 20, cap: 120 },
        safeExecutions: { perUnit: 25, cap: 200 },
        reasonedVotes: { perUnit: 25, cap: 150 },
      },
      temporal: {
        walletAge: { perUnit: 50, cap: 400 },
        bearMarketTxs: { perUnit: 5, cap: 300 },
        consistency: { maxScore: 300 },
        activityEntropy: { multiplier: 200, cap: 200 },
        crossCyclePersistence: { perUnit: 75, cap: 300 },
      },
      protocolDiversity: {
        protocolCount: { perUnit: 25, cap: 400 },
        chainDiversity: { perUnit: 40, cap: 250 },
        crossDomainCoverage: { perUnit: 50, cap: 400 },
        earlyAdoption: { perUnit: 40, cap: 300 },
      },
      complexity: {
        transactionVolume: { perUnit: 1.5, cap: 300 },
        failRatio: { multiplier: 1000, cap: 300 },
        avgCalldata: { multiplier: 10, cap: 400 },
        permit: { perUnit: 10, cap: 200 },
        flashloan: { perUnit: 50, cap: 300 },
        smartWallet: { perUnit: 15, cap: 150 },
        internalTx: { multiplier: 10, cap: 250 },
      },
    },
    badgeThresholds: {
      builder: { minDeployments: 3 },
      governor: { minDaos: 5, minProposals: 1 },
      explorer: { minProtocols: 20 },
      og: { beforeTimestamp: 1577836800 },
      multichain: { minChains: 4 },
      trusted: { minSafeExecutions: 2, minDaos: 3, minDelegations: 3 },
      powerUser: { minProtocolDiversityRaw: 400, minComplexityRaw: 300 },
    },
    referenceWallet: {
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      name: 'vitalik.eth',
      note: 'Projected scores after rebalance',
    },
  },
] as const;
