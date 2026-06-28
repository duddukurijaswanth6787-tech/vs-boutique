const express = require('express');
const router = express.Router();
const aiCoreService = require('../services/aiCore.service');
const providerService = require('../services/provider.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { protect } = require('../../../middleware/authMiddleware');

// 1. Trigger AI requirement session creation
router.post('/session', protect, async (req, res) => {
  const { businessName, vertical } = req.body;
  if (!businessName || !vertical) {
    return res.status(400).json({ success: false, message: 'businessName and vertical are required.' });
  }

  try {
    const session = await aiCoreService.createSession(businessName, vertical);
    // Execute asynchronously
    aiCoreService.executeSession(session.id).catch(err => {
      console.error(`Session execution failed for ${session.id}:`, err);
    });

    res.status(202).json({
      success: true,
      sessionId: session.id,
      status: 'IN_PROGRESS',
      message: 'AI requirement orchestration session launched successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Query session completion status and telemetry metrics
router.get('/session/:sessionId', protect, async (req, res) => {
  const { sessionId } = req.params;
  try {
    const status = await aiCoreService.getSessionStatus(sessionId);
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// 3. Fetch execution logs for the terminal console
router.get('/session/:sessionId/logs', protect, async (req, res) => {
  const { sessionId } = req.params;
  try {
    const logs = await prisma.aIExecutionLog.findMany({
      where: {
        execution: { sessionId }
      },
      orderBy: { timestamp: 'asc' }
    });
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Human Approval Workflow: Approve and publish blueprint draft
router.post('/session/:sessionId/approve', protect, async (req, res) => {
  const { sessionId } = req.params;
  const { decision, feedback } = req.body; // decision: 'Approved' | 'Rejected'
  
  try {
    const session = await prisma.aISession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    // Find the final artifact created in this session (usually by the validation agent)
    const finalArtifact = await prisma.aIArtifact.findFirst({
      where: {
        createdByAgent: 'validation'
      },
      orderBy: { createdAt: 'desc' }
    });

    // Create approval records
    const approval = await prisma.approvalRequest.create({
      data: {
        targetType: 'Blueprint',
        targetId: sessionId,
        status: decision === 'Approved' ? 'APPROVED' : 'REJECTED',
        requesterId: req.user?.id || 'admin-id',
        history: {
          create: {
            decision,
            comments: feedback || 'Decision submitted by admin',
            reviewerId: req.user?.id || 'admin-id'
          }
        }
      }
    });

    res.json({
      success: true,
      approvalId: approval.id,
      status: approval.status,
      message: `Session has been marked as ${approval.status}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Providers health check validation
router.get('/health', protect, async (req, res) => {
  const providerName = req.query.provider || 'gemini';
  try {
    const health = await providerService.validateConnection(providerName);
    res.json({ success: true, provider: providerName, ...health });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. SSE Stream endpoint for real-time progress & log updates
router.get('/session/:sessionId/stream', async (req, res) => {
  const { sessionId } = req.params;
  const token = req.query.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null);
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized. SSE stream requires a valid token.' });
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive'
  });

  const eventBus = require('../utils/eventBus');

  const onChunk = (eventSessionId, data) => {
    if (eventSessionId === sessionId) {
      res.write(`event: chunk\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  const onStarted = (eventSessionId, data) => {
    if (eventSessionId === sessionId) {
      res.write(`event: started\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  const onCompleted = (eventSessionId, data) => {
    if (eventSessionId === sessionId) {
      res.write(`event: completed\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  const onSessionCompleted = (eventSessionId, data) => {
    if (eventSessionId === sessionId) {
      res.write(`event: sessionCompleted\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  // Bind event listeners
  eventBus.on('AgentStreamChunk', onChunk);
  eventBus.on('AgentStarted', onStarted);
  eventBus.on('AgentCompleted', onCompleted);
  eventBus.on('SessionCompleted', onSessionCompleted);

  // Send initial ping/connection check
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to AI Orchestration Stream.' })}\n\n`);

  req.on('close', () => {
    eventBus.removeListener('AgentStreamChunk', onChunk);
    eventBus.removeListener('AgentStarted', onStarted);
    eventBus.removeListener('AgentCompleted', onCompleted);
    eventBus.removeListener('SessionCompleted', onSessionCompleted);
    res.end();
  });
});

module.exports = router;
