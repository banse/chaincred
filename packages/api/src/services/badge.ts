import type { WalletBadges, WalletActivity } from '@chaincred/common';
import { calculateScore, evaluateBadges } from '@chaincred/scoring';

export async function getBadges(address: string): Promise<WalletBadges> {
  // TODO: Fetch real activity data
  const mockActivity: WalletActivity = {
    address,
    firstTxTimestamp: 1609459200,
    totalTransactions: 150,
    contractsDeployed: 2,
    uniqueProtocols: ['uniswap', 'aave', 'compound'],
    chainsActive: ['ethereum', 'arbitrum'],
    governanceVotes: 10,
    daosParticipated: ['ens', 'aave'],
  };

  const score = calculateScore(mockActivity);
  return evaluateBadges(mockActivity, score.breakdown);
}
