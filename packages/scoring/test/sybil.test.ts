import { describe, expect, test } from 'bun:test';
import { detectSybil } from '../src/sybil/detector.js';
import {
  checkTemporalClustering,
  checkActionRepetition,
  checkZeroFailureRate,
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

  test('returns flags array', () => {
    const result = detectSybil(activity({}));
    expect(Array.isArray(result.flags)).toBe(true);
    expect(result.flags.length).toBe(3);
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

describe('combined penalties', () => {
  test('all flags detected reduces confidence significantly', () => {
    const result = detectSybil(
      activity({
        address: '0xcccccccccccccccccccccccccccccccccccccccc',
        firstTxTimestamp: now - 7 * 86400,
        totalTransactions: 500,
        uniqueProtocols: ['uniswap'],
        failedTransactions: 0,
      }),
    );

    // All 3 flags should fire
    expect(result.flags.filter((f) => f.detected).length).toBe(3);

    // confidence = 1.0 * (1-0.40) * (1-0.30) * (1-0.20) = 0.336
    expect(result.confidence).toBeCloseTo(0.336, 2);
  });
});
