const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const CACHE_TTL = parseInt(process.env.ASSIGNMENT_CACHE_TTL || '300', 10);

let redis = null;

function getClient() {
  if (!redis) {
    try {
      redis = new Redis(REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        }
      });
      redis.on('error', () => {});
    } catch {
      redis = null;
    }
  }
  return redis;
}

async function get(key) {
  const client = getClient();
  if (!client) return null;
  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function set(key, data, ttl = CACHE_TTL) {
  const client = getClient();
  if (!client) return;
  try {
    await client.setex(key, ttl, JSON.stringify(data));
  } catch (e) { console.error('[assignment Cache] set error:', e); }
}

async function del(pattern) {
  const client = getClient();
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(...keys);
  } catch (e) { console.error('[assignment Cache] delPattern error:', e); }
}

function cacheMiddleware(keyPrefix, ttl) {
  return (req, res, next) => {
    const key = `${keyPrefix}:${req.originalUrl || req.url}`;
    get(key).then((cached) => {
      if (cached) {
        return res.json(cached);
      }
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode === 200) {
          set(key, body, ttl).catch(() => {});
        }
        return originalJson(body);
      };
      next();
    }).catch(() => next());
  };
}

module.exports = { get, set, del, cacheMiddleware, CACHE_TTL };
