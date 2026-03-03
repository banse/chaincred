import { Hono } from 'hono';
import { getDb, SUPPORTED_CHAINS } from '@chaincred/common';
import { cache } from '../middleware/cache.js';

export const statsRoutes = new Hono();

statsRoutes.get('/', cache(60), async (c) => {
  const sql = getDb();
  const [{ count }] = await sql`SELECT COUNT(*)::int as count FROM wallet_activity`;

  return c.json({
    walletsScored: Number(count),
    chainsIndexed: SUPPORTED_CHAINS.length,
  });
});
