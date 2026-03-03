import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { scoreRoutes } from './routes/score.js';
import { badgeRoutes } from './routes/badges.js';
import { sybilRoutes } from './routes/sybil.js';
import { attestationRoutes } from './routes/attestation.js';
import { verifyRoutes } from './routes/verify.js';
import { leaderboardRoutes } from './routes/leaderboard.js';
import { errorHandler } from './middleware/error-handler.js';
import { rateLimit } from './middleware/rate-limit.js';

const app = new Hono();

// Global middleware
app.use('*', cors());
app.use('*', rateLimit);
app.onError(errorHandler);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

// API v1 routes
const v1 = new Hono();
v1.route('/score', scoreRoutes);
v1.route('/badges', badgeRoutes);
v1.route('/sybil', sybilRoutes);
v1.route('/attestation', attestationRoutes);
v1.route('/verify', verifyRoutes);
v1.route('/leaderboard', leaderboardRoutes);
app.route('/v1', v1);

const port = parseInt(process.env.PORT || '3001');
console.log(`ChainCred API running on :${port}`);

export default {
  port,
  fetch: app.fetch,
};
