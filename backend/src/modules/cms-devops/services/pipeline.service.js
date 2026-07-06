const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');
const cache = require('../middleware/devops-cache');

async function getPipelines() {
  const cacheKey = 'pipelines';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [definitions, executions] = await Promise.all([
    prisma.workflowDefinition.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.workflowExecution.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
  ]);

  const result = { definitions, executions };
  await cache.set(cacheKey, result, 120);
  return result;
}

async function launchPipeline(definitionId) {
  const existing = await prisma.workflowExecution.create({
    data: { definitionId, status: 'PENDING', startedAt: new Date() }
  });

  try { eventBus.emit(Events.DEVOPS_PIPELINE_STARTED, { pipelineId: existing.id, definitionId }); } catch (e) { console.error('[DevOps] pipeline.service eventBus error:', e); }

  await cache.delPattern('*');
  return existing;
}

async function pausePipeline(executionId) {
  const updated = await prisma.workflowExecution.update({
    where: { id: executionId },
    data: { status: 'PAUSED' }
  });
  await cache.delPattern('*');
  return updated;
}

async function resumePipeline(executionId) {
  const updated = await prisma.workflowExecution.update({
    where: { id: executionId },
    data: { status: 'RUNNING' }
  });
  await cache.delPattern('*');
  return updated;
}

async function cancelPipeline(executionId) {
  const updated = await prisma.workflowExecution.update({
    where: { id: executionId },
    data: { status: 'CANCELLED', completedAt: new Date() }
  });

  try { eventBus.emit(Events.DEVOPS_PIPELINE_FAILED, { pipelineId: executionId, reason: 'CANCELLED' }); } catch (e) { console.error('[DevOps] pipeline.service eventBus error:', e); }

  await cache.delPattern('*');
  return updated;
}

module.exports = { getPipelines, launchPipeline, pausePipeline, resumePipeline, cancelPipeline };
