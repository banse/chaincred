import { describe, expect, test } from 'bun:test';
import { detectSybil } from '../src/sybil/detector.js';
import {
  checkTemporalClustering,
  checkActionRepetition,
  checkZeroFailureRate,
} from '../src/sybil/heuristics.js';
import type { WalletActivity } from '@chaincred/common';

const now = Math.floor(Date.now() / 1000);

describe('sybil detection', () => {
  test('returns confidence between 0 and 1', () => {
    const activity: WalletActivity = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      firstTxTimestamp: 1577836800,
      totalTransactions: 100,
      contractsDeployed: 2,
      uniqueProtocols: ['uniswap'],
      chainsActive: ['ethereum'],
      governanceVotes: 5,
      daosParticipated: ['ens'],
    };
    const result = detectSybil(activity);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  test('returns flags array', () => {
    const activity: WalletActivity = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      firstTxTimestamp: 1577836800,
      totalTransactions: 100,
      contractsDeployed: 0,
      uniqueProtocols: [],
      chainsActive: ['ethereum'],
      governanceVotes: 0,
      daosParticipated: [],
    };
    const result = detectSybil(activity);
    expect(Array.isArray(result.flags)).toBe(true);
    expect(result.flags.length).toBe(3);
  });

  test('clean wallet has confidence 1.0', () => {
    const clean: WalletActivity = {
      address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      firstTxTimestamp: 1577836800, // 2020-01-01 — old wallet
      totalTransactions: 50,
      contractsDeployed: 3,
      uniqueProtocols: ['uniswap', 'aave', 'compound', 'curve'],
      chainsActive: ['ethereum', 'arbitrum', 'optimism'],
      governanceVotes: 10,
      daosParticipated: ['ens', 'aave'],
    };
    const result = detectSybil(clean);
    expect(result.confidence).toBe(1.0);
    expect(result.flags.every((f) => !f.detected)).toBe(true);
  });

  test('suspicious wallet gets penalized', () => {
    const suspicious: WalletActivity = {
      address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      firstTxTimestamp: now - 7 * 86400, // 7 days old
      totalTransactions: 500,
      contractsDeployed: 0,
      uniqueProtocols: ['uniswap'],
      chainsActive: ['ethereum'],
      governanceVotes: 0,
      daosParticipated: [],
    };
    const result = detectSybil(suspicious);
    expect(result.confidence).toBeLessThan(1.0);
    expect(result.flags.some((f) => f.detected)).toBe(true);
  });
});

describe('temporal clustering', () => {
  test('flags new wallet with high tx volume', () => {
    const activity: WalletActivity = {
      address: '0x1111111111111111111111111111111111111111',
      firstTxTimestamp: now - 14 * 86400, // 14 days old
      totalTransactions: 1000,
      contractsDeployed: 0,
      uniqueProtocols: [],
      chainsActive: ['ethereum'],
      governanceVotes: 0,
      daosParticipated: [],
    };
    const result = checkTemporalClustering(activity);
    expect(result.detected).toBe(true);
    expect(result.penalty).toBe(0.40);
  });

  test('does not flag old wallet with high tx volume', () => {
    const activity: WalletActivity = {
      address: '0x2222222222222222222222222222222222222222',
      firstTxTimestamp: 1577836800, // 2020-01-01
      totalTransactions: 1000,
      contractsDeployed: 0,
      uniqueProtocols: [],
      chainsActive: ['ethereum'],
      governanceVotes: 0,
      daosParticipated: [],
    };
    const result = checkTemporalClustering(activity);
    expect(result.detected).toBe(false);
  });

  test('does not flag new wallet with low tx volume', () => {
    const activity: WalletActivity = {
      address: '0x3333333333333333333333333333333333333333',
      firstTxTimestamp: now - 30 * 86400, // 30 days old
      totalTransactions: 10,
      contractsDeployed: 0,
      uniqueProtocols: [],
      chainsActive: ['ethereum'],
      governanceVotes: 0,
      daosParticipated: [],
    };
    const result = checkTemporalClustering(activity);
    expect(result.detected).toBe(false);
  });
});

describe('action repetition', () => {
  test('flags single-protocol farming', () => {
    const activity: WalletActivity = {
      address: '0x4444444444444444444444444444444444444444',
      firstTxTimestamp: 1577836800,
      totalTransactions: 500,
      contractsDeployed: 0,
      uniqueProtocols: ['uniswap'],
      chainsActive: ['ethereum'],
      governanceVotes: 0,
      daosParticipated: [],
    };
    const result = checkActionRepetition(activity);
    expect(result.detected).toBe(true);
    expect(result.penalty).toBe(0.30);
  });

  test('does not flag diverse user', () => {
    const activity: WalletActivity = {
      address: '0x5555555555555555555555555555555555555555',
      firstTxTimestamp: 1577836800,
      totalTransactions: 500,
      contractsDeployed: 5,
      uniqueProtocols: ['uniswap', 'aave', 'compound', 'curve', 'maker'],
      chainsActive: ['ethereum', 'arbitrum', 'optimism'],
      governanceVotes: 20,
      daosParticipated: ['ens', 'aave'],
    };
    const result = checkActionRepetition(activity);
    expect(result.detected).toBe(false);
  });

  test('does not flag low-volume single-protocol user', () => {
    const activity: WalletActivity = {
      address: '0x6666666666666666666666666666666666666666',
      firstTxTimestamp: 1577836800,
      totalTransactions: 20,
      contractsDeployed: 0,
      uniqueProtocols: ['uniswap'],
      chainsActive: ['ethereum'],
      governanceVotes: 0,
      daosParticipated: [],
    };
    const result = checkActionRepetition(activity);
    expect(result.detected).toBe(false);
  });
});

describe('zero failure rate', () => {
  test('flags high-volume bot-like wallet', () => {
    const activity: WalletActivity = {
      address: '0x7777777777777777777777777777777777777777',
      firstTxTimestamp: 1577836800,
      totalTransactions: 500,
      contractsDeployed: 0,
      uniqueProtocols: ['uniswap'],
      chainsActive: ['ethereum'],
      governanceVotes: 0,
      daosParticipated: [],
    };
    const result = checkZeroFailureRate(activity);
    expect(result.detected).toBe(true);
    expect(result.penalty).toBe(0.20);
  });

  test('does not flag active builder', () => {
    const activity: WalletActivity = {
      address: '0x8888888888888888888888888888888888888888',
      firstTxTimestamp: 1577836800,
      totalTransactions: 500,
      contractsDeployed: 5,
      uniqueProtocols: ['uniswap', 'aave'],
      chainsActive: ['ethereum'],
      governanceVotes: 0,
      daosParticipated: [],
    };
    const result = checkZeroFailureRate(activity);
    expect(result.detected).toBe(false);
  });

  test('does not flag multi-chain user', () => {
    const activity: WalletActivity = {
      address: '0x9999999999999999999999999999999999999999',
      firstTxTimestamp: 1577836800,
      totalTransactions: 500,
      contractsDeployed: 0,
      uniqueProtocols: ['uniswap'],
      chainsActive: ['ethereum', 'arbitrum'],
      governanceVotes: 0,
      daosParticipated: [],
    };
    const result = checkZeroFailureRate(activity);
    expect(result.detected).toBe(false);
  });
});

describe('combined penalties', () => {
  test('all flags detected reduces confidence significantly', () => {
    const bot: WalletActivity = {
      address: '0xcccccccccccccccccccccccccccccccccccccccc',
      firstTxTimestamp: now - 7 * 86400, // 7 days old
      totalTransactions: 500,
      contractsDeployed: 0,
      uniqueProtocols: ['uniswap'],
      chainsActive: ['ethereum'],
      governanceVotes: 0,
      daosParticipated: [],
    };
    const result = detectSybil(bot);

    // All 3 flags should fire
    expect(result.flags.filter((f) => f.detected).length).toBe(3);

    // confidence = 1.0 * (1-0.40) * (1-0.30) * (1-0.20) = 0.336
    expect(result.confidence).toBeCloseTo(0.336, 2);
  });
});
