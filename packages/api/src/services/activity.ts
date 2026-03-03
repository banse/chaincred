import type { WalletActivity } from '@chaincred/common';
import { getDb } from '@chaincred/common';

/** Fetch WalletActivity from DB, or null if address has no indexed data. */
export async function getWalletActivity(address: string): Promise<WalletActivity | null> {
  const sql = getDb();
  const [row] = await sql`
    SELECT * FROM wallet_activity WHERE address = ${address.toLowerCase()}
  `;
  if (!row) return null;

  return {
    address: row.address,
    firstTxTimestamp: Number(row.first_tx_timestamp),
    totalTransactions: Number(row.total_transactions),
    contractsDeployed: Number(row.contracts_deployed),
    uniqueProtocols: row.unique_protocols ?? [],
    chainsActive: row.chains_active ?? [],
    governanceVotes: Number(row.governance_votes),
    daosParticipated: row.daos_participated ?? [],
    proposalsCreated: Number(row.proposals_created ?? 0),
    delegationEvents: Number(row.delegation_events ?? 0),
    bearMarketTxs: Number(row.bear_market_txs ?? 0),
    activeMonths: (row.active_month_set ?? []).length,
    protocolCategories: row.protocol_categories ?? [],
    failedTransactions: Number(row.failed_transactions ?? 0),
    totalCalldataBytes: Number(row.total_calldata_bytes ?? 0),
  };
}
