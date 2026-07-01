const Redis = require('ioredis');

let client = null;
let isRedisAvailable = false;

async function getClient() {
  if (client) return client;
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null
    });
    client.on('error', () => { isRedisAvailable = false; });
    await client.ping().then(() => { isRedisAvailable = true; }).catch(() => { isRedisAvailable = false; });
  } catch {
    isRedisAvailable = false;
  }
  return client;
}

getClient();

function cache(durationSeconds = 300) {
  return async (req, res, next) => {
    if (!isRedisAvailable) return next();

    const cacheKey = `template:${req.originalUrl}`;
    let redisClient;
    try {
      redisClient = await getClient();
      if (!redisClient) return next();

      const cached = await redisClient.get(cacheKey).catch(() => null);
      if (cached) {
        const parsed = JSON.parse(cached);
        return res.json(parsed);
      }

      const originalJson = res.json.bind(res);
      res.json = async (body) => {
        try {
          await redisClient.setex(cacheKey, durationSeconds, JSON.stringify(body));
        } catch { /* cache write failure is non-critical */ }
        originalJson(body);
      };

      next();
    } catch {
      next();
    }
  };
}

async function invalidateCache(pattern = 'template:*') {
  if (!isRedisAvailable) return;
  try {
    const redisClient = await getClient();
    if (!redisClient) return;
    const keys = await redisClient.keys(pattern).catch(() => []);
    if (keys.length > 0) {
      await redisClient.del(...keys).catch(() => {});
    }
  } catch { /* non-critical */ }
}

module.exports = { cache, invalidateCache };
