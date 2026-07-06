const prisma = require('../../../utils/prisma');
const cache = require('../middleware/ai-center-cache');
const eventBus = require('../../../services/eventBus').eventBus;

class AiAgentService {
  async list(filters = {}) {
    const cacheKey = `ai:agents:list:${JSON.stringify(filters)}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const where = {};
    if (filters.category) where.category = filters.category;
    if (filters.source) where.source = filters.source;
    if (filters.isEnabled !== undefined) where.isEnabled = filters.isEnabled === 'true';

    const agents = await prisma.cmsAiAgent.findMany({
      where,
      include: { provider: { select: { id: true, name: true, provider: true, healthStatus: true } } },
      orderBy: [{ category: 'asc' }, { executionOrder: 'asc' }]
    });

    await cache.set(cacheKey, agents);
    return agents;
  }

  async get(id) {
    const cacheKey = `ai:agents:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const agent = await prisma.cmsAiAgent.findUnique({
      where: { id },
      include: { provider: { select: { id: true, name: true, provider: true, healthStatus: true, model: true } } }
    });
    if (agent) await cache.set(cacheKey, agent);
    return agent;
  }

  async update(id, data) {
    const agent = await prisma.cmsAiAgent.update({ where: { id }, data });
    await cache.del('ai:agents:*');
    return this.get(agent.id);
  }

  async remove(id) {
    await prisma.cmsAiAgent.delete({ where: { id } });
    await cache.del('ai:agents:*');
    return { deleted: true };
  }

  async register(data) {
    const existing = await prisma.cmsAiAgent.findUnique({ where: { key: data.key } });
    if (existing) return this.update(existing.id, data);
    const agent = await prisma.cmsAiAgent.create({ data });
    await cache.del('ai:agents:*');
    return this.get(agent.id);
  }

  async syncFromSources() {
    const results = { synced: 0, failed: 0, sources: [] };

    const pipelineAgents = await prisma.aIAgent.findMany().catch(() => []);
    for (const a of pipelineAgents) {
      try {
        await this.register({
          key: a.id,
          name: a.name,
          description: `${a.description} (Pipeline Agent)`,
          category: 'pipeline',
          source: 'ai-core',
          sourceId: a.id,
          model: a.model,
          systemPrompt: a.systemPrompt,
          isEnabled: a.enabled,
          executionOrder: a.executionOrder,
          timeout: a.timeout,
          retryPolicy: a.retryPolicy || {},
          metadata: { providerId: a.providerId, promptTemplateId: a.promptTemplateId }
        });
        results.synced++;
      } catch { results.failed++; }
    }
    results.sources.push({ name: 'Pipeline Agents (ai-core)', count: pipelineAgents.length });

    const certAgents = await prisma.qAAgentRegistry.findMany().catch(() => []);
    for (const a of certAgents) {
      try {
        await this.register({
          key: a.agentKey,
          name: a.name,
          description: `Certification agent for ${a.category}`,
          category: 'certification',
          source: 'certification',
          sourceId: a.id,
          isEnabled: a.isEnabled,
          executionOrder: a.executionOrder,
          timeout: a.timeoutMs,
          metadata: { category: a.category, version: a.version, configuration: a.configuration }
        });
        results.synced++;
      } catch { results.failed++; }
    }
    results.sources.push({ name: 'Certification Agents', count: certAgents.length });

    const workflowAgents = await prisma.aIAgentRegistry.findMany().catch(() => []);
    for (const a of workflowAgents) {
      try {
        await this.register({
          key: a.name.toLowerCase().replace(/\s+/g, '-'),
          name: a.name,
          description: `Workflow agent: ${a.role}`,
          category: 'workflow',
          source: 'ai-core',
          sourceId: a.id,
          isEnabled: true,
          executionOrder: 0,
          timeout: a.timeoutMs,
          retryPolicy: a.retryPolicy || {},
          metadata: { role: a.role, dependencies: a.dependencies, estimatedCost: a.estimatedCost, estimatedTokens: a.estimatedTokens }
        });
        results.synced++;
      } catch { results.failed++; }
    }
    results.sources.push({ name: 'Workflow Agents (ai-agent-registry)', count: workflowAgents.length });

    await cache.del('ai:agents:*');
    return results;
  }

  async getSourcesSummary() {
    const [pipelineCount, certCount, workflowCount] = await Promise.all([
      prisma.aIAgent.count().catch(() => 0),
      prisma.qAAgentRegistry.count().catch(() => 0),
      prisma.aIAgentRegistry.count().catch(() => 0)
    ]);
    return {
      pipeline: { count: pipelineCount, source: 'ai-core', type: '12-step pipeline' },
      certification: { count: certCount, source: 'certification', type: 'QA agents' },
      workflow: { count: workflowCount, source: 'ai-core', type: 'workflow agents' },
      registered: await prisma.cmsAiAgent.count()
    };
  }

  async testAgent(id) {
    const agent = await prisma.cmsAiAgent.findUnique({ where: { id }, include: { provider: true } });
    if (!agent) throw new Error('Agent not found');
    if (!agent.provider) return { healthy: false, message: 'No provider assigned' };

    const providerService = require('../../ai-core/services/provider.service');
    const health = await providerService.validateConnection(agent.provider.provider);
    const isHealthy = health.status === 'Healthy';

    await prisma.cmsAiAgent.update({
      where: { id },
      data: { healthStatus: isHealthy ? 'healthy' : 'offline' }
    });

    if (isHealthy) eventBus.emit('ai:agent:started', { agentId: id, agentName: agent.name });
    await cache.del('ai:agents:*');
    return { healthy: isHealthy, message: health.message, agent: agent.name };
  }
}

module.exports = new AiAgentService();
