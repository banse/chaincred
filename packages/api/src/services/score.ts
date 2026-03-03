import type { WalletScore } from '@chaincred/common';
import { calculateScore } from '@chaincred/scoring';
import { getWalletActivity } from './activity.js';

export async function getScore(address: string): Promise<WalletScore> {
  const activity = await getWalletActivity(address);
  if (!activity) throw new Error('Address not found');
  return calculateScore(activity);
}
