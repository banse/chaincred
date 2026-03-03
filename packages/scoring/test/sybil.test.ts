import { describe, expect, test } from 'bun:test';
import { detectSybil } from '../src/sybil/detector.js';
import type { WalletActivity } from '@chaincred/common';

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
  });
});
