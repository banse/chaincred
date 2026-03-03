import type { MiddlewareHandler } from 'hono';
import { getRedis } from '../db/redis.js';

/**
 * Redis cache middleware for GET requests.
 * Caches JSON responses with a given TTL. Cache key is derived from the full request path + query string.
 */
export function cache(ttlSeconds: number): MiddlewareHandler {
  return async (c, next) => {
    if (c.req.method !== 'GET') {
      await next();
      return;
    }

    const redis = await getRedis();
    if (!redis) {
      await next();
      return;
    }

    const key = `chaincred:${c.req.path}${c.req.url.includes('?') ? '?' + c.req.url.split('?')[1] : ''}`;

    const cached = await redis.get(key);
    if (cached) {
      return c.json(JSON.parse(cached));
    }

    await next();

    if (c.res.status === 200) {
      const body = await c.res.clone().text();
      await redis.set(key, body, 'EX', ttlSeconds);
    }
  };
}
