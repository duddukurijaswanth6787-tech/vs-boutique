const prisma = require('../../../utils/prisma');
const cache = require('../middleware/ai-center-cache');
const encryption = require('./encryption.service');
const eventBus = require('../../../services/eventBus').eventBus;
const aiCoreProvider = require('../../ai-core/services/provider.service');

const MASKED_KEY = '••••••••••••••••';

class AiProviderService {
  async list() {
    const cached = await cache.get('ai:providers:list');
    if (cached) return cached;
    const providers = await prisma.cmsAiProvider.findMany({
      orderBy: [{ priority: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { agents: true } } }
    });
    const result = providers.map(p => ({
      ...p,
      apiKey: p.apiKey ? MASKED_KEY : null
    }));
    await cache.set('ai:providers:list', result);
    return result;
  }

  async get(id) {
    const cacheKey = `ai:providers:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    const provider = await prisma.cmsAiProvider.findUnique({
      where: { id },
      include: { _count: { select: { agents: true } } }
    });
    if (!provider) return null;
    const result = { ...provider, apiKey: provider.apiKey ? MASKED_KEY : null };
    await cache.set(cacheKey, result);
    return result;
  }

  async create(data) {
    const encrypted = encryption.encrypt(data.apiKey);
    const provider = await prisma.cmsAiProvider.create({
      data: {
        name: data.name,
        key: data.key,
        provider: data.provider,
        model: data.model || 'gemini-1.5-pro',
        baseUrl: data.baseUrl,
        apiKey: encrypted,
        temperature: data.temperature ?? 0.7,
        maxTokens: data.maxTokens ?? 4096,
        supportsStreaming: data.supportsStreaming ?? true,
        supportsThinking: data.supportsThinking ?? false,
        isEnabled: data.isEnabled ?? true,
        priority: data.priority ?? 0,
        costPerMillionTokens: data.costPerMillionTokens || {},
        rateLimit: data.rateLimit || {},
        retryPolicy: data.retryPolicy || { maxRetries: 3, backoffMs: 1000 },
        timeout: data.timeout ?? 30000
      }
    });
    await cache.del('ai:providers:*');
    return this.get(provider.id);
  }

  async update(id, data) {
    const existing = await prisma.cmsAiProvider.findUnique({ where: { id } });
    if (!existing) throw new Error('Provider not found');
    const updateData = { ...data };
    if (data.apiKey && data.apiKey !== MASKED_KEY) {
      updateData.apiKey = encryption.encrypt(data.apiKey);
    } else {
      delete updateData.apiKey;
    }
    delete updateData.agents;
    const provider = await prisma.cmsAiProvider.update({ where: { id }, data: updateData });
    await cache.del('ai:providers:*');
    return this.get(provider.id);
  }

  async remove(id) {
    await prisma.cmsAiProvider.delete({ where: { id } });
    await cache.del('ai:providers:*');
    return { deleted: true };
  }

  async testConnection(id) {
    const provider = await prisma.cmsAiProvider.findUnique({ where: { id } });
    if (!provider) throw new Error('Provider not found');
    const apiKey = encryption.decrypt(provider.apiKey);
    const health = await aiCoreProvider.validateConnection(provider.provider);
    const isHealthy = health.status === 'Healthy';
    await prisma.cmsAiProvider.update({
      where: { id },
      data: {
        healthStatus: isHealthy ? 'healthy' : 'offline',
        lastHealthCheck: new Date(),
        healthMessage: health.message
      }
    });
    if (!isHealthy) eventBus.emit('ai:provider:offline', { providerId: id, providerName: provider.name, message: health.message });
    else eventBus.emit('ai:provider:online', { providerId: id, providerName: provider.name });
    await cache.del('ai:providers:*');
    await cache.del('ai:health:*');
    return { healthy: isHealthy, message: health.message, provider: provider.name };
  }

  async checkAll() {
    const providers = await prisma.cmsAiProvider.findMany({ where: { isEnabled: true } });
    const results = [];
    for (const p of providers) {
      try {
        const apiKey = encryption.decrypt(p.apiKey);
        const health = await aiCoreProvider.validateConnection(p.provider);
        const isHealthy = health.status === 'Healthy';
        if (!isHealthy && p.healthStatus !== 'offline') {
          eventBus.emit('ai:provider:offline', { providerId: p.id, providerName: p.name, message: health.message });
        } else if (isHealthy && p.healthStatus !== 'healthy') {
          eventBus.emit('ai:provider:online', { providerId: p.id, providerName: p.name });
        }
        await prisma.cmsAiProvider.update({
          where: { id: p.id },
          data: { healthStatus: isHealthy ? 'healthy' : 'offline', lastHealthCheck: new Date(), healthMessage: health.message }
        });
        results.push({ id: p.id, name: p.name, healthy: isHealthy, message: health.message });
      } catch {
        await prisma.cmsAiProvider.update({
          where: { id: p.id },
          data: { healthStatus: 'offline', lastHealthCheck: new Date(), healthMessage: 'Connection check failed' }
        });
        results.push({ id: p.id, name: p.name, healthy: false, message: 'Connection check failed' });
      }
    }
    await cache.del('ai:providers:*');
    await cache.del('ai:health:*');
    return results;
  }

  async getFallbackChain() {
    const providers = await prisma.cmsAiProvider.findMany({
      where: { isEnabled: true },
      orderBy: [{ priority: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, key: true, provider: true, model: true, healthStatus: true, priority: true }
    });
    return providers.map(p => ({ ...p, apiKey: MASKED_KEY }));
  }
}

module.exports = new AiProviderService();
