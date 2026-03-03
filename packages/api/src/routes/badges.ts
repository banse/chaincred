import { Hono } from 'hono';
import { validateAddress } from '../middleware/validate-address.js';
import { getBadges } from '../services/badge.js';

export const badgeRoutes = new Hono();

badgeRoutes.get('/:address', validateAddress, async (c) => {
  const address = c.req.param('address');
  const badges = await getBadges(address);
  return c.json(badges);
});
