import { Hono } from 'hono';
import { validateAddress } from '../middleware/validate-address.js';
import { cache } from '../middleware/cache.js';
import { getSybilAnalysis } from '../services/sybil.js';

export const sybilRoutes = new Hono();

sybilRoutes.get('/:address', validateAddress, cache(300), async (c) => {
  const address = c.req.param('address');
  const result = await getSybilAnalysis(address);
  return c.json(result);
});
