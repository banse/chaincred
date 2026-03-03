import { Hono } from 'hono';
import { validateAddress } from '../middleware/validate-address.js';
import { cache } from '../middleware/cache.js';
import { getTimeline } from '../services/timeline.js';

export const timelineRoutes = new Hono();

timelineRoutes.get('/:address', validateAddress, cache(300), async (c) => {
  const address = c.req.param('address');
  const events = await getTimeline(address);
  return c.json({ address, events });
});
