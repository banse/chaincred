// Redis client — connects when REDIS_URL is available
let redis: any = null;

export async function getRedis() {
  if (!redis) {
    try {
      const Redis = (await import('ioredis')).default;
      redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    } catch {
      console.warn('Redis not available — caching disabled');
    }
  }
  return redis;
}
