import type { SybilResult } from '@chaincred/common';
import { detectSybil } from '@chaincred/scoring';
import { getWalletActivity } from './activity.js';

export async function getSybilAnalysis(address: string): Promise<SybilResult> {
  const activity = await getWalletActivity(address);
  if (!activity) throw new Error('Address not found');
  return detectSybil(activity);
}
