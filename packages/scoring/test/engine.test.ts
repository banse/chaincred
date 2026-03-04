import { describe, expect, test } from 'bun:test';
import { calculateScore } from '../src/engine.js';
import { evaluateBadges } from '../src/badges/evaluator.js';
import type { WalletActivity } from '@chaincred/common';

/** Helper to build a WalletActivity with defaults for all fields */
function activity(overrides: Partial<WalletActivity> = {}): WalletActivity {
  return {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    firstTxTimestamp: 1577836800, // 2020-01-01
    totalTransactions: 500,
    contractsDeployed: 5,
    deploymentChains: ['ethereum', 'arbitrum'],
    deploymentCalldataBytes: 15000,
    uniqueProtocols: ['uniswap', 'aave', 'compound', 'maker', 'curve'],
    chainsActive: ['ethereum', 'arbitrum', 'optimism'],
    governanceVotes: 20,
    daosParticipated: ['ens', 'aave', 'compound'],
    proposalsCreated: 2,
    delegationEvents: 5,
    bearMarketTxs: 15,
    activeMonths: 36,
    protocolCategories: ['defi', 'governance', 'social'],
    failedTransactions: 25,
    totalCalldataBytes: 125000,
    uniqueRecipients: 5,
    chainProtocolPairs: [],
    distinctGasPrices: 10,
    distinctTxHours: 12,
    create2Deployments: 0,
    bearMarketPeriodsActive: 0,
    executionEvents: 0,
    governanceChains: [],
    permitInteractions: 0,
    flashloanTransactions: 0,
    smartWalletInteractions: 0,
    erc4337Operations: 0,
    earlyAdoptions: 0,
    independentVotes: 0,
    earliestDeploymentTimestamp: 0,
    safeExecutions: 0,
    verifiedDeployments: 0,
    reasonedVotes: 0,
    mevInteractions: 0,
    internalTransactions: 0,
    contractExternalUsers: 0,
    activeContracts: 0,
    fundingSource: '',
    fundingSourceOutboundCount: 0,
    fundedByCex: false,
    ...overrides,
  };
}

describe('scoring engine', () => {
  test('produces score between 0 and 1000', () => {
    const result = calculateScore(activity());
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(1000);
  });

  test('includes all category scores', () => {
    const result = calculateScore(activity());
    expect(result.breakdown.builder).toBeDefined();
    expect(result.breakdown.governance).toBeDefined();
    expect(result.breakdown.temporal).toBeDefined();
    expect(result.breakdown.protocolDiversity).toBeDefined();
    expect(result.breakdown.complexity).toBeDefined();
  });

  test('applies sybil multiplier', () => {
    const result = calculateScore(activity());
    expect(result.sybilMultiplier).toBeGreaterThan(0);
    expect(result.sybilMultiplier).toBeLessThanOrEqual(1);
  });

  test('empty activity produces low score', () => {
    const empty = activity({
      address: '0x0000000000000000000000000000000000000000',
      firstTxTimestamp: Math.floor(Date.now() / 1000),
      totalTransactions: 0,
      contractsDeployed: 0,
      deploymentChains: [],
      deploymentCalldataBytes: 0,
      uniqueProtocols: [],
      chainsActive: [],
      governanceVotes: 0,
      daosParticipated: [],
      proposalsCreated: 0,
      delegationEvents: 0,
      bearMarketTxs: 0,
      activeMonths: 0,
      protocolCategories: [],
      failedTransactions: 0,
      totalCalldataBytes: 0,
      uniqueRecipients: 0,
      chainProtocolPairs: [],
      distinctGasPrices: 0,
      distinctTxHours: 0,
      create2Deployments: 0,
      bearMarketPeriodsActive: 0,
      executionEvents: 0,
      governanceChains: [],
      permitInteractions: 0,
      flashloanTransactions: 0,
      smartWalletInteractions: 0,
      erc4337Operations: 0,
      earlyAdoptions: 0,
      independentVotes: 0,
      earliestDeploymentTimestamp: 0,
      safeExecutions: 0,
      verifiedDeployments: 0,
      reasonedVotes: 0,
      mevInteractions: 0,
      internalTransactions: 0,
    });
    const result = calculateScore(empty);
    expect(result.totalScore).toBe(0);
  });
});

describe('enriched signals', () => {
  test('proposals boost governance score', () => {
    const withProposals = calculateScore(activity({ proposalsCreated: 3 }));
    const without = calculateScore(activity({ proposalsCreated: 0 }));
    expect(withProposals.breakdown.governance.raw).toBeGreaterThan(
      without.breakdown.governance.raw,
    );
  });

  test('bear market activity boosts temporal score', () => {
    const withBear = calculateScore(activity({ bearMarketTxs: 30 }));
    const without = calculateScore(activity({ bearMarketTxs: 0 }));
    expect(withBear.breakdown.temporal.raw).toBeGreaterThan(without.breakdown.temporal.raw);
  });

  test('active months boost temporal score', () => {
    const active = calculateScore(activity({ activeMonths: 48 }));
    const inactive = calculateScore(activity({ activeMonths: 3 }));
    expect(active.breakdown.temporal.raw).toBeGreaterThan(inactive.breakdown.temporal.raw);
  });

  test('protocol category diversity boosts protocol diversity score', () => {
    const diverse = calculateScore(
      activity({ protocolCategories: ['defi', 'social', 'governance', 'infrastructure'] }),
    );
    const narrow = calculateScore(activity({ protocolCategories: ['defi'] }));
    expect(diverse.breakdown.protocolDiversity.raw).toBeGreaterThan(
      narrow.breakdown.protocolDiversity.raw,
    );
  });

  test('failed transactions contribute to complexity score', () => {
    const withFails = calculateScore(activity({ failedTransactions: 50 }));
    const without = calculateScore(activity({ failedTransactions: 0 }));
    expect(withFails.breakdown.complexity.raw).toBeGreaterThan(without.breakdown.complexity.raw);
  });

  test('larger calldata contributes to complexity score', () => {
    const complex = calculateScore(activity({ totalCalldataBytes: 500000 }));
    const simple = calculateScore(activity({ totalCalldataBytes: 0 }));
    expect(complex.breakdown.complexity.raw).toBeGreaterThan(simple.breakdown.complexity.raw);
  });

  test('distinct tx hours boost temporal score via entropy', () => {
    const diverse = calculateScore(activity({ distinctTxHours: 18 }));
    const narrow = calculateScore(activity({ distinctTxHours: 2 }));
    expect(diverse.breakdown.temporal.raw).toBeGreaterThan(narrow.breakdown.temporal.raw);
  });
});

describe('builder signals', () => {
  test('multi-chain deployments boost builder score', () => {
    const multiChain = calculateScore(
      activity({ deploymentChains: ['ethereum', 'arbitrum', 'optimism'] }),
    );
    const singleChain = calculateScore(activity({ deploymentChains: ['ethereum'] }));
    expect(multiChain.breakdown.builder.raw).toBeGreaterThan(singleChain.breakdown.builder.raw);
  });

  test('constructor complexity boosts builder score', () => {
    const complex = calculateScore(activity({ deploymentCalldataBytes: 50000 }));
    const simple = calculateScore(activity({ deploymentCalldataBytes: 100 }));
    expect(complex.breakdown.builder.raw).toBeGreaterThan(simple.breakdown.builder.raw);
  });

  test('deployment focus ratio boosts builder score', () => {
    const focused = calculateScore(
      activity({ contractsDeployed: 10, totalTransactions: 20 }),
    );
    const unfocused = calculateScore(
      activity({ contractsDeployed: 10, totalTransactions: 5000 }),
    );
    expect(focused.breakdown.builder.raw).toBeGreaterThan(unfocused.breakdown.builder.raw);
  });

  test('zero deployments produces zero builder score', () => {
    const result = calculateScore(
      activity({
        contractsDeployed: 0,
        deploymentChains: [],
        deploymentCalldataBytes: 0,
      }),
    );
    expect(result.breakdown.builder.raw).toBe(0);
  });

  test('CREATE2 deployments boost builder score', () => {
    const withCreate2 = calculateScore(activity({ create2Deployments: 3 }));
    const without = calculateScore(activity({ create2Deployments: 0 }));
    expect(withCreate2.breakdown.builder.raw).toBeGreaterThan(without.breakdown.builder.raw);
  });

  test('ERC-4337 operations boost builder score', () => {
    const withOps = calculateScore(activity({ erc4337Operations: 5 }));
    const without = calculateScore(activity({ erc4337Operations: 0 }));
    expect(withOps.breakdown.builder.raw).toBeGreaterThan(without.breakdown.builder.raw);
  });
});

describe('governance signals', () => {
  test('execution events boost governance score', () => {
    const base = { governanceVotes: 3, daosParticipated: ['ens'], proposalsCreated: 0, delegationEvents: 0 };
    const withExec = calculateScore(activity({ ...base, executionEvents: 2 }));
    const without = calculateScore(activity({ ...base, executionEvents: 0 }));
    expect(withExec.breakdown.governance.raw).toBeGreaterThan(without.breakdown.governance.raw);
  });

  test('cross-chain governance boosts governance score', () => {
    const base = { governanceVotes: 3, daosParticipated: ['ens'], proposalsCreated: 0, delegationEvents: 0 };
    const multiChain = calculateScore(
      activity({ ...base, governanceChains: ['ethereum', 'arbitrum', 'optimism'] }),
    );
    const singleChain = calculateScore(activity({ ...base, governanceChains: ['ethereum'] }));
    expect(multiChain.breakdown.governance.raw).toBeGreaterThan(
      singleChain.breakdown.governance.raw,
    );
  });
});

describe('temporal signals', () => {
  test('cross-cycle persistence boosts temporal score', () => {
    const withCycles = calculateScore(activity({ bearMarketPeriodsActive: 3 }));
    const without = calculateScore(activity({ bearMarketPeriodsActive: 0 }));
    expect(withCycles.breakdown.temporal.raw).toBeGreaterThan(without.breakdown.temporal.raw);
  });
});

describe('complexity signals', () => {
  test('permit interactions boost complexity score', () => {
    const withPermit = calculateScore(activity({ permitInteractions: 10 }));
    const without = calculateScore(activity({ permitInteractions: 0 }));
    expect(withPermit.breakdown.complexity.raw).toBeGreaterThan(without.breakdown.complexity.raw);
  });

  test('flashloan transactions boost complexity score', () => {
    const withFlash = calculateScore(activity({ flashloanTransactions: 3 }));
    const without = calculateScore(activity({ flashloanTransactions: 0 }));
    expect(withFlash.breakdown.complexity.raw).toBeGreaterThan(without.breakdown.complexity.raw);
  });

  test('smart wallet interactions boost complexity score', () => {
    const withSW = calculateScore(activity({ smartWalletInteractions: 5 }));
    const without = calculateScore(activity({ smartWalletInteractions: 0 }));
    expect(withSW.breakdown.complexity.raw).toBeGreaterThan(without.breakdown.complexity.raw);
  });
});

describe('badge evaluation', () => {
  test('governor badge requires proposals', () => {
    const withProposals = activity({
      daosParticipated: ['ens', 'aave', 'compound', 'maker', 'uniswap'],
      proposalsCreated: 1,
    });
    const withoutProposals = activity({
      daosParticipated: ['ens', 'aave', 'compound', 'maker', 'uniswap'],
      proposalsCreated: 0,
    });
    const score1 = calculateScore(withProposals);
    const score2 = calculateScore(withoutProposals);
    const badges1 = evaluateBadges(withProposals, score1.breakdown);
    const badges2 = evaluateBadges(withoutProposals, score2.breakdown);
    expect(badges1.badges.find((b) => b.type === 'governor')?.earned).toBe(true);
    expect(badges2.badges.find((b) => b.type === 'governor')?.earned).toBe(false);
  });

  test('safe executions boost governance score', () => {
    const base = { governanceVotes: 3, daosParticipated: ['ens'], proposalsCreated: 0, delegationEvents: 0 };
    const withSafe = calculateScore(activity({ ...base, safeExecutions: 4 }));
    const without = calculateScore(activity({ ...base, safeExecutions: 0 }));
    expect(withSafe.breakdown.governance.raw).toBeGreaterThan(without.breakdown.governance.raw);
  });

  test('trusted badge earned with Safe multi-sig + governance depth', () => {
    const a = activity({
      safeExecutions: 3,
      daosParticipated: ['ens', 'aave', 'compound'],
      delegationEvents: 5,
    });
    const score = calculateScore(a);
    const badges = evaluateBadges(a, score.breakdown);
    const trusted = badges.badges.find((b) => b.type === 'trusted');
    expect(trusted?.earned).toBe(true);
  });

  test('trusted badge not earned without Safe executions', () => {
    const a = activity({
      safeExecutions: 0,
      daosParticipated: ['ens', 'aave', 'compound'],
      delegationEvents: 5,
    });
    const score = calculateScore(a);
    const badges = evaluateBadges(a, score.breakdown);
    const trusted = badges.badges.find((b) => b.type === 'trusted');
    expect(trusted?.earned).toBe(false);
  });

  test('trusted badge not earned with insufficient delegation', () => {
    const a = activity({
      safeExecutions: 3,
      daosParticipated: ['ens', 'aave', 'compound'],
      delegationEvents: 1,
    });
    const score = calculateScore(a);
    const badges = evaluateBadges(a, score.breakdown);
    const trusted = badges.badges.find((b) => b.type === 'trusted');
    expect(trusted?.earned).toBe(false);
  });

  test('trusted badge not earned with insufficient DAOs', () => {
    const a = activity({
      safeExecutions: 3,
      daosParticipated: ['ens'],
      delegationEvents: 5,
    });
    const score = calculateScore(a);
    const badges = evaluateBadges(a, score.breakdown);
    const trusted = badges.badges.find((b) => b.type === 'trusted');
    expect(trusted?.earned).toBe(false);
  });

  test('power-user badge earned with high diversity and complexity', () => {
    const a = activity({
      uniqueProtocols: Array.from({ length: 15 }, (_, i) => `proto${i}`),
      chainsActive: ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon'],
      protocolCategories: ['defi', 'social', 'governance', 'infrastructure', 'gaming'],
      totalTransactions: 1000,
      failedTransactions: 100,
      totalCalldataBytes: 1000000,
    });
    const score = calculateScore(a);
    expect(score.breakdown.protocolDiversity.raw).toBeGreaterThanOrEqual(700);
    expect(score.breakdown.complexity.raw).toBeGreaterThanOrEqual(500);
    const badges = evaluateBadges(a, score.breakdown);
    const powerUser = badges.badges.find((b) => b.type === 'power-user');
    expect(powerUser?.earned).toBe(true);
  });

  test('power-user badge not earned with low complexity', () => {
    const a = activity({
      uniqueProtocols: Array.from({ length: 15 }, (_, i) => `proto${i}`),
      chainsActive: ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon'],
      protocolCategories: ['defi', 'social', 'governance', 'infrastructure', 'gaming'],
      totalTransactions: 10,
      failedTransactions: 0,
      totalCalldataBytes: 100,
    });
    const score = calculateScore(a);
    const badges = evaluateBadges(a, score.breakdown);
    const powerUser = badges.badges.find((b) => b.type === 'power-user');
    expect(powerUser?.earned).toBe(false);
  });

  test('power-user badge not earned with low diversity', () => {
    const a = activity({
      uniqueProtocols: ['uniswap'],
      chainsActive: ['ethereum'],
      protocolCategories: ['defi'],
      totalTransactions: 1000,
      failedTransactions: 100,
      totalCalldataBytes: 1000000,
    });
    const score = calculateScore(a);
    const badges = evaluateBadges(a, score.breakdown);
    const powerUser = badges.badges.find((b) => b.type === 'power-user');
    expect(powerUser?.earned).toBe(false);
  });
});

describe('early adoption signal', () => {
  test('early adoptions boost protocol diversity score', () => {
    const withEarly = calculateScore(activity({ earlyAdoptions: 5 }));
    const without = calculateScore(activity({ earlyAdoptions: 0 }));
    expect(withEarly.breakdown.protocolDiversity.raw).toBeGreaterThan(
      without.breakdown.protocolDiversity.raw,
    );
  });
});

describe('independent voting signal', () => {
  test('independent votes boost governance score', () => {
    const base = { governanceVotes: 5, daosParticipated: ['ens'], proposalsCreated: 0, delegationEvents: 0 };
    const withIndependent = calculateScore(activity({ ...base, independentVotes: 3 }));
    const without = calculateScore(activity({ ...base, independentVotes: 0 }));
    expect(withIndependent.breakdown.governance.raw).toBeGreaterThan(
      without.breakdown.governance.raw,
    );
  });
});

describe('deployment longevity signal', () => {
  test('old deployments boost builder score', () => {
    const now = Math.floor(Date.now() / 1000);
    const withOld = calculateScore(
      activity({ earliestDeploymentTimestamp: now - 2 * 365 * 86400 }), // 2 years ago
    );
    const withRecent = calculateScore(
      activity({ earliestDeploymentTimestamp: now - 30 * 86400 }), // 30 days ago
    );
    expect(withOld.breakdown.builder.raw).toBeGreaterThan(withRecent.breakdown.builder.raw);
  });
});

describe('verified source signal', () => {
  test('verified deployments boost builder score', () => {
    const withVerified = calculateScore(activity({ verifiedDeployments: 3 }));
    const without = calculateScore(activity({ verifiedDeployments: 0 }));
    expect(withVerified.breakdown.builder.raw).toBeGreaterThan(without.breakdown.builder.raw);
  });
});

describe('reasoned votes signal', () => {
  test('reasoned votes boost governance score', () => {
    const base = { governanceVotes: 5, daosParticipated: ['ens'], proposalsCreated: 0, delegationEvents: 0 };
    const withReasoned = calculateScore(activity({ ...base, reasonedVotes: 3 }));
    const without = calculateScore(activity({ ...base, reasonedVotes: 0 }));
    expect(withReasoned.breakdown.governance.raw).toBeGreaterThan(
      without.breakdown.governance.raw,
    );
  });
});

describe('internal transactions signal', () => {
  test('internal transactions boost complexity score', () => {
    const withInternal = calculateScore(activity({ internalTransactions: 100 }));
    const without = calculateScore(activity({ internalTransactions: 0 }));
    expect(withInternal.breakdown.complexity.raw).toBeGreaterThan(
      without.breakdown.complexity.raw,
    );
  });
});

describe('contract external users signal', () => {
  test('contract external users boost builder score', () => {
    const withUsers = calculateScore(activity({ contractExternalUsers: 10 }));
    const without = calculateScore(activity({ contractExternalUsers: 0 }));
    expect(withUsers.breakdown.builder.raw).toBeGreaterThan(without.breakdown.builder.raw);
  });
});

describe('active contracts signal', () => {
  test('active contracts boost builder score', () => {
    const withActive = calculateScore(activity({ activeContracts: 4 }));
    const without = calculateScore(activity({ activeContracts: 0 }));
    expect(withActive.breakdown.builder.raw).toBeGreaterThan(without.breakdown.builder.raw);
  });
});

describe('funding source cluster heuristic', () => {
  test('funding source with >10 outbound addresses reduces sybil confidence', () => {
    const flagged = calculateScore(activity({ fundingSourceOutboundCount: 50 }));
    const clean = calculateScore(activity({ fundingSourceOutboundCount: 5 }));
    expect(flagged.sybilMultiplier).toBeLessThan(clean.sybilMultiplier);
  });
});

describe('CEX fresh wallet heuristic', () => {
  test('CEX-funded fresh wallet reduces sybil confidence', () => {
    const now = Math.floor(Date.now() / 1000);
    const freshCex = calculateScore(
      activity({ fundedByCex: true, firstTxTimestamp: now - 15 * 86400 }), // 15 days old
    );
    const oldCex = calculateScore(
      activity({ fundedByCex: true, firstTxTimestamp: now - 365 * 86400 }), // 1 year old
    );
    expect(freshCex.sybilMultiplier).toBeLessThan(oldCex.sybilMultiplier);
  });

  test('non-CEX wallet not penalized', () => {
    const now = Math.floor(Date.now() / 1000);
    const freshNonCex = calculateScore(
      activity({ fundedByCex: false, firstTxTimestamp: now - 15 * 86400 }),
    );
    const freshCex = calculateScore(
      activity({ fundedByCex: true, firstTxTimestamp: now - 15 * 86400 }),
    );
    expect(freshNonCex.sybilMultiplier).toBeGreaterThan(freshCex.sybilMultiplier);
  });
});
