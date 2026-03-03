import { describe, expect, test } from 'bun:test';
import { calculateScore } from '../src/engine.js';
import type { WalletActivity } from '@chaincred/common';

/** Helper to build a WalletActivity with defaults for all fields */
function activity(overrides: Partial<WalletActivity> = {}): WalletActivity {
  return {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    firstTxTimestamp: 1577836800, // 2020-01-01
    totalTransactions: 500,
    contractsDeployed: 5,
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
});
