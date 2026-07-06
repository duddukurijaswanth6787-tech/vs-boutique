const prisma = require('../../../utils/prisma');
const cache = require('../middleware/ai-center-cache');

class AiSettingsService {
  async getAll() {
    const cached = await cache.get('ai:settings');
    if (cached) return cached;
    const settings = await prisma.cmsAiSettings.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] });
    await cache.set('ai:settings', settings);
    return settings;
  }

  async getByCategory(category) {
    const cacheKey = `ai:settings:${category}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    const settings = await prisma.cmsAiSettings.findMany({
      where: { category },
      orderBy: { key: 'asc' }
    });
    await cache.set(cacheKey, settings);
    return settings;
  }

  async get(key) {
    const setting = await prisma.cmsAiSettings.findUnique({ where: { key } });
    return setting?.value || null;
  }

  async set(key, value, category = 'general', description = '') {
    const setting = await prisma.cmsAiSettings.upsert({
      where: { key },
      create: { key, value, category: category || 'general', description },
      update: { value, category: category || 'general', description }
    });
    await cache.del('ai:settings');
    return setting;
  }

  async update(data) {
    const results = [];
    for (const [key, value] of Object.entries(data)) {
      if (key && value !== undefined) {
        const setting = await this.set(key, value);
        results.push(setting);
      }
    }
    await cache.del('ai:settings');
    return results;
  }

  async remove(key) {
    await prisma.cmsAiSettings.delete({ where: { key } });
    await cache.del('ai:settings');
    return { deleted: true };
  }

  async initializeDefaults() {
    const defaults = [
      { key: 'default_provider', value: 'gemini', category: 'provider', description: 'Default AI provider' },
      { key: 'default_model', value: 'gemini-1.5-pro', category: 'provider', description: 'Default AI model' },
      { key: 'max_tokens_per_request', value: 4096, category: 'limits', description: 'Maximum tokens per request' },
      { key: 'rate_limit_requests_per_minute', value: 60, category: 'limits', description: 'API rate limit' },
      { key: 'max_retries', value: 3, category: 'retry', description: 'Maximum retry attempts' },
      { key: 'retry_backoff_ms', value: 1000, category: 'retry', description: 'Retry backoff in milliseconds' },
      { key: 'streaming_enabled', value: true, category: 'features', description: 'Enable streaming by default' },
      { key: 'thinking_enabled', value: false, category: 'features', description: 'Enable thinking/reasoning mode' },
      { key: 'cache_ttl_seconds', value: 300, category: 'cache', description: 'AI cache TTL in seconds' },
      { key: 'log_level', value: 'INFO', category: 'logging', description: 'AI logging level' },
      { key: 'health_check_interval_minutes', value: 5, category: 'health', description: 'Provider health check interval' },
      { key: 'cost_tracking_enabled', value: true, category: 'cost', description: 'Enable cost tracking' },
      { key: 'usage_tracking_enabled', value: true, category: 'usage', description: 'Enable usage tracking' }
    ];
    for (const d of defaults) {
      try {
        await prisma.cmsAiSettings.upsert({
          where: { key: d.key },
          create: d,
          update: {}
        });
      } catch (e) { console.error('[AiSettingsService] upsert default setting failed:', e); }
    }
    await cache.del('ai:settings');
    return { initialized: true, count: defaults.length };
  }
}

module.exports = new AiSettingsService();
