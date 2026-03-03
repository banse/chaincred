import type { MiddlewareHandler } from 'hono';

const requestCounts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 100;

export const rateLimit: MiddlewareHandler = async (c, next) => {
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    record.count++;
    if (record.count > MAX_REQUESTS) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }
  }

  await next();
};
