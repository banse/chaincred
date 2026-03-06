import { Hono } from 'hono';
import {
  getAllBearMarketPeriods,
  addBearMarketPeriod,
  removeBearMarketPeriod,
  BEAR_MARKET_PERIODS,
  getDb,
} from '@chaincred/common';
import { enqueueWallet, getQueue } from '../services/indexer-queue.js';

export const adminRoutes = new Hono();

/** Verify admin API key from X-Admin-Key header */
function isAuthorized(c: any): boolean {
  const key = c.req.header('X-Admin-Key');
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || !key) return false;
  return key === expected;
}

/** GET /v1/admin/bear-periods — list all bear market periods */
adminRoutes.get('/bear-periods', (c) => {
  const periods = getAllBearMarketPeriods();
  const hardcodedLabels = new Set(BEAR_MARKET_PERIODS.map((p) => p.label));
  return c.json({
    periods: periods.map((p) => ({
      ...p,
      source: hardcodedLabels.has(p.label) ? 'hardcoded' : 'dynamic',
    })),
  });
});

/** POST /v1/admin/bear-periods — add a dynamic bear market period */
adminRoutes.post('/bear-periods', async (c) => {
  if (!isAuthorized(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json().catch(() => null);
  if (!body?.label || !body?.startTimestamp || !body?.endTimestamp) {
    return c.json({ error: 'Missing required fields: label, startTimestamp, endTimestamp' }, 400);
  }

  addBearMarketPeriod({
    label: body.label,
    startTimestamp: body.startTimestamp,
    endTimestamp: body.endTimestamp,
  });

  return c.json({ ok: true, periods: getAllBearMarketPeriods().length });
});

/** DELETE /v1/admin/bear-periods/:label — remove a dynamic bear market period */
adminRoutes.delete('/bear-periods/:label', (c) => {
  if (!isAuthorized(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const label = decodeURIComponent(c.req.param('label'));
  const hardcodedLabels = new Set(BEAR_MARKET_PERIODS.map((p) => p.label));

  if (hardcodedLabels.has(label)) {
    return c.json({ error: 'Cannot remove hardcoded bear market period' }, 400);
  }

  const removed = removeBearMarketPeriod(label);
  if (!removed) {
    return c.json({ error: 'Period not found' }, 404);
  }

  return c.json({ ok: true });
});

/** POST /v1/admin/index-wallet — enqueue a wallet for indexing */
adminRoutes.post('/index-wallet', async (c) => {
  if (!isAuthorized(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json().catch(() => null);
  if (!body?.address || !body.address.startsWith('0x')) {
    return c.json({ error: 'Missing or invalid address' }, 400);
  }

  const job = enqueueWallet(body.address);
  return c.json({ job }, 202);
});

/** GET /v1/admin/index-queue — list all indexing jobs */
adminRoutes.get('/index-queue', (c) => {
  if (!isAuthorized(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  return c.json({ jobs: getQueue() });
});

/** GET /v1/admin/wallets — list indexed wallets */
adminRoutes.get('/wallets', async (c) => {
  if (!isAuthorized(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT address, ens_name, total_transactions, updated_at
      FROM wallet_activity
      ORDER BY updated_at DESC
      LIMIT 200
    `;

    return c.json({
      wallets: rows.map((r: any) => ({
        address: r.address,
        ensName: r.ens_name,
        txCount: r.total_transactions,
        updatedAt: r.updated_at,
      })),
    });
  } catch {
    return c.json({ wallets: [] });
  }
});
