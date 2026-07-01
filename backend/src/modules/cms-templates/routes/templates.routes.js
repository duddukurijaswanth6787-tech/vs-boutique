const express = require('express');
const router = express.Router();
const templatesService = require('../services/templates.service');
const templateStorage = require('../services/template-storage.service');
const { protect, authorize } = require('../../../middleware/authMiddleware');
const { cache, invalidateCache } = require('../middleware/cache');
const { checkTierAccess, checkTemplateTierFromParam } = require('../middleware/tierAccess');
const manifestSchema = require('../validators/manifest.schema.json');

const superAdminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'super-admin' || req.user.role === 'super_admin')) return next();
  return res.status(403).json({ success: false, message: 'Forbidden. Super Admin access required.' });
};

// ==========================================
// MANIFEST VALIDATION
// ==========================================

function validateManifest(req, res, next) {
  const manifest = req.body?.manifest;
  if (!manifest) return next();

  const { pages, components, apis, databaseModels } = manifest;
  if (!Array.isArray(pages)) return res.status(400).json({ success: false, message: 'manifest.pages must be a non-empty array' });
  if (!Array.isArray(components)) return res.status(400).json({ success: false, message: 'manifest.components must be a non-empty array' });
  if (apis !== undefined && !Array.isArray(apis)) return res.status(400).json({ success: false, message: 'manifest.apis must be an array' });
  if (databaseModels !== undefined && !Array.isArray(databaseModels)) return res.status(400).json({ success: false, message: 'manifest.databaseModels must be an array' });
  if (manifest.sdkVersion && !/^\d+\.\d+\.\d+$/.test(manifest.sdkVersion)) {
    return res.status(400).json({ success: false, message: 'manifest.sdkVersion must be semver format (x.y.z)' });
  }

  const allowedKeys = Object.keys(manifestSchema.properties);
  const extraKeys = Object.keys(manifest).filter(k => !allowedKeys.includes(k));
  if (extraKeys.length > 0) {
    return res.status(400).json({ success: false, message: `Unknown manifest keys: ${extraKeys.join(', ')}` });
  }

  next();
}

// ==========================================
// LOCAL FILE SERVING
// ==========================================

router.get('/storage/*', async (req, res) => {
  await templateStorage.serveLocalFile(req, res);
});

// ==========================================
// ASSET UPLOAD
// ==========================================

const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/:id/upload/:field', protect, superAdminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

    const allowedFields = ['thumbnail', 'previewImage', 'previewVideo', 'zipArtifact', 'manifestUrl'];
    if (!allowedFields.includes(req.params.field)) {
      return res.status(400).json({ success: false, message: `Invalid field. Allowed: ${allowedFields.join(', ')}` });
    }

    const result = await templateStorage.uploadAsset(req.params.id, req.params.field, req.file, req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// CATEGORIES
// ==========================================

router.get('/categories', protect, cache(600), async (req, res) => {
  try {
    const categories = await templatesService.listCategories();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/categories', protect, superAdminOnly, async (req, res) => {
  try {
    const category = await templatesService.createCategory(req.body);
    await invalidateCache('template:*/categories*');
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// TAGS
// ==========================================

router.get('/tags', protect, cache(600), async (req, res) => {
  try {
    const tags = await templatesService.listTags();
    res.json({ success: true, tags });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/tags', protect, superAdminOnly, async (req, res) => {
  try {
    const tag = await templatesService.createTag(req.body);
    await invalidateCache('template:*/tags*');
    res.status(201).json({ success: true, tag });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// FAVORITES
// ==========================================

router.get('/favorites', protect, async (req, res) => {
  try {
    const result = await templatesService.listFavorites(req.user.id, {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 20, 100)
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// COLLECTIONS / LISTS
// ==========================================

router.get('/featured', protect, cache(300), async (req, res) => {
  try {
    const templates = await templatesService.getFeatured({
      limit: Math.min(parseInt(req.query.limit) || 10, 50)
    });
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/latest', protect, cache(300), async (req, res) => {
  try {
    const templates = await templatesService.getLatest({
      limit: Math.min(parseInt(req.query.limit) || 10, 50)
    });
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/popular', protect, cache(300), async (req, res) => {
  try {
    const templates = await templatesService.getPopular({
      limit: Math.min(parseInt(req.query.limit) || 10, 50)
    });
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/tier/:tier', protect, cache(300), async (req, res) => {
  try {
    const result = await templatesService.getByTier(req.params.tier, {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 20, 100)
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// ANALYTICS
// ==========================================

router.get('/analytics', protect, async (req, res) => {
  try {
    const analytics = await templatesService.getAnalytics({
      templateId: req.query.templateId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    });
    res.json({ success: true, ...analytics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// STATS
// ==========================================

router.get('/stats', protect, superAdminOnly, cache(600), async (req, res) => {
  try {
    const stats = await templatesService.getStats();
    res.json({ success: true, ...stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// IMPORT
// ==========================================

router.post('/import', protect, superAdminOnly, validateManifest, async (req, res) => {
  try {
    const template = await templatesService.importTemplate(req.body, req.user.id);
    res.status(201).json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// EXPORT
// ==========================================

router.get('/:id/export', protect, async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const exported = await templatesService.exportTemplate(req.params.id, format);
    if (!exported) return res.status(404).json({ success: false, message: 'Template not found' });
    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown');
      return res.send(exported);
    }
    res.json({ success: true, template: exported });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// PIPELINE
// ==========================================

router.get('/:id/pipeline', protect, async (req, res) => {
  try {
    const pipeline = await templatesService.getPipelineStatus(req.params.id);
    res.json({ success: true, pipeline });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/pipeline', protect, superAdminOnly, async (req, res) => {
  try {
    const stage = await templatesService.advancePipeline(req.params.id, req.body.stage, req.body, req.user.id);
    if (!stage) return res.status(404).json({ success: false, message: 'Template not found' });
    res.status(201).json({ success: true, stage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// BUSINESS ASSIGNMENTS
// ==========================================

router.get('/assignments/:businessId', protect, async (req, res) => {
  try {
    const assignments = await templatesService.getBusinessAssignments(req.params.businessId);
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/assign', protect, superAdminOnly, async (req, res) => {
  try {
    const assignment = await templatesService.assignToBusiness(req.params.id, req.body.businessId, req.body, req.user.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Template not found' });
    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/unassign', protect, superAdminOnly, async (req, res) => {
  try {
    const result = await templatesService.unassignFromBusiness(req.params.id, req.body.businessId, req.user.id);
    res.json({ success: true, removed: result.count > 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// TEMPLATE CRUD
// ==========================================

router.get('/', protect, cache(300), async (req, res) => {
  try {
    const result = await templatesService.listTemplates({
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 20, 100),
      category: req.query.category,
      industry: req.query.industry,
      tier: req.query.tier,
      status: req.query.status,
      q: req.query.q,
      sort: req.query.sort || 'createdAt',
      order: req.query.order || 'desc',
      tags: req.query.tags?.split(',').filter(Boolean)
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, checkTemplateTierFromParam, cache(300), async (req, res) => {
  try {
    const template = await templatesService.getTemplate(req.params.id);
    if (!template || template.isDeleted) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, superAdminOnly, validateManifest, async (req, res) => {
  try {
    const template = await templatesService.createTemplate(req.body, req.user.id);
    await invalidateCache('template:*');
    res.status(201).json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, superAdminOnly, validateManifest, async (req, res) => {
  try {
    const template = await templatesService.updateTemplate(req.params.id, req.body, req.user.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    await invalidateCache(`template:*/${req.params.id}*`);
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const template = await templatesService.deleteTemplate(req.params.id, req.user.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    await invalidateCache('template:*');
    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// PUBLISH / ARCHIVE / DEPRECATE
// ==========================================

router.post('/:id/publish', protect, superAdminOnly, async (req, res) => {
  try {
    const template = await templatesService.publishTemplate(req.params.id, req.user.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    await invalidateCache('template:*');
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/archive', protect, superAdminOnly, async (req, res) => {
  try {
    const template = await templatesService.archiveTemplate(req.params.id, req.user.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    await invalidateCache('template:*');
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/deprecate', protect, superAdminOnly, async (req, res) => {
  try {
    const template = await templatesService.deprecateTemplate(req.params.id, req.user.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    await invalidateCache('template:*');
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// VERSIONS
// ==========================================

router.get('/:id/versions', protect, async (req, res) => {
  try {
    const versions = await templatesService.getVersions(req.params.id);
    res.json({ success: true, versions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/versions', protect, superAdminOnly, async (req, res) => {
  try {
    const version = await templatesService.createVersion(req.params.id, req.body, req.user.id);
    if (!version) return res.status(404).json({ success: false, message: 'Template not found' });
    res.status(201).json({ success: true, version });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/rollback', protect, superAdminOnly, async (req, res) => {
  try {
    const template = await templatesService.rollbackVersion(req.params.id, req.body.version, req.user.id);
    if (!template) return res.status(404).json({ success: false, message: 'Version not found' });
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// FAVORITE / RATE
// ==========================================

router.post('/:id/favorite', protect, async (req, res) => {
  try {
    const result = await templatesService.toggleFavorite(req.params.id, req.user.id);
    await invalidateCache('template:*');
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/rate', protect, async (req, res) => {
  try {
    const rating = await templatesService.rateTemplate(req.params.id, req.user.id, req.body.rating, req.body.comment);
    res.json({ success: true, rating });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// LINK CERTIFICATION
// ==========================================

router.post('/:id/link-certification/:certificationId', protect, superAdminOnly, async (req, res) => {
  try {
    const { templateIntegrationService } = require('../services/template-integration.service');
    const template = await templateIntegrationService.linkCertificationToTemplate(
      req.params.id, req.params.certificationId, req.user.id
    );
    if (!template) return res.status(404).json({ success: false, message: 'Template or certification not found' });
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
