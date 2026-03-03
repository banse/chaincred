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
  };
}
