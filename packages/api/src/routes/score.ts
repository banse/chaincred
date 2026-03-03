import { Hono } from 'hono';
import { validateAddress } from '../middleware/validate-address.js';
import { getScore } from '../services/score.js';

export const scoreRoutes = new Hono();

scoreRoutes.get('/:address', validateAddress, async (c) => {
  const address = c.req.param('address');
  const score = await getScore(address);
  return c.json(score);
});
