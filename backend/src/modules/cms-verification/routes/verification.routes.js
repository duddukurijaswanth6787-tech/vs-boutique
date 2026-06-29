const express = require('express');
const router = express.Router();
const verificationService = require('../services/verification.service');
const { protect } = require('../../../middleware/authMiddleware');

/**
 * @route   POST /api/v1/cms/projects/verify
 * @desc    Verify codebase sandbox structure against blueprint manifest
 * @access  Private
 */
router.post('/verify', protect, async (req, res) => {
  try {
    const { uploadId } = req.body;
    if (!uploadId) {
      return res.status(400).json({ success: false, message: 'Upload task ID is required.' });
    }
    const report = await verificationService.verifyUpload(uploadId, req.user.id);
    res.json({ success: true, report });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
