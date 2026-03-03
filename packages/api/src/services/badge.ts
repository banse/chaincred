import type { WalletBadges } from '@chaincred/common';
import { calculateScore, evaluateBadges } from '@chaincred/scoring';
import { getWalletActivity } from './activity.js';

export async function getBadges(address: string): Promise<WalletBadges> {
  const activity = await getWalletActivity(address);
  if (!activity) throw new Error('Address not found');
  const score = calculateScore(activity);
  return evaluateBadges(activity, score.breakdown);
}
