import type { WalletScore, WalletActivity } from '@chaincred/common';
import { calculateScore } from '@chaincred/scoring';

export async function getScore(address: string): Promise<WalletScore> {
  // TODO: Fetch real activity data from DB/indexer
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

  return calculateScore(mockActivity);
}
