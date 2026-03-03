// Redis client — connects when REDIS_URL is available
let redis: any = null;
let redisUnavailable = false;

export async function getRedis() {
  if (redisUnavailable) return null;
  if (!redis) {
    try {
      const Redis = (await import('ioredis')).default;
      redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: 1,
        retryStrategy: (times: number) => (times > 2 ? null : Math.min(times * 200, 1000)),
        lazyConnect: true,
      });
      await redis.connect();
    } catch {
      console.warn('Redis not available — caching disabled');
      redis = null;
      redisUnavailable = true;
    }
  }
  return redis;
}
