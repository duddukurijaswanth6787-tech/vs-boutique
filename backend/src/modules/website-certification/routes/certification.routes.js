const express = require('express');
const router = express.Router();
const prisma = require('../../../utils/prisma');
const { protect } = require('../../../middleware/authMiddleware');
const certificationService = require('../services/certification.service');

async function getBusinessContext(req) {
  const orConditions = [];
  if (req.user?.id) {
    orConditions.push({ ownerId: req.user.id });
  }
  if (req.user?.assignedBoutiqueId) {
    orConditions.push({ id: req.user.assignedBoutiqueId });
  }

  let boutique = null;
  if (orConditions.length > 0) {
    boutique = await prisma.boutique.findFirst({
      where: { OR: orConditions }
    });
  }

  // Fallback to first boutique for global platform admins
  if (!boutique) {
    boutique = await prisma.boutique.findFirst({
      where: { isDeleted: false }
    });
  }

  if (!boutique || !boutique.businessId) {
    throw new Error('No active Boutique/Business context found.');
  }
  return { businessId: boutique.businessId, boutiqueId: boutique.id };
}

// 1. Trigger Audit
router.post('/audit', protect, async (req, res) => {
  const { releaseTag, targetType } = req.body;
  if (!releaseTag) {
    return res.status(400).json({ success: false, message: 'releaseTag is required.' });
  }

  try {
    const { businessId, boutiqueId } = await getBusinessContext(req);
    const workflow = await certificationService.runAudit(businessId, releaseTag, targetType || 'WEBSITE', boutiqueId);
    
    res.status(202).json({
      success: true,
      message: 'Quality Assurance certification audit launched successfully.',
      workflowId: workflow.id,
      status: 'RUNNING'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Fetch Active Progress Status
router.get('/status/:releaseTag', protect, async (req, res) => {
  const { releaseTag } = req.params;
  try {
    const { businessId } = await getBusinessContext(req);
    const workflow = await prisma.certificationWorkflow.findFirst({
      where: { businessId, releaseTag },
      orderBy: { createdAt: 'desc' }
    });

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'No certification workflow running for this release.' });
    }

    res.json({
      success: true,
      status: workflow.status,
      progress: workflow.progress,
      currentStage: workflow.currentStage
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Fetch Report
router.get('/report/:releaseTag', protect, async (req, res) => {
  const { releaseTag } = req.params;
  try {
    const { businessId } = await getBusinessContext(req);
    const report = await prisma.boutiqueCertification.findFirst({
      where: { businessId, releaseTag },
      orderBy: { createdAt: 'desc' },
      include: { profile: true }
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'No certification report found for this release.' });
    }

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Fetch History Logs for Trend Charts
router.get('/history', protect, async (req, res) => {
  try {
    const { businessId } = await getBusinessContext(req);
    const certifications = await prisma.boutiqueCertification.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json({ success: true, certifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Fetch Auto-Fix Queue
router.get('/autofix/queue', protect, async (req, res) => {
  try {
    const { businessId } = await getBusinessContext(req);
    const queue = await prisma.autoFixQueueItem.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, queue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Apply Approved Auto-Fix
router.post('/autofix', protect, async (req, res) => {
  const { queueItemId } = req.body;
  if (!queueItemId) {
    return res.status(400).json({ success: false, message: 'queueItemId is required.' });
  }

  try {
    const result = await certificationService.applyAutoFix(queueItemId, req.user?.id || 'admin');
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Rollback Applied Auto-Fix
router.post('/autofix/rollback', protect, async (req, res) => {
  const { queueItemId } = req.body;
  if (!queueItemId) {
    return res.status(400).json({ success: false, message: 'queueItemId is required.' });
  }

  try {
    const result = await certificationService.rollbackAutoFix(queueItemId, req.user?.id || 'admin');
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Interactive QA Conversational Chat
router.post('/chat', protect, async (req, res) => {
  const { certificationId, message } = req.body;
  if (!certificationId || !message) {
    return res.status(400).json({ success: false, message: 'certificationId and message are required.' });
  }

  try {
    const reply = await certificationService.askChatbot(certificationId, message);
    res.json({ success: true, reply });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. SSE EventSource Logs Stream
router.get('/stream/:releaseTag', async (req, res) => {
  const { releaseTag } = req.params;
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'SSE requires a valid token.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive'
  });

  const logChannel = `log:${releaseTag}`;
  const onLog = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  certificationService.logEmitter.on(logChannel, onLog);

  // Send connected ping
  res.write(`data: ${JSON.stringify({ stage: 'initial', message: 'Connected to QA Certification Log Stream.', progress: 5 })}\n\n`);

  req.on('close', () => {
    certificationService.logEmitter.removeListener(logChannel, onLog);
    res.end();
  });
});

module.exports = router;
