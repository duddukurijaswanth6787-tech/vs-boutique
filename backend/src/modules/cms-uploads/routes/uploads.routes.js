const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadService = require('../services/upload.service');
const { protect } = require('../../../middleware/authMiddleware');

const tempUploadDir = path.join(__dirname, '../../../../node_modules/.metadata-uploads/temp');
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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.zip') {
      return cb(new Error('Only ZIP archives are allowed.'));
    }
    cb(null, true);
  }
});

/**
 * @route   GET /api/v1/cms/projects/uploads
 * @desc    List all upload tasks
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const uploads = await uploadService.listUploads();
    res.json({ success: true, uploads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   GET /api/v1/cms/projects/uploads/:id
 * @desc    Get upload task status
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const uploadTask = await uploadService.getUploadStatus(req.params.id);
    if (!uploadTask) {
      return res.status(404).json({ success: false, message: 'Upload task not found.' });
    }
    res.json({ success: true, upload: uploadTask });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   POST /api/v1/cms/projects/upload
 * @desc    Upload codebase ZIP archive
 * @access  Private
 */
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const { blueprintId } = req.body;
    const task = await uploadService.handleUpload(req.file, req.user.id, blueprintId);
    res.status(202).json({ success: true, upload: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
