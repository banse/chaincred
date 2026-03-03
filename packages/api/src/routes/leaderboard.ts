import { Hono } from 'hono';
import { getDb } from '@chaincred/common';
import type { WalletActivity } from '@chaincred/common';
import { calculateScore } from '@chaincred/scoring';
import { cache } from '../middleware/cache.js';

export const leaderboardRoutes = new Hono();

function mapRow(row: any): WalletActivity {
  return {
    address: row.address,
    firstTxTimestamp: Number(row.first_tx_timestamp),
    totalTransactions: Number(row.total_transactions),
    contractsDeployed: Number(row.contracts_deployed),
    deploymentChains: row.deployment_chains ?? [],
    deploymentCalldataBytes: Number(row.deployment_calldata_bytes ?? 0),
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
    uniqueRecipients: (row.recipient_addresses ?? []).length,
    chainProtocolPairs: row.chain_protocol_pairs ?? [],
    distinctGasPrices: (row.gas_price_set ?? []).length,
    distinctTxHours: (row.tx_hour_set ?? []).length,
    create2Deployments: Number(row.create2_deployments ?? 0),
  };
}

const VALID_CATEGORIES = ['builder', 'governance', 'temporal', 'protocolDiversity', 'complexity'];

leaderboardRoutes.get('/', cache(60), async (c) => {
  const category = c.req.query('category') || 'overall';
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  const sql = getDb();

  const rows = await sql`SELECT * FROM wallet_activity`;
  const total = rows.length;

  const allEntries = rows.map((row: any) => {
    const activity = mapRow(row);
    const { totalScore, breakdown, sybilMultiplier } = calculateScore(activity);
    return { address: row.address, score: totalScore, breakdown, sybilMultiplier };
  });

  if (category !== 'overall' && VALID_CATEGORIES.includes(category)) {
    allEntries.sort(
      (a, b) => (b.breakdown as any)[category].raw - (a.breakdown as any)[category].raw,
    );
  } else {
    allEntries.sort((a, b) => b.score - a.score);
  }

  const entries = allEntries.slice(offset, offset + limit);

  return c.json({ category, entries, total, limit, offset });
});
