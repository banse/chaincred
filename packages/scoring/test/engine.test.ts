import { describe, expect, test } from 'bun:test';
import { calculateScore } from '../src/engine.js';
import type { WalletActivity } from '@chaincred/common';

describe('scoring engine', () => {
  const mockActivity: WalletActivity = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    firstTxTimestamp: 1577836800, // 2020-01-01
    totalTransactions: 500,
    contractsDeployed: 5,
    uniqueProtocols: ['uniswap', 'aave', 'compound', 'maker', 'curve'],
    chainsActive: ['ethereum', 'arbitrum', 'optimism'],
    governanceVotes: 20,
    daosParticipated: ['ens', 'aave', 'compound'],
  };

  test('produces score between 0 and 1000', () => {
    const result = calculateScore(mockActivity);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(1000);
  });

  test('includes all category scores', () => {
    const result = calculateScore(mockActivity);
    expect(result.breakdown.builder).toBeDefined();
    expect(result.breakdown.governance).toBeDefined();
    expect(result.breakdown.temporal).toBeDefined();
    expect(result.breakdown.protocolDiversity).toBeDefined();
    expect(result.breakdown.complexity).toBeDefined();
  });

  test('applies sybil multiplier', () => {
    const result = calculateScore(mockActivity);
    expect(result.sybilMultiplier).toBeGreaterThan(0);
    expect(result.sybilMultiplier).toBeLessThanOrEqual(1);
  });

  test('empty activity produces low score', () => {
    const empty: WalletActivity = {
      address: '0x0000000000000000000000000000000000000000',
      firstTxTimestamp: Math.floor(Date.now() / 1000),
      totalTransactions: 0,
      contractsDeployed: 0,
      uniqueProtocols: [],
      chainsActive: [],
      governanceVotes: 0,
      daosParticipated: [],
    };
    const result = calculateScore(empty);
    expect(result.totalScore).toBe(0);
  });
});
