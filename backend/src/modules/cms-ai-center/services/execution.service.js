const prisma = require('../../../utils/prisma');
const cache = require('../middleware/ai-center-cache');
const eventBus = require('../../../services/eventBus').eventBus;

class AiExecutionService {
  async list(filters = {}) {
    const { page = 1, limit = 20, status, agentKey, sessionId } = filters;
    const cacheKey = `ai:executions:list:${page}:${limit}:${status || ''}:${agentKey || ''}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const where = {};
    if (status) where.status = status;
    if (agentKey) where.agentId = agentKey;
    if (sessionId) where.sessionId = sessionId;

    const [executions, total] = await Promise.all([
      prisma.aIExecution.findMany({
        where,
        include: {
          session: { select: { id: true, businessName: true, status: true } },
          logs: { orderBy: { timestamp: 'desc' }, take: 1, select: { message: true, level: true, timestamp: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.aIExecution.count({ where })
    ]);

    const steps = await prisma.cmsAiExecutionStep.findMany({
      where: { executionId: { in: executions.map(e => e.id) } },
      orderBy: { createdAt: 'asc' }
    });
    const stepsMap = {};
    steps.forEach(s => { if (!stepsMap[s.executionId]) stepsMap[s.executionId] = []; stepsMap[s.executionId].push(s); });

    const result = {
      executions: executions.map(e => ({
        id: e.id,
        sessionId: e.sessionId,
        session: e.session,
        agentKey: e.agentId,
        status: e.status,
        inputPayload: e.inputPayload,
        outputPayload: e.outputPayload,
        tokensUsed: e.tokensUsed,
        latencyMs: e.latencyMs,
        retryCount: e.retryCount,
        lastLog: e.logs?.[0] || null,
        steps: stepsMap[e.id] || [],
        createdAt: e.createdAt,
        updatedAt: e.updatedAt
      })),
      total, page, limit, totalPages: Math.ceil(total / limit)
    };

    await cache.set(cacheKey, result);
    return result;
  }

  async get(id) {
    const cacheKey = `ai:executions:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const execution = await prisma.aIExecution.findUnique({
      where: { id },
      include: {
        session: true,
        logs: { orderBy: { timestamp: 'asc' } }
      }
    });
    if (!execution) return null;

    const steps = await prisma.cmsAiExecutionStep.findMany({
      where: { executionId: id },
      orderBy: { createdAt: 'asc' }
    });

    const result = { ...execution, steps };
    await cache.set(cacheKey, result);
    return result;
  }

  async getLogs(id) {
    return prisma.aIExecutionLog.findMany({
      where: { executionId: id },
      orderBy: { timestamp: 'asc' }
    });
  }

  async getSteps(id) {
    return prisma.cmsAiExecutionStep.findMany({
      where: { executionId: id },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getSessions(filters = {}) {
    const { page = 1, limit = 20, status } = filters;
    const where = {};
    if (status) where.status = status;

    const [sessions, total] = await Promise.all([
      prisma.aISession.findMany({
        where,
        include: { _count: { select: { executions: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.aISession.count({ where })
    ]);
    return { sessions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async recordStep(data) {
    return prisma.cmsAiExecutionStep.create({ data });
  }

  async updateStep(id, data) {
    return prisma.cmsAiExecutionStep.update({ where: { id }, data });
  }
}

module.exports = new AiExecutionService();
