import { Hono } from 'hono';
import { getDb } from '@chaincred/common';
import type { WalletActivity } from '@chaincred/common';
import { calculateScore } from '@chaincred/scoring';
import { cache } from '../middleware/cache.js';

export const leaderboardRoutes = new Hono();

leaderboardRoutes.get('/', cache(60), async (c) => {
  const category = c.req.query('category') || 'overall';
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  const sql = getDb();

  const [{ count }] = await sql`SELECT COUNT(*)::int as count FROM wallet_activity`;
  const total = Number(count);

  const rows = await sql`
    SELECT * FROM wallet_activity
    ORDER BY total_transactions DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const entries = rows.map((row: any) => {
    const activity: WalletActivity = {
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
    const { totalScore, breakdown, sybilMultiplier } = calculateScore(activity);
    return { address: row.address, score: totalScore, breakdown, sybilMultiplier };
  });

  return c.json({ category, entries, total, limit, offset });
});
