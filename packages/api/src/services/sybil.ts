import type { SybilResult } from '@chaincred/common';
import { CEX_HOT_WALLETS } from '@chaincred/common';
import { detectSybil } from '@chaincred/scoring';
import { getWalletActivity } from './activity.js';
import { EtherscanClient } from './etherscan.js';

export async function getSybilAnalysis(address: string): Promise<SybilResult> {
  const activity = await getWalletActivity(address);
  if (!activity) throw new Error('Address not found');

  // Run the same Etherscan enrichment as the score route so sybil flags are consistent
  const etherscanKey = process.env.ETHERSCAN_API_KEY;
  if (etherscanKey) {
    try {
      const client = new EtherscanClient(etherscanKey);
      const fundingTx = await client.getFirstIncomingTx(address, 1);
      if (fundingTx) {
        activity.fundingSource = fundingTx.from;
        activity.fundedByCex = CEX_HOT_WALLETS.has(fundingTx.from);
        const outboundCount = await client.getOutboundAddressCount(fundingTx.from, 1);
        activity.fundingSourceOutboundCount = outboundCount;
      }
    } catch {
      // Fail-open: skip enrichment on any error
    }
  }

  return detectSybil(activity);
}
