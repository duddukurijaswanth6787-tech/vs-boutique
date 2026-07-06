const prisma = require('../../../utils/prisma');
const cache = require('../middleware/marketplace-cache');
const auditService = require('../../../services/auditService');
const { eventBus, Events } = require('../../../services/eventBus');
const marketplaceService = require('../../marketplace/services/marketplace.service');
const { validateManifest, checkCompatibility } = require('../validators/manifest.validator');

const MP_EVENTS = {
  SUBMITTED: 'extension:submitted',
  APPROVED: 'extension:approved',
  PUBLISHED: 'extension:published',
  INSTALLED: 'extension:installed',
  UPDATED: 'extension:updated',
  REMOVED: 'extension:removed',
  ROLLBACK: 'extension:rollback',
  FAILED: 'extension:failed',
};

const CATEGORY_TYPES = {
  'plugin': { icon: 'puzzle', label: 'Plugins' },
  'extension': { icon: 'extension', label: 'Extensions' },
  'widget': { icon: 'layout', label: 'Widgets' },
  'integration': { icon: 'link', label: 'Integrations' },
  'theme': { icon: 'palette', label: 'Themes' },
  'automation-pack': { icon: 'zap', label: 'Automation Packs' },
  'ai-pack': { icon: 'brain', label: 'AI Packs' },
  'developer-package': { icon: 'code', label: 'Developer Packages' },
  'connector': { icon: 'plug', label: 'Connectors' },
  'business-pack': { icon: 'briefcase', label: 'Business Packs' },
  'industry-pack': { icon: 'building', label: 'Industry Packs' },
  'payment-provider': { icon: 'credit-card', label: 'Payment Providers' },
  'shipping-provider': { icon: 'truck', label: 'Shipping Providers' },
  'communication-provider': { icon: 'message-circle', label: 'Communication Providers' },
  'analytics-provider': { icon: 'bar-chart', label: 'Analytics Providers' },
  'marketing-provider': { icon: 'megaphone', label: 'Marketing Providers' },
  'seo-pack': { icon: 'search', label: 'SEO Packs' },
  'security-pack': { icon: 'shield', label: 'Security Packs' },
  'reports-pack': { icon: 'file-text', label: 'Reports Packs' },
};

class CmsMarketplaceService {
  async getAll() {
    const cached = await cache.get('all');
    if (cached) return cached;

    const config = await this._getConfig();
    const categories = await this._getCategories();
    const featured = await this._getFeatured();
    const topRated = await this._getTopRated();
    const recent = await this._getRecent();
    const installed = await this._getInstalledSummary();
    const stats = await this._getAnalytics();

    const result = { config, categories, featured, topRated, recent, installed, stats };
    await cache.set('all', result, 120);
    return result;
  }

  async getCategory(category) {
    const cacheKey = `cat:${category}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    let result;
    switch (category) {
      case 'config': result = await this._getConfig(); break;
      case 'categories': result = await this._getCategories(); break;
      case 'featured': result = await this._getFeatured(); break;
      case 'top_rated': result = await this._getTopRated(); break;
      case 'recent': result = await this._getRecent(); break;
      case 'installed': result = await this._getInstalledSummary(); break;
      case 'analytics': result = await this._getAnalytics(); break;
      case 'developers': result = await this._getDevelopers(); break;
      case 'licenses': result = await this._getLicenses(); break;
      case 'reviews': result = await this._getReviews(); break;
      default: result = {};
    }

    await cache.set(cacheKey, result, 120);
    return result;
  }

  async updateCategory(category, data, userId = 'SYSTEM', ipAddress = null) {
    const before = await this.getCategory(category);
    let result;

    switch (category) {
      case 'config': result = await this._updateConfig(data); break;
      default: throw new Error(`Category '${category}' is read-only or unknown`);
    }

    auditService.logAction(`UPDATE_MARKETPLACE_${category.toUpperCase()}`, 'marketplace', category, userId, { before, after: result }, ipAddress);
    eventBus.emit(`marketplace:${category}:updated`, { category, data: result, userId });
    await cache.del('all');
    await cache.del(`cat:${category}`);
    return result;
  }

  async initializeDefaults() {
    const defaults = [
      { key: 'marketplace_name', value: 'Antair Marketplace', category: 'marketplace', description: 'Marketplace display name' },
      { key: 'marketplace_description', value: 'Extend your platform with plugins, themes, and integrations', category: 'marketplace', description: 'Marketplace tagline' },
      { key: 'require_approval', value: true, category: 'marketplace', description: 'Require admin approval for new extensions' },
      { key: 'allow_community', value: true, category: 'marketplace', description: 'Allow community submissions' },
      { key: 'max_free_installs', value: 5, category: 'marketplace', description: 'Max free installations per business' },
      { key: 'commission_rate', value: 0.15, category: 'marketplace', description: 'Platform commission on paid extensions' },
      { key: 'auto_verify_checksum', value: true, category: 'marketplace', description: 'Auto-verify package checksums' },
      { key: 'sandbox_enabled', value: true, category: 'marketplace', description: 'Sandbox extension execution' },
      { key: 'virus_scan_enabled', value: true, category: 'marketplace', description: 'Scan uploaded packages for malware' },
      { key: 'max_version_age_days', value: 365, category: 'marketplace', description: 'Max days before version deprecation' },
    ];

    let count = 0;
    for (const d of defaults) {
      try {
        await prisma.cmsAiSettings.upsert({ where: { key: d.key }, create: d, update: {} });
        count++;
      } catch (e) { console.error('[Marketplace Service] initializeDefaults upsert error:', e); }
    }

    await cache.del('all');
    await cache.delPattern('cat:*');
    return { initialized: true, count };
  }

  async searchPackages(filters = {}) {
    const cacheKey = `search:${JSON.stringify(filters)}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const result = await marketplaceService.searchPackages(filters, { page: filters.page, limit: filters.limit || 20 });
    await cache.set(cacheKey, result, 60);
    return result;
  }

  async getPackage(slug) {
    const cacheKey = `pkg:${slug}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const pkg = await marketplaceService.getPackageBySlug(slug);
    const manifestType = pkg.versions?.[0]?.manifestJson?.type || pkg.versions?.[0]?.manifestJson?.category || 'extension';
    const typeInfo = CATEGORY_TYPES[manifestType] || { icon: 'package', label: 'Package' };

    await cache.set(cacheKey, pkg, 60);
    return pkg;
  }

  async publishPackage(data, userId, ipAddress) {
    const manifest = data.manifestJson || {};
    const validation = validateManifest(manifest);
    if (!validation.valid) throw new Error(`Manifest validation failed: ${validation.errors.join('; ')}`);

    let publisher = await prisma.marketplacePublisher.findFirst({ where: { ownerId: userId } });
    if (!publisher) {
      publisher = await prisma.marketplacePublisher.create({
        data: { ownerId: userId, name: data.name || 'CMS Publisher', email: data.email || `${userId}@marketplace.local`, role: 'ADMIN', isVerified: true }
      });
    }

    const result = await marketplaceService.publishPackage(publisher.id, data);
    eventBus.emit(MP_EVENTS.SUBMITTED, { packageId: result.package.id, slug: result.package.slug, version: result.version.version, userId });
    auditService.logAction('PUBLISH_MARKETPLACE_PACKAGE', 'marketplace', result.package.id, userId, { data }, ipAddress);
    await cache.del('all');
    await cache.delPattern('search:*');
    return result;
  }

  async installPackage(businessId, packageSlug, versionString, userId, ipAddress) {
    const result = await marketplaceService.installPackage(businessId, packageSlug, versionString);
    eventBus.emit(MP_EVENTS.INSTALLED, { businessId, packageSlug, version: versionString || 'latest', userId });
    auditService.logAction('INSTALL_MARKETPLACE_PACKAGE', 'marketplace', result.installation?.id, userId, { businessId, packageSlug }, ipAddress);
    await cache.del('all');
    await cache.delPattern('search:*');
    return result;
  }

  async uninstallPackage(businessId, packageId, userId, ipAddress) {
    const before = await prisma.marketplaceInstallation.findUnique({ where: { id: packageId }, include: { package: true } });
    const result = await marketplaceService.uninstallPackage(businessId, packageId);
    eventBus.emit(MP_EVENTS.REMOVED, { businessId, packageId, slug: before?.package?.slug, userId });
    auditService.logAction('UNINSTALL_MARKETPLACE_PACKAGE', 'marketplace', packageId, userId, { businessId, before }, ipAddress);
    await cache.del('all');
    await cache.delPattern('search:*');
    return result;
  }

  async togglePackage(businessId, packageId, isEnabled, userId) {
    const result = await marketplaceService.setEnabledState(businessId, packageId, isEnabled);
    await cache.del('all');
    return result;
  }

  async approvePackage(packageSlug, userId, ipAddress) {
    const pkg = await prisma.marketplacePackage.update({
      where: { slug: packageSlug },
      data: { status: 'APPROVED' }
    });
    eventBus.emit(MP_EVENTS.APPROVED, { packageId: pkg.id, slug: pkg.slug, userId });
    eventBus.emit(MP_EVENTS.PUBLISHED, { packageId: pkg.id, slug: pkg.slug, userId });
    auditService.logAction('APPROVE_MARKETPLACE_PACKAGE', 'marketplace', pkg.id, userId, { slug: packageSlug }, ipAddress);
    await cache.del('all');
    await cache.delPattern('search:*');
    await cache.del(`pkg:${packageSlug}`);
    return pkg;
  }

  async getInstalled(businessId) {
    const cacheKey = `installed:${businessId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const installations = await prisma.marketplaceInstallation.findMany({
      where: { businessId },
      include: {
        package: { include: { publisher: true } },
        installedVersion: { include: { capabilities: true } }
      }
    });

    await cache.set(cacheKey, installations, 60);
    return installations;
  }

  async getDeveloperPackages(publisherId) {
    const cacheKey = `dev:${publisherId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const packages = await prisma.marketplacePackage.findMany({
      where: { publisherId },
      include: {
        versions: { orderBy: { createdAt: 'desc' }, take: 1, include: { capabilities: true } },
        _count: { select: { installations: true, reviews: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    await cache.set(cacheKey, packages, 60);
    return packages;
  }

  async _getConfig() {
    const rows = await prisma.cmsAiSettings.findMany({
      where: { category: 'marketplace' },
      orderBy: { key: 'asc' }
    });
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    return { settings };
  }

  async _updateConfig(data) {
    const upsertMap = data.settings || data;
    for (const [key, value] of Object.entries(upsertMap)) {
      if (value === null || value === undefined) continue;
      try {
        await prisma.cmsAiSettings.upsert({
          where: { key },
          create: { key, value, category: 'marketplace', description: '' },
          update: { value }
        });
      } catch (e) { console.error('[Marketplace Service] _updateConfig upsert error:', e); }
    }
    return this._getConfig();
  }

  async _getCategories() {
    const packages = await prisma.marketplacePackage.findMany({
      where: { status: 'APPROVED' },
      select: { id: true, slug: true, name: true }
    });
    const categoryCounts = {};
    for (const pkg of packages) {
      const latestVer = await prisma.marketplaceVersion.findFirst({
        where: { packageId: pkg.id },
        orderBy: { createdAt: 'desc' }
      });
      let type = 'extension';
      if (latestVer?.manifestJson) {
        type = latestVer.manifestJson.type || latestVer.manifestJson.category || 'extension';
      }
      categoryCounts[type] = (categoryCounts[type] || 0) + 1;
    }

    return Object.entries(CATEGORY_TYPES).map(([key, info]) => ({
      id: key, ...info, count: categoryCounts[key] || 0
    }));
  }

  async _getFeatured() {
    try {
      const packages = await prisma.marketplacePackage.findMany({
        where: { status: 'APPROVED' },
        orderBy: [{ downloads: 'desc' }, { ratingsAvg: 'desc' }],
        take: 12,
        include: {
          publisher: { select: { name: true } },
          versions: { orderBy: { createdAt: 'desc' }, take: 1, include: { capabilities: true } }
        }
      });
      return packages;
    } catch { return []; }
  }

  async _getTopRated() {
    try {
      const packages = await prisma.marketplacePackage.findMany({
        where: { status: 'APPROVED', reviewsCount: { gt: 0 } },
        orderBy: { ratingsAvg: 'desc' },
        take: 12,
        include: {
          publisher: { select: { name: true } },
          versions: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      });
      return packages;
    } catch { return []; }
  }

  async _getRecent() {
    try {
      const packages = await prisma.marketplacePackage.findMany({
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          publisher: { select: { name: true } },
          versions: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      });
      return packages;
    } catch { return []; }
  }

  async _getInstalledSummary() {
    try {
      const total = await prisma.marketplaceInstallation.count();
      const enabled = await prisma.marketplaceInstallation.count({ where: { isEnabled: true } });
      const byBusiness = await prisma.marketplaceInstallation.groupBy({
        by: ['businessId'],
        _count: { id: true }
      });
      const recent = await prisma.marketplaceInstallation.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { package: { select: { name: true, slug: true } } }
      });
      return { total, enabled, disabled: total - enabled, businessesUsing: byBusiness.length, recent };
    } catch { return { total: 0, enabled: 0, disabled: 0, businessesUsing: 0, recent: [] }; }
  }

  async _getAnalytics() {
    try {
      const totalPkgs = await prisma.marketplacePackage.count();
      const approvedPkgs = await prisma.marketplacePackage.count({ where: { status: 'APPROVED' } });
      const totalInstalls = await prisma.marketplaceInstallation.count();
      const totalDownloads = await prisma.marketplacePackage.aggregate({ _sum: { downloads: true } });
      const totalPublishers = await prisma.marketplacePublisher.count();
      const totalReviews = await prisma.marketplaceReview.count();
      const avgRating = await prisma.marketplaceReview.aggregate({ _avg: { rating: true } });

      const topPackages = await prisma.marketplacePackage.findMany({
        where: { status: 'APPROVED' },
        orderBy: { downloads: 'desc' },
        take: 10,
        select: { name: true, slug: true, downloads: true, ratingsAvg: true, reviewsCount: true }
      });

      return {
        totalPackages: totalPkgs,
        approvedPackages: approvedPkgs,
        pendingPackages: totalPkgs - approvedPkgs,
        totalInstallations: totalInstalls,
        totalDownloads: totalDownloads._sum.downloads || 0,
        totalPublishers,
        totalReviews,
        averageRating: avgRating._avg.rating || 0,
        topPackages
      };
    } catch { return {}; }
  }

  async _getDevelopers() {
    try {
      const publishers = await prisma.marketplacePublisher.findMany({
        include: {
          packages: {
            select: { id: true },
            where: { status: 'APPROVED' }
          },
          _count: { select: { packages: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return publishers.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        website: p.website,
        role: p.role,
        isVerified: p.isVerified,
        packageCount: p._count.packages,
        approvedCount: p.packages.length,
        createdAt: p.createdAt
      }));
    } catch { return []; }
  }

  async _getLicenses() {
    try {
      const licenses = await prisma.marketplaceLicense.findMany({
        include: {
          package: { select: { name: true, slug: true } },
          business: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      return licenses;
    } catch { return []; }
  }

  async _getReviews() {
    try {
      const reviews = await prisma.marketplaceReview.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { package: { select: { name: true, slug: true } } }
      });
      return reviews;
    } catch { return []; }
  }
}

module.exports = new CmsMarketplaceService();
