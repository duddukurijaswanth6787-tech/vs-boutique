const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadService = require('../services/upload.service');
const { protect } = require('../../../middleware/authMiddleware');

const tempUploadDir = path.join(__dirname, '../../../../temp-uploads');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.zip') {
      return cb(new Error('Only ZIP archives are allowed.'));
    }
    cb(null, true);
  }
});

const prisma = require('../../../utils/prisma');

async function resolveBusinessId(req) {
  let businessId = req.user?.businessId;
  if (!businessId) {
    businessId = req.query.businessId || req.body.businessId;
  }
  if (!businessId) {
    const firstBiz = await prisma.business.findFirst({ select: { id: true } });
    if (firstBiz) {
      businessId = firstBiz.id;
    }
  }
  return businessId;
}

router.get('/', protect, async (req, res) => {
  try {
    const businessId = await resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID required.' });
    }
    const uploads = await uploadService.listUploads(businessId);
    res.json({ success: true, uploads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const businessId = await resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID required.' });
    }
    const uploadTask = await uploadService.getUploadStatus(req.params.id, businessId);
    if (!uploadTask) {
      return res.status(404).json({ success: false, message: 'Upload task not found.' });
    }
    res.json({ success: true, upload: uploadTask });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const businessId = await resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID required.' });
    }
    const { blueprintId } = req.body;
    const task = await uploadService.handleUpload(req.file, req.user.id, blueprintId, businessId);
    res.status(202).json({ success: true, upload: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
