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
} catch (e) { console.error('[Infrastructure Cache] Redis connection error:', e); }

async function get(key) {
  if (!redis) return null;
  try {
    const raw = await redis.get(`cms:infra:${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function set(key, value, ttl = 120) {
  if (!redis) return;
  try { await redis.setex(`cms:infra:${key}`, ttl, JSON.stringify(value)); } catch (e) { console.error('[Infrastructure Cache] set error:', e); }
}

async function del(key) {
  if (!redis) return;
  try { await redis.del(`cms:infra:${key}`); } catch (e) { console.error('[Infrastructure Cache] del error:', e); }
}

async function delPattern(pattern) {
  if (!redis) return;
  try {
    const keys = await redis.keys(`cms:infra:${pattern}`);
    if (keys.length) await redis.del(...keys);
  } catch (e) { console.error('[Infrastructure Cache] delPattern error:', e); }
}

module.exports = { get, set, del, delPattern };
