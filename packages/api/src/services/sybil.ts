import type { SybilResult, WalletActivity } from '@chaincred/common';
import { detectSybil } from '@chaincred/scoring';

export async function getSybilAnalysis(address: string): Promise<SybilResult> {
  // TODO: Fetch real activity data
  const mockActivity: WalletActivity = {
    address,
    firstTxTimestamp: 1609459200,
    totalTransactions: 150,
    contractsDeployed: 2,
    uniqueProtocols: ['uniswap'],
    chainsActive: ['ethereum'],
    governanceVotes: 5,
    daosParticipated: ['ens'],
  };

  return detectSybil(mockActivity);
}
