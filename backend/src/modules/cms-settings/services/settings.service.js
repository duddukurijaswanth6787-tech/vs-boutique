const prisma = require('../../../utils/prisma');
const cache = require('../middleware/settings-cache');
const auditService = require('../../../services/auditService');
const { eventBus, Events } = require('../../../services/eventBus');

class SettingsService {
  async getAll() {
    const cached = await cache.get('settings:all');
    if (cached) return cached;

    const categories = [
      'general', 'branding', 'smtp', 'redis', 'queue', 'security',
      'feature_flag', 'storage', 'monitoring', 'backup', 'maintenance',
      'analytics', 'localization', 'integration', 'performance'
    ];

    const result = {};
    for (const cat of categories) {
      result[cat] = await this.getCategory(cat);
    }

    result.deployment = await this._getDeploymentSummary();
    result.domains = await this._getDomainSummary();
    result.environment_variables = await this._getEnvVarSummary();
    result.ai_providers = await this._getAiProviderSummary();

    await cache.set('settings:all', result, 120);
    return result;
  }

  async getCategory(category) {
    const cacheKey = `settings:${category}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    let result;
    switch (category) {
      case 'general': result = await this._getGeneral(); break;
      case 'branding': result = await this._getBranding(); break;
      case 'smtp': result = await this._getSmtp(); break;
      case 'redis': result = await this._getRedis(); break;
      case 'queue': result = await this._getQueue(); break;
      case 'security': result = await this._getSecurity(); break;
      case 'feature_flag': result = await this._getFeatureFlags(); break;
      case 'storage': result = await this._getStorage(); break;
      case 'monitoring': result = await this._getMonitoring(); break;
      case 'backup': result = await this._getBackup(); break;
      case 'maintenance': result = await this._getMaintenance(); break;
      case 'analytics': result = await this._getAnalytics(); break;
      case 'localization': result = await this._getLocalization(); break;
      case 'integration': result = await this._getIntegrations(); break;
      case 'performance': result = await this._getPerformance(); break;
      default: result = { settings: [] };
    }

    await cache.set(cacheKey, result, 120);
    return result;
  }

  async updateCategory(category, data, userId = 'SYSTEM', ipAddress = null) {
    const before = await this.getCategory(category);
    let result;

    switch (category) {
      case 'general': result = await this._updateGeneral(data); break;
      case 'branding': result = await this._updateBranding(data); break;
      case 'smtp': result = await this._updateSmtp(data); break;
      case 'redis': result = await this._updateRedis(data); break;
      case 'queue': result = await this._updateQueue(data); break;
      case 'security': result = await this._updateSecurity(data); break;
      case 'feature_flag': result = await this._updateFeatureFlags(data); break;
      case 'storage': result = await this._updateStorage(data); break;
      case 'monitoring': result = await this._updateMonitoring(data); break;
      case 'backup': result = await this._updateBackup(data); break;
      case 'maintenance': result = await this._updateMaintenance(data); break;
      case 'analytics': result = await this._updateAnalytics(data); break;
      case 'localization': result = await this._updateLocalization(data); break;
      case 'integration': result = await this._updateIntegrations(data); break;
      case 'performance': result = await this._updatePerformance(data); break;
      default: throw new Error(`Unknown category: ${category}`);
    }

    auditService.logAction(
      `UPDATE_SETTINGS_${category.toUpperCase()}`,
      'settings',
      category,
      userId,
      { before, after: result },
      ipAddress
    );

    eventBus.emit(`settings:${category}:updated`, { category, data: result, userId });

    const keys = await cache.get('settings:all');
    if (keys) await cache.del('settings:all');

    return result;
  }

  async initializeDefaults() {
    const defaults = [
      { key: 'site_name', value: 'Antaire CMS', category: 'general', description: 'Site name' },
      { key: 'site_description', value: 'Enterprise CMS Platform', category: 'general', description: 'Site description' },
      { key: 'support_email', value: 'support@antaire.io', category: 'general', description: 'Support email address' },
      { key: 'support_phone', value: '', category: 'general', description: 'Support phone number' },
      { key: 'company_name', value: 'Antaire', category: 'general', description: 'Company name' },
      { key: 'company_address', value: '', category: 'general', description: 'Company address' },
      { key: 'platform_version', value: '1.0.0', category: 'general', description: 'Platform version' },
      { key: 'license_key', value: '', category: 'general', description: 'License key' },
      { key: 'smtp_host', value: '', category: 'smtp', description: 'SMTP server hostname' },
      { key: 'smtp_port', value: 587, category: 'smtp', description: 'SMTP server port' },
      { key: 'smtp_secure', value: false, category: 'smtp', description: 'SMTP use TLS' },
      { key: 'smtp_user', value: '', category: 'smtp', description: 'SMTP username' },
      { key: 'smtp_pass', value: '', category: 'smtp', description: 'SMTP password' },
      { key: 'smtp_from_name', value: 'Antaire CMS', category: 'smtp', description: 'SMTP from name' },
      { key: 'smtp_from_email', value: 'noreply@antaire.io', category: 'smtp', description: 'SMTP from email' },
      { key: 'redis_url', value: process.env.REDIS_URL || '', category: 'redis', description: 'Redis connection URL' },
      { key: 'redis_cache_ttl', value: 300, category: 'redis', description: 'Default Redis cache TTL (seconds)' },
      { key: 'queue_default_job_timeout', value: 60000, category: 'queue', description: 'Default job timeout (ms)' },
      { key: 'queue_max_concurrent', value: 5, category: 'queue', description: 'Max concurrent jobs' },
      { key: 'rate_limit_window_ms', value: 900000, category: 'security', description: 'Rate limit window (ms)' },
      { key: 'rate_limit_max_requests', value: 500, category: 'security', description: 'Max requests per window' },
      { key: 'jwt_expiry_hours', value: 24, category: 'security', description: 'JWT token expiry (hours)' },
      { key: 'cors_allowed_origins', value: '*', category: 'security', description: 'Allowed CORS origins' },
      { key: 'session_timeout_minutes', value: 60, category: 'security', description: 'Session timeout (minutes)' },
      { key: 'backup_enabled', value: false, category: 'backup', description: 'Enable automated backups' },
      { key: 'backup_schedule_cron', value: '0 2 * * *', category: 'backup', description: 'Backup schedule (cron)' },
      { key: 'backup_retention_days', value: 30, category: 'backup', description: 'Backup retention (days)' },
      { key: 'backup_storage_path', value: '', category: 'backup', description: 'Backup storage path' },
      { key: 'maintenance_mode', value: false, category: 'maintenance', description: 'Enable maintenance mode' },
      { key: 'maintenance_message', value: 'Under maintenance', category: 'maintenance', description: 'Maintenance mode message' },
      { key: 'maintenance_scheduled_start', value: '', category: 'maintenance', description: 'Scheduled maintenance start' },
      { key: 'maintenance_scheduled_end', value: '', category: 'maintenance', description: 'Scheduled maintenance end' },
      { key: 'storage_provider', value: 'auto', category: 'storage', description: 'Default storage provider' },
      { key: 'storage_region', value: '', category: 'storage', description: 'Storage bucket region' },
      { key: 'storage_bucket', value: '', category: 'storage', description: 'Default storage bucket' },
      { key: 'monitoring_enabled', value: true, category: 'monitoring', description: 'Enable system monitoring' },
      { key: 'monitoring_retention_days', value: 90, category: 'monitoring', description: 'Metrics retention (days)' },
      { key: 'analytics_default_tracking_id', value: '', category: 'analytics', description: 'Default Google Analytics ID' },
      { key: 'analytics_default_fb_pixel', value: '', category: 'analytics', description: 'Default Facebook Pixel ID' },
      { key: 'localization_default_language', value: 'en', category: 'localization', description: 'Default system language' },
      { key: 'localization_default_currency', value: 'INR', category: 'localization', description: 'Default currency' },
      { key: 'localization_default_timezone', value: 'Asia/Kolkata', category: 'localization', description: 'Default timezone' },
      { key: 'integration_webhook_retry_count', value: 3, category: 'integration', description: 'Webhook retry count' },
      { key: 'integration_webhook_timeout_ms', value: 10000, category: 'integration', description: 'Webhook timeout (ms)' },
      { key: 'performance_cdn_enabled', value: false, category: 'performance', description: 'Enable CDN' },
      { key: 'performance_cdn_url', value: '', category: 'performance', description: 'CDN base URL' },
      { key: 'performance_image_quality', value: 80, category: 'performance', description: 'Image compression quality' },
      { key: 'performance_max_upload_size_mb', value: 10, category: 'performance', description: 'Max upload size (MB)' },
    ];

    let count = 0;
    for (const d of defaults) {
      try {
        await prisma.cmsAiSettings.upsert({
          where: { key: d.key },
          create: d,
          update: {}
        });
        count++;
      } catch (e) { console.error('[Settings Service] initializeDefaults error:', e); }
    }

    await cache.del('settings:*');
    return { initialized: true, count };
  }

  async _getGeneral() {
    const rows = await prisma.cmsAiSettings.findMany({
      where: { category: 'general' },
      orderBy: { key: 'asc' }
    });
    return this._toMap(rows);
  }

  async _getBranding() {
    const assignmentConfigs = await prisma.cmsAssignmentConfiguration.findMany({
      select: {
        id: true, businessId: true, theme: true, primaryColor: true,
        secondaryColor: true, logoUrl: true, faviconUrl: true,
        metaTitle: true, metaDescription: true
      },
      take: 1
    });
    const themes = await prisma.boutiqueTheme.findMany({ take: 1 });
    return {
      assignment: assignmentConfigs[0] || null,
      theme: themes[0] || null,
      settings: await this._getByCategory('branding')
    };
  }

  async _getSmtp() {
    return {
      configured: !!(process.env.SMTP_HOST || await this._getValue('smtp_host')),
      host: process.env.SMTP_HOST || await this._getValue('smtp_host') || '',
      settings: await this._getByCategory('smtp')
    };
  }

  async _getRedis() {
    return {
      url: process.env.REDIS_URL || await this._getValue('redis_url') || '',
      connected: false,
      settings: await this._getByCategory('redis')
    };
  }

  async _getQueue() {
    let queueStatus = { connected: false, mode: 'unknown' };
    try {
      const qm = require('../../ai-core/queues/queueManager');
      queueStatus = { connected: qm.useRedis, mode: qm.useRedis ? 'redis' : 'in-memory' };
    } catch (e) { console.error('[Settings Service] _getQueue error:', e); }
    return {
      status: queueStatus,
      settings: await this._getByCategory('queue')
    };
  }

  async _getSecurity() {
    return {
      rateLimits: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        max: parseInt(process.env.RATE_LIMIT_MAX || '500', 10)
      },
      settings: await this._getByCategory('security')
    };
  }

  async _getFeatureFlags() {
    const rows = await prisma.cmsAiSettings.findMany({
      where: { category: 'feature_flag' },
      orderBy: { key: 'asc' }
    });
    return rows.map(r => ({ key: r.key, enabled: r.value === true || r.value === 'true', description: r.description }));
  }

  async _getStorage() {
    return {
      provider: process.env.STORAGE_PROVIDER || 'auto',
      hasAwsConfig: !!(process.env.AWS_ACCESS_KEY && process.env.AWS_SECRET_KEY),
      settings: await this._getByCategory('storage')
    };
  }

  async _getMonitoring() {
    return {
      enabled: true,
      settings: await this._getByCategory('monitoring')
    };
  }

  async _getBackup() {
    return {
      enabled: await this._getValue('backup_enabled') === true,
      settings: await this._getByCategory('backup')
    };
  }

  async _getMaintenance() {
    const mode = await this._getValue('maintenance_mode');
    return {
      maintenanceMode: mode === true || mode === 'true',
      settings: await this._getByCategory('maintenance')
    };
  }

  async _getAnalytics() {
    return {
      settings: await this._getByCategory('analytics')
    };
  }

  async _getLocalization() {
    return {
      settings: await this._getByCategory('localization')
    };
  }

  async _getIntegrations() {
    return {
      settings: await this._getByCategory('integration')
    };
  }

  async _getPerformance() {
    return {
      settings: await this._getByCategory('performance')
    };
  }

  async _getDeploymentSummary() {
    try {
      const envs = await prisma.deploymentEnvironment.findMany({ select: { id: true, name: true, type: true, isActive: true } });
      return { environments: envs };
    } catch { return { environments: [] }; }
  }

  async _getDomainSummary() {
    try {
      const domains = await prisma.deploymentDomain.findMany({
        select: { id: true, domain: true, type: true, status: true, sslEnabled: true },
        take: 20, orderBy: { domain: 'asc' }
      });
      return { domains };
    } catch { return { domains: [] }; }
  }

  async _getEnvVarSummary() {
    try {
      const vars = await prisma.deploymentEnvironmentVariable.findMany({
        select: { id: true, key: true, isSecret: true, version: true },
        take: 50, orderBy: { key: 'asc' }
      });
      return { variables: vars };
    } catch { return { variables: [] }; }
  }

  async _getAiProviderSummary() {
    try {
      const providers = await prisma.cmsAiProvider.findMany({
        select: { id: true, name: true, provider: true, model: true, isEnabled: true, healthStatus: true },
        orderBy: { priority: 'asc' }
      });
      return { providers };
    } catch { return { providers: [] }; }
  }

  async _getByCategory(category) {
    const rows = await prisma.cmsAiSettings.findMany({
      where: { category },
      orderBy: { key: 'asc' }
    });
    return this._toMap(rows);
  }

  async _getValue(key) {
    try {
      const row = await prisma.cmsAiSettings.findUnique({ where: { key } });
      return row ? row.value : null;
    } catch { return null; }
  }

  _toMap(rows) {
    const map = {};
    for (const r of rows) {
      map[r.key] = r.value;
    }
    return map;
  }

  async _updateGeneral(data) {
    await this._upsertMap('general', data);
    return this._getGeneral();
  }

  async _updateBranding(data) {
    if (data.assignmentId) {
      try {
        const updateData = {};
        if (data.theme !== undefined) updateData.theme = data.theme;
        if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor;
        if (data.secondaryColor !== undefined) updateData.secondaryColor = data.secondaryColor;
        if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
        if (data.faviconUrl !== undefined) updateData.faviconUrl = data.faviconUrl;
        if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
        if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
        if (Object.keys(updateData).length > 0) {
          await prisma.cmsAssignmentConfiguration.update({
            where: { id: data.assignmentId },
            data: updateData
          });
        }
      } catch (e) { console.error('[Settings Service] _updateBranding error:', e); }
    }
    return this._getBranding();
  }

  async _updateSmtp(data) {
    await this._upsertMap('smtp', data);
    return this._getSmtp();
  }

  async _updateRedis(data) {
    await this._upsertMap('redis', data);
    return this._getRedis();
  }

  async _updateQueue(data) {
    await this._upsertMap('queue', data);
    return this._getQueue();
  }

  async _updateSecurity(data) {
    await this._upsertMap('security', data);
    return this._getSecurity();
  }

  async _updateFeatureFlags(data) {
    for (const [key, value] of Object.entries(data)) {
      try {
        await prisma.cmsAiSettings.upsert({
          where: { key },
          create: { key, value: value === true || value === 'true' ? true : false, category: 'feature_flag', description: '' },
          update: { value: value === true || value === 'true' ? true : false }
        });
      } catch (e) { console.error('[Settings Service] _updateFeatureFlags error:', e); }
    }
    return this._getFeatureFlags();
  }

  async _updateStorage(data) {
    await this._upsertMap('storage', data);
    return this._getStorage();
  }

  async _updateMonitoring(data) {
    await this._upsertMap('monitoring', data);
    return this._getMonitoring();
  }

  async _updateBackup(data) {
    await this._upsertMap('backup', data);
    return this._getBackup();
  }

  async _updateMaintenance(data) {
    const wasOff = (await this._getValue('maintenance_mode')) !== true && (await this._getValue('maintenance_mode')) !== 'true';

    await this._upsertMap('maintenance', data);

    const isOn = data.maintenance_mode === true || data.maintenance_mode === 'true' || data.maintenance_mode === true;

    if (wasOff && isOn) {
      eventBus.emit('system:maintenance:enabled', {
        message: data.maintenance_message || 'Under maintenance',
        scheduledStart: data.maintenance_scheduled_start,
        scheduledEnd: data.maintenance_scheduled_end
      });
    } else if (!wasOff && isOn) {
      eventBus.emit('system:maintenance:disabled', {});
    }

    return this._getMaintenance();
  }

  async _updateAnalytics(data) {
    await this._upsertMap('analytics', data);
    return this._getAnalytics();
  }

  async _updateLocalization(data) {
    await this._upsertMap('localization', data);
    return this._getLocalization();
  }

  async _updateIntegrations(data) {
    await this._upsertMap('integration', data);
    return this._getIntegrations();
  }

  async _updatePerformance(data) {
    await this._upsertMap('performance', data);
    return this._getPerformance();
  }

  async _upsertMap(category, data) {
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) continue;
      try {
        await prisma.cmsAiSettings.upsert({
          where: { key },
          create: { key, value, category, description: '' },
          update: { value, category }
        });
      } catch (e) { console.error('[Settings Service] _upsertMap error:', e); }
    }
    await cache.del(`settings:${category}`);
  }
}

module.exports = new SettingsService();
