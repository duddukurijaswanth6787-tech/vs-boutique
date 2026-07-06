const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let redis = null;

try {
  redis = new Redis(REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy(times) { if (times > 3) return null; return Math.min(times * 200, 2000); },
    connectTimeout: 3000
  });
  redis.on('error', () => {});
} catch (e) { console.error('[monitoring Cache] init error:', e); }

async function get(key) {
  if (!redis) return null;
  try {
    const raw = await redis.get(`cms:mon:${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function set(key, value, ttl = 30) {
  if (!redis) return;
  try { await redis.setex(`cms:mon:${key}`, ttl, JSON.stringify(value)); } catch (e) { console.error('[monitoring Cache] set error:', e); }
}

async function del(key) {
  if (!redis) return;
  try { await redis.del(`cms:mon:${key}`); } catch (e) { console.error('[monitoring Cache] del error:', e); }
}

module.exports = { get, set, del };
