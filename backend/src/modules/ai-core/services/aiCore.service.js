const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const eventBus = require('../utils/eventBus');
const queueManager = require('../queues/queueManager');
const providerService = require('./provider.service');
const promptService = require('./prompt.service');
const memoryService = require('./memory.service');
const { validateSchema } = require('../utils/validator');
const logger = require('../utils/logger');

// Define the 12 agents pipeline sequence
const PIPELINE_AGENTS = [
  { id: 'business-analysis', name: 'Business Analysis Agent', queue: 'business-queue', order: 1 },
  { id: 'website-planning', name: 'Website Planning Agent', queue: 'planning-queue', order: 2 },
  { id: 'website-blueprint', name: 'Website Blueprint Agent', queue: 'blueprint-queue', order: 3 },
  { id: 'website-standards', name: 'Website Standards Agent', queue: 'standards-queue', order: 4 },
  { id: 'content-structure', name: 'Content Structure Agent', queue: 'content-queue', order: 5 },
  { id: 'api-planning', name: 'API Planning Agent', queue: 'api-queue', order: 6 },
  { id: 'cms-configuration', name: 'CMS Configuration Agent', queue: 'cms-queue', order: 7 },
  { id: 'seo', name: 'SEO Agent', queue: 'seo-queue', order: 8 },
  { id: 'performance', name: 'Performance Agent', queue: 'performance-queue', order: 9 },
  { id: 'accessibility', name: 'Accessibility Agent', queue: 'accessibility-queue', order: 10 },
  { id: 'security', name: 'Security Agent', queue: 'security-queue', order: 11 },
  { id: 'validation', name: 'Validation Agent', queue: 'validation-queue', order: 12 }
];

class AICoreService {
  constructor() {
    this._initialized = false;
  }

  async initialize() {
    if (this._initialized) return;

    logger.info('Initializing AICoreService and registering pipeline agents...');

    // 1. Setup Prompt Templates in DB if missing
    for (const agent of PIPELINE_AGENTS) {
      let template = await prisma.promptTemplate.findFirst({ where: { name: `${agent.name} Template` } });
      if (!template) {
        template = await promptService.createPrompt(
          `${agent.name} Template`,
          `Analyze parameters: {{businessName}}, {{vertical}}. Output JSON conforming to target schemas.`,
          ['businessName', 'vertical']
        );
      }

      // Register agent configurations
      const dbAgent = await prisma.aIAgent.findFirst({ where: { id: agent.id } });
      if (!dbAgent) {
        await prisma.aIAgent.create({
          data: {
            id: agent.id,
            name: agent.name,
            description: `Agent conducting ${agent.name} specifications.`,
            providerId: 'gemini',
            model: 'gemini-1.5-pro',
            systemPrompt: `You are the ${agent.name}. Respond with valid JSON.`,
            temperature: 0.2,
            maxTokens: 2048,
            inputSchema: {},
            outputSchema: {},
            executionOrder: agent.order,
            retryPolicy: { maxRetries: 3, backoffMs: 50 },
            promptTemplateId: template.id
          }
        });
      }

      // 2. Register Worker function for each queue
      queueManager.registerWorker(agent.queue, async (jobData) => {
        return this._runAgentTask(agent.id, jobData);
      });
    }

    // 3. Register Event Handlers for pipeline transitions
    eventBus.on('AgentCompleted', async (event) => {
      const { sessionId, payload } = event;
      const { queueName, executionId, output } = payload;
      
      const completedAgent = PIPELINE_AGENTS.find(a => a.queue === queueName);
      if (!completedAgent) return;

      logger.info(`Handoff check: Agent '${completedAgent.id}' completed in Session ${sessionId}.`);

      // Save output payload as artifact
      const artifact = await memoryService.saveArtifact(sessionId, completedAgent.id, output);

      // Find next agent in order
      const nextAgent = PIPELINE_AGENTS.find(a => a.order === completedAgent.order + 1);
      if (nextAgent) {
        await this._startAgentExecution(sessionId, nextAgent, {
          parentArtifactId: artifact.id,
          accumulatedPayload: output
        });
      } else {
        // Pipeline completed! Update session status
        logger.info(`Orchestrator pipeline successfully finished for Session: ${sessionId}`);
        await prisma.aISession.update({
          where: { id: sessionId },
          data: { status: 'COMPLETED' }
        });
        eventBus.publish('SessionCompleted', sessionId, { finalArtifactId: artifact.id });
      }
    });

    eventBus.on('AgentFailed', async (event) => {
      const { sessionId } = event;
      logger.error(`Pipeline halted because of execution failures in Session: ${sessionId}`);
      await prisma.aISession.update({
        where: { id: sessionId },
        data: { status: 'FAILED' }
      });
      eventBus.publish('SessionFailed', sessionId, { error: 'Pipeline halted due to agent failure.' });
    });

    this._initialized = true;
  }

  async createSession(businessName, vertical) {
    await this.initialize();

    logger.info(`Creating new AI Session: ${businessName} (${vertical})`);

    const session = await prisma.aISession.create({
      data: {
        businessName,
        vertical,
        status: 'IN_PROGRESS'
      }
    });

    return session;
  }

  async executeSession(sessionId) {
    const session = await prisma.aISession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new Error(`Session with ID '${sessionId}' not found.`);
    }

    logger.info(`Starting execution pipeline for Session: ${sessionId}`);

    // Trigger the first agent (Business Analysis)
    const firstAgent = PIPELINE_AGENTS.find(a => a.order === 1);
    await this._startAgentExecution(sessionId, firstAgent, {
      businessName: session.businessName,
      vertical: session.vertical
    });
  }

  async getSessionStatus(sessionId) {
    const session = await prisma.aISession.findUnique({
      where: { id: sessionId },
      include: {
        executions: {
          include: { logs: true }
        }
      }
    });

    if (!session) {
      throw new Error(`Session with ID '${sessionId}' not found.`);
    }

    const completedCount = session.executions.filter(e => e.status === 'COMPLETED').length;
    const progressPercent = Math.round((completedCount / PIPELINE_AGENTS.length) * 100);

    // Get dynamic compliance score from validation agent output payload
    const validationExec = session.executions.find(e => e.agentId === 'validation' && e.status === 'COMPLETED');
    const score = validationExec?.outputPayload?.score ?? 0;
    const auditsPassed = validationExec?.outputPayload?.auditsPassed ?? 0;

    // Get dynamic blueprint JSON from blueprint agent output payload
    const blueprintExec = session.executions.find(e => e.agentId === 'website-blueprint' && e.status === 'COMPLETED');
    const compiledBlueprint = blueprintExec?.outputPayload ?? null;

    // Get dynamic list of artifacts from completed executions
    const artifacts = session.executions
      .filter(e => e.status === 'COMPLETED')
      .map(e => ({
        name: `${e.agentId}.json`,
        sizeBytes: e.outputPayload ? JSON.stringify(e.outputPayload).length : 0,
        createdByAgent: e.agentId,
        createdAt: e.updatedAt
      }));

    return {
      sessionId: session.id,
      businessName: session.businessName,
      vertical: session.vertical,
      status: session.status,
      totalCost: session.totalCost,
      totalTokens: session.totalTokens,
      progressPercent,
      completedSteps: completedCount,
      totalSteps: PIPELINE_AGENTS.length,
      executions: session.executions,
      score,
      auditsPassed,
      compiledBlueprint,
      artifacts
    };
  }

  async _startAgentExecution(sessionId, agentSpec, payload) {
    const agent = await prisma.aIAgent.findUnique({
      where: { id: agentSpec.id }
    });

    // Create execution record in DB
    const execution = await prisma.aIExecution.create({
      data: {
        sessionId,
        agentId: agentSpec.id,
        status: 'PENDING',
        inputPayload: payload
      }
    });

    // Enqueue job using QueueManager
    await queueManager.enqueue(agentSpec.queue, {
      sessionId,
      executionId: execution.id,
      agentId: agentSpec.id,
      payload,
      retryPolicy: agent.retryPolicy
    });
  }

  async _runAgentTask(agentId, jobData) {
    const { sessionId, executionId, payload } = jobData;

    const agent = await prisma.aIAgent.findUnique({
      where: { id: agentId },
      include: { promptTemplate: true }
    });

    // Compile variables
    const variables = {
      businessName: payload.businessName || 'Mock Business',
      vertical: payload.vertical || 'Boutique'
    };

    const compiledUserPrompt = await promptService.compilePrompt(agent.promptTemplateId, variables);
    const systemPrompt = agent.systemPrompt;

    // Generate output with real-time SSE stream chunk publishing
    const output = await providerService.stream(systemPrompt, compiledUserPrompt, (chunk) => {
      eventBus.publish('AgentStreamChunk', sessionId, { agentId, chunk });
    }, agent.providerId);
    
    // Estimate cost & tokens
    const inputTokens = await providerService.countTokens(compiledUserPrompt, agent.providerId);
    const outputTokens = await providerService.countTokens(output, agent.providerId);
    const cost = await providerService.estimateCost({ input: inputTokens, output: outputTokens }, agent.providerId);

    // Update execution aggregates
    await prisma.aIExecution.update({
      where: { id: executionId },
      data: {
        tokensUsed: inputTokens + outputTokens
      }
    });

    // Update global session cost/token tallies
    await prisma.aISession.update({
      where: { id: sessionId },
      data: {
        totalCost: { increment: cost },
        totalTokens: { increment: inputTokens + outputTokens }
      }
    });

    // Validate schema
    let parsedJson = {};
    try {
      parsedJson = JSON.parse(output);
    } catch (e) {
      throw new Error(`AI generated response is not valid JSON: ${output}`);
    }

    const validation = validateSchema(parsedJson, agent.outputSchema);
    if (!validation.valid) {
      throw new Error(`AI output validation failed: ${validation.errors.join(', ')}`);
    }

    return parsedJson;
  }
}

module.exports = new AICoreService();
