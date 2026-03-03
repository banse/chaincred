import { Hono } from 'hono';

export const leaderboardRoutes = new Hono();

leaderboardRoutes.get('/', async (c) => {
  const category = c.req.query('category') || 'overall';
  const limit = parseInt(c.req.query('limit') || '50');
  // TODO: Query from database
  return c.json({
    category,
    entries: [],
    total: 0,
    limit,
  });
});
