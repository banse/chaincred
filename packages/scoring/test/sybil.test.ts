import { describe, expect, test } from 'bun:test';
import { detectSybil } from '../src/sybil/detector.js';
import {
  checkTemporalClustering,
  checkActionRepetition,
  checkZeroFailureRate,
  checkFundingGraph,
  checkCrossChainMirror,
  checkCexFreshness,
  checkGasPatterns,
  checkMevActivity,
} from '../src/sybil/heuristics.js';
import type { WalletActivity } from '@chaincred/common';

const now = Math.floor(Date.now() / 1000);

/** Helper with defaults for all WalletActivity fields */
function activity(overrides: Partial<WalletActivity>): WalletActivity {
  return {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    firstTxTimestamp: 1577836800, // 2020-01-01
    totalTransactions: 100,
    contractsDeployed: 0,
    deploymentChains: [],
    deploymentCalldataBytes: 0,
    uniqueProtocols: [],
    chainsActive: ['ethereum'],
    governanceVotes: 0,
    daosParticipated: [],
    proposalsCreated: 0,
    delegationEvents: 0,
    bearMarketTxs: 0,
    activeMonths: 0,
    protocolCategories: [],
    failedTransactions: 5,
    totalCalldataBytes: 0,
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

describe('sybil detection', () => {
  test('returns confidence between 0 and 1', () => {
    const result = detectSybil(
      activity({
        contractsDeployed: 2,
        uniqueProtocols: ['uniswap'],
        governanceVotes: 5,
        daosParticipated: ['ens'],
      }),
    );
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  test('returns flags array with all 10 heuristics', () => {
    const result = detectSybil(activity({}));
    expect(Array.isArray(result.flags)).toBe(true);
    expect(result.flags.length).toBe(10);
  });

  test('clean wallet has confidence 1.0', () => {
    const result = detectSybil(
      activity({
        address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        totalTransactions: 50,
        contractsDeployed: 3,
        uniqueProtocols: ['uniswap', 'aave', 'compound', 'curve'],
        chainsActive: ['ethereum', 'arbitrum', 'optimism'],
        governanceVotes: 10,
        daosParticipated: ['ens', 'aave'],
        failedTransactions: 5,
        uniqueRecipients: 3,
        distinctGasPrices: 15,
      }),
    );
    expect(result.confidence).toBe(1.0);
    expect(result.flags.every((f) => !f.detected)).toBe(true);
  });

  test('suspicious wallet gets penalized', () => {
    const result = detectSybil(
      activity({
        address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        firstTxTimestamp: now - 7 * 86400,
        totalTransactions: 500,
        uniqueProtocols: ['uniswap'],
        failedTransactions: 0,
        uniqueRecipients: 2,
        distinctGasPrices: 1,
      }),
    );
    expect(result.confidence).toBeLessThan(1.0);
    expect(result.flags.some((f) => f.detected)).toBe(true);
  });
});

describe('temporal clustering', () => {
  test('flags new wallet with high tx volume', () => {
    const result = checkTemporalClustering(
      activity({
        address: '0x1111111111111111111111111111111111111111',
        firstTxTimestamp: now - 14 * 86400,
        totalTransactions: 1000,
      }),
    );
    expect(result.detected).toBe(true);
    expect(result.penalty).toBe(0.40);
  });

  test('does not flag old wallet with high tx volume', () => {
    const result = checkTemporalClustering(
      activity({
        address: '0x2222222222222222222222222222222222222222',
        totalTransactions: 1000,
      }),
    );
    expect(result.detected).toBe(false);
  });

  test('does not flag new wallet with low tx volume', () => {
    const result = checkTemporalClustering(
      activity({
        address: '0x3333333333333333333333333333333333333333',
        firstTxTimestamp: now - 30 * 86400,
        totalTransactions: 10,
      }),
    );
    expect(result.detected).toBe(false);
  });
});

describe('action repetition', () => {
  test('flags single-protocol farming', () => {
    const result = checkActionRepetition(
      activity({
        address: '0x4444444444444444444444444444444444444444',
        totalTransactions: 500,
        uniqueProtocols: ['uniswap'],
      }),
    );
    expect(result.detected).toBe(true);
    expect(result.penalty).toBe(0.30);
  });

  test('does not flag diverse user', () => {
    const result = checkActionRepetition(
      activity({
        address: '0x5555555555555555555555555555555555555555',
        totalTransactions: 500,
        contractsDeployed: 5,
        uniqueProtocols: ['uniswap', 'aave', 'compound', 'curve', 'maker'],
        chainsActive: ['ethereum', 'arbitrum', 'optimism'],
        governanceVotes: 20,
        daosParticipated: ['ens', 'aave'],
      }),
    );
    expect(result.detected).toBe(false);
  });

  test('does not flag low-volume single-protocol user', () => {
    const result = checkActionRepetition(
      activity({
        address: '0x6666666666666666666666666666666666666666',
        totalTransactions: 20,
        uniqueProtocols: ['uniswap'],
      }),
    );
    expect(result.detected).toBe(false);
  });
});

describe('funding graph clustering', () => {
  test('flags cluster coordinator with many recipients and low diversity', () => {
    const result = checkFundingGraph(
      activity({
        uniqueRecipients: 25,
        uniqueProtocols: ['uniswap'],
      }),
    );
    expect(result.detected).toBe(true);
    expect(result.penalty).toBe(0.50);
  });

  test('does not flag wallet with many recipients but high diversity', () => {
    const result = checkFundingGraph(
      activity({
        uniqueRecipients: 25,
        uniqueProtocols: ['uniswap', 'aave', 'compound', 'curve'],
      }),
    );
    expect(result.detected).toBe(false);
  });

  test('does not flag wallet with few recipients', () => {
    const result = checkFundingGraph(
      activity({
        uniqueRecipients: 3,
        uniqueProtocols: ['uniswap'],
      }),
    );
    expect(result.detected).toBe(false);
  });
});

describe('cross-chain mirroring', () => {
  test('flags wallet with identical protocol sets on 3+ chains', () => {
    const result = checkCrossChainMirror(
      activity({
        chainsActive: ['ethereum', 'arbitrum', 'optimism', 'base'],
        chainProtocolPairs: [
          'ethereum:uniswap',
          'ethereum:aave',
          'arbitrum:uniswap',
          'arbitrum:aave',
          'optimism:uniswap',
          'optimism:aave',
          'base:curve',
        ],
      }),
    );
    expect(result.detected).toBe(true);
    expect(result.penalty).toBe(0.60);
  });

  test('does not flag wallet with different protocol sets per chain', () => {
    const result = checkCrossChainMirror(
      activity({
        chainsActive: ['ethereum', 'arbitrum', 'optimism'],
        chainProtocolPairs: [
          'ethereum:uniswap',
          'ethereum:aave',
          'ethereum:maker',
          'arbitrum:uniswap',
          'arbitrum:gmx',
          'optimism:velodrome',
        ],
      }),
    );
    expect(result.detected).toBe(false);
  });

  test('does not flag wallet active on fewer than 3 chains', () => {
    const result = checkCrossChainMirror(
      activity({
        chainsActive: ['ethereum', 'arbitrum'],
        chainProtocolPairs: [
          'ethereum:uniswap',
          'arbitrum:uniswap',
        ],
      }),
    );
    expect(result.detected).toBe(false);
  });
});

describe('cex withdrawal freshness', () => {
  test('flags brand-new wallet with max penalty', () => {
    const result = checkCexFreshness(
      activity({
        firstTxTimestamp: now - 1 * 86400, // 1 day old
      }),
    );
    expect(result.detected).toBe(true);
    expect(result.penalty).toBeGreaterThan(0.25);
    expect(result.penalty).toBeLessThanOrEqual(0.30);
  });

  test('applies graduated penalty for 15-day old wallet', () => {
    const result = checkCexFreshness(
      activity({
        firstTxTimestamp: now - 15 * 86400, // 15 days old
      }),
    );
    expect(result.detected).toBe(true);
    expect(result.penalty).toBeCloseTo(0.15, 1);
  });

  test('does not flag wallet older than 30 days', () => {
    const result = checkCexFreshness(
      activity({
        firstTxTimestamp: now - 60 * 86400, // 60 days old
      }),
    );
    expect(result.detected).toBe(false);
  });
});

describe('zero failure rate', () => {
  test('flags high-volume wallet with zero failures', () => {
    const result = checkZeroFailureRate(
      activity({
        address: '0x7777777777777777777777777777777777777777',
        totalTransactions: 500,
        uniqueProtocols: ['uniswap'],
        failedTransactions: 0,
      }),
    );
    expect(result.detected).toBe(true);
    expect(result.penalty).toBe(0.20);
  });

  test('does not flag wallet with some failures', () => {
    const result = checkZeroFailureRate(
      activity({
        address: '0x8888888888888888888888888888888888888888',
        totalTransactions: 500,
        contractsDeployed: 5,
        uniqueProtocols: ['uniswap', 'aave'],
        failedTransactions: 25,
      }),
    );
    expect(result.detected).toBe(false);
  });

  test('does not flag low-volume wallet even with zero failures', () => {
    const result = checkZeroFailureRate(
      activity({
        address: '0x9999999999999999999999999999999999999999',
        totalTransactions: 50,
        uniqueProtocols: ['uniswap'],
        failedTransactions: 0,
      }),
    );
    expect(result.detected).toBe(false);
  });
});

describe('perfect gas patterns', () => {
  test('flags wallet with very few distinct gas prices', () => {
    const result = checkGasPatterns(
      activity({
        totalTransactions: 500,
        distinctGasPrices: 2, // 0.4% ratio with only 2 prices — bot-like
      }),
    );
    expect(result.detected).toBe(true);
    expect(result.penalty).toBe(0.15);
  });

  test('does not flag wallet with diverse gas prices', () => {
    const result = checkGasPatterns(
      activity({
        totalTransactions: 200,
        distinctGasPrices: 50, // 25% ratio
      }),
    );
    expect(result.detected).toBe(false);
  });

  test('does not flag low-volume wallet', () => {
    const result = checkGasPatterns(
      activity({
        totalTransactions: 20,
        distinctGasPrices: 1,
      }),
    );
    expect(result.detected).toBe(false);
  });
});

describe('MEV bot activity', () => {
  test('flags wallet with high MEV interaction count and ratio', () => {
    const result = checkMevActivity(
      activity({
        totalTransactions: 60,
        mevInteractions: 25, // 41.7% ratio, >20 count
      }),
    );
    expect(result.detected).toBe(true);
    expect(result.penalty).toBe(0.15);
  });

  test('does not flag wallet with low MEV count', () => {
    const result = checkMevActivity(
      activity({
        totalTransactions: 30,
        mevInteractions: 5, // count <= 20
      }),
    );
    expect(result.detected).toBe(false);
  });

  test('does not flag wallet with low MEV ratio', () => {
    const result = checkMevActivity(
      activity({
        totalTransactions: 500,
        mevInteractions: 25, // 5% ratio, below 30% threshold
      }),
    );
    expect(result.detected).toBe(false);
  });
});

describe('combined penalties', () => {
  test('multiple flags detected reduces confidence significantly', () => {
    const result = detectSybil(
      activity({
        address: '0xcccccccccccccccccccccccccccccccccccccccc',
        firstTxTimestamp: now - 7 * 86400,
        totalTransactions: 500,
        uniqueProtocols: ['uniswap'],
        failedTransactions: 0,
        uniqueRecipients: 2,
        distinctGasPrices: 1,
      }),
    );

    // Temporal clustering + action repetition + zero failure rate + gas patterns should fire
    // CEX freshness fires too (7 days old)
    const detectedFlags = result.flags.filter((f) => f.detected);
    expect(detectedFlags.length).toBeGreaterThanOrEqual(4);

    // Confidence should be very low with multiple penalties
    expect(result.confidence).toBeLessThan(0.3);
  });
});
