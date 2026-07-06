const prisma = require('../../../utils/prisma');
const cache = require('../middleware/subscriptions-cache');
const auditService = require('../../../services/auditService');
const { eventBus, Events } = require('../../../services/eventBus');

class CmsSubscriptionsService {
  async getAll() {
    const cached = await cache.get('cms:subs:all');
    if (cached) return cached;

    const result = {
      plans: await this._getPlansSummary(),
      subscriptions: await this._getSubscriptionsSummary(),
      billing: await this._getBillingSummary(),
      invoices: await this._getInvoicesConfig(),
      tax: await this._getTaxConfig(),
      credits: await this._getCreditLedger(),
      webhooks: await this._getWebhookConfig(),
      usage_metering: await this._getUsageMetering(),
      analytics: await this._getAnalytics()
    };

    await cache.set('cms:subs:all', result, 120);
    return result;
  }

  async getCategory(category) {
    const cacheKey = `cms:subs:${category}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    let result;
    switch (category) {
      case 'plans': result = await this._getPlansSummary(); break;
      case 'subscriptions': result = await this._getSubscriptionsSummary(); break;
      case 'billing': result = await this._getBillingSummary(); break;
      case 'invoices': result = await this._getInvoicesConfig(); break;
      case 'tax': result = await this._getTaxConfig(); break;
      case 'credits': result = await this._getCreditLedger(); break;
      case 'webhooks': result = await this._getWebhookConfig(); break;
      case 'usage_metering': result = await this._getUsageMetering(); break;
      case 'analytics': result = await this._getAnalytics(); break;
      default: result = { settings: [] };
    }

    await cache.set(cacheKey, result, 120);
    return result;
  }

  async updateCategory(category, data, userId = 'SYSTEM', ipAddress = null) {
    const before = await this.getCategory(category);
    let result;

    switch (category) {
      case 'invoices': result = await this._updateInvoicesConfig(data); break;
      case 'tax': result = await this._updateTaxConfig(data); break;
      case 'credits': result = await this._updateCreditLedger(data); break;
      case 'webhooks': result = await this._updateWebhookConfig(data); break;
      case 'usage_metering': result = await this._updateUsageMetering(data); break;
      case 'billing': result = await this._updateBillingConfig(data); break;
      default: throw new Error(`Category '${category}' is read-only or unknown`);
    }

    auditService.logAction(
      `UPDATE_SUBSCRIPTIONS_${category.toUpperCase()}`,
      'subscriptions',
      category,
      userId,
      { before, after: result },
      ipAddress
    );

    eventBus.emit(`subscriptions:${category}:updated`, { category, data: result, userId });
    await cache.del('cms:subs:all');
    return result;
  }

  async initializeDefaults() {
    const defaults = [
      { key: 'invoice_prefix', value: 'INV', category: 'invoice', description: 'Invoice number prefix' },
      { key: 'invoice_next_number', value: 1001, category: 'invoice', description: 'Next invoice number' },
      { key: 'invoice_due_days', value: 15, category: 'invoice', description: 'Payment due days from invoice date' },
      { key: 'invoice_footer', value: 'Thank you for your business', category: 'invoice', description: 'Invoice footer text' },
      { key: 'tax_name', value: 'GST', category: 'tax', description: 'Tax name' },
      { key: 'tax_rate', value: 5, category: 'tax', description: 'Default tax rate (%)' },
      { key: 'tax_region', value: 'IN', category: 'tax', description: 'Tax region code' },
      { key: 'tax_inclusive', value: true, category: 'tax', description: 'Tax inclusive in pricing' },
      { key: 'billing_cycle', value: 'monthly', category: 'billing', description: 'Default billing cycle' },
      { key: 'auto_renew', value: true, category: 'billing', description: 'Auto-renew subscriptions' },
      { key: 'grace_period_days', value: 3, category: 'billing', description: 'Grace period after failed payment' },
      { key: 'ai_credit_rate', value: 0.01, category: 'usage_metering', description: 'Cost per 1K AI tokens' },
      { key: 'deploy_credit_rate', value: 0.50, category: 'usage_metering', description: 'Cost per deployment' },
      { key: 'storage_rate_mb', value: 0.001, category: 'usage_metering', description: 'Cost per MB storage per month' },
      { key: 'bandwidth_rate_gb', value: 0.10, category: 'usage_metering', description: 'Cost per GB bandwidth' },
      { key: 'webhook_retry_count', value: 3, category: 'webhook', description: 'Default webhook retry count' },
      { key: 'webhook_timeout_ms', value: 10000, category: 'webhook', description: 'Webhook request timeout (ms)' },
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
      } catch (e) { console.error('[Subscriptions Service] initializeDefaults error:', e); }
    }

    await cache.del('cms:subs:*');
    return { initialized: true, count };
  }

  async _getPlansSummary() {
    try {
      const plans = await prisma.subscriptionPlan.findMany({
        select: { id: true, name: true, planCode: true, monthlyPrice: true, yearlyPrice: true, trialPeriodDays: true, gracePeriodDays: true, isActive: true, isFeatured: true, recommendedPlan: true, sortOrder: true },
        orderBy: { sortOrder: 'asc' }
      });
      const counts = await prisma.boutiqueSubscription.groupBy({
        by: ['planId'],
        _count: { id: true }
      });
      const countMap = {};
      for (const c of counts) countMap[c.planId] = c._count.id;
      return { plans: plans.map(p => ({ ...p, subscriberCount: countMap[p.id] || 0 })) };
    } catch { return { plans: [] }; }
  }

  async _getSubscriptionsSummary() {
    try {
      const total = await prisma.boutiqueSubscription.count();
      const byStatus = await prisma.boutiqueSubscription.groupBy({
        by: ['status'],
        _count: { id: true }
      });
      const recent = await prisma.boutiqueSubscription.findMany({
        select: { id: true, status: true, startDate: true, endDate: true, trialEndsAt: true, boutique: { select: { name: true } }, plan: { select: { name: true } } },
        orderBy: { startDate: 'desc' },
        take: 10
      });
      const statusMap = {};
      for (const s of byStatus) statusMap[s.status] = s._count.id;
      return { total, byStatus: statusMap, recent };
    } catch { return { total: 0, byStatus: {}, recent: [] }; }
  }

  async _getBillingSummary() {
    try {
      const history = await prisma.subscriptionBillingHistory.findMany({
        select: { id: true, amount: true, paymentStatus: true, paymentMethod: true, invoiceUrl: true, createdAt: true, subscription: { select: { boutique: { select: { name: true } }, plan: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
      return { history };
    } catch { return { history: [] }; }
  }

  async _getInvoicesConfig() {
    const rows = await prisma.cmsAiSettings.findMany({
      where: { category: 'invoice' },
      orderBy: { key: 'asc' }
    });
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    return { settings };
  }

  async _getTaxConfig() {
    const rows = await prisma.cmsAiSettings.findMany({
      where: { category: 'tax' },
      orderBy: { key: 'asc' }
    });
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    return { settings };
  }

  async _getCreditLedger() {
    const rows = await prisma.cmsAiSettings.findMany({
      where: { category: 'credit_ledger' },
      orderBy: { key: 'asc' }
    });
    return { entries: rows.map(r => ({ key: r.key, value: r.value, description: r.description, updatedAt: r.updatedAt })) };
  }

  async _getWebhookConfig() {
    const rows = await prisma.cmsAiSettings.findMany({
      where: { category: 'webhook' },
      orderBy: { key: 'asc' }
    });
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    return { settings };
  }

  async _getUsageMetering() {
    const rows = await prisma.cmsAiSettings.findMany({
      where: { category: 'usage_metering' },
      orderBy: { key: 'asc' }
    });
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;

    let aiUsage = {};
    try {
      const usage = await prisma.cmsAiUsage.aggregate({ _sum: { totalTokens: true, cost: true } });
      aiUsage = { totalTokens: usage._sum.totalTokens || 0, totalCost: usage._sum.cost || 0 };
    } catch (e) { console.error('[Subscriptions Service] _getUsageMetering aiUsage error:', e); }
    let deployCount = 0;
    try { deployCount = await prisma.deployment.count(); } catch (e) { console.error('[Subscriptions Service] _getUsageMetering deploy error:', e); }

    return { settings, currentUsage: { aiTokens: aiUsage, deployments: deployCount } };
  }

  async _getAnalytics() {
    try {
      const totalPlans = await prisma.subscriptionPlan.count();
      const activePlans = await prisma.subscriptionPlan.count({ where: { isActive: true } });
      const totalSubs = await prisma.boutiqueSubscription.count();
      const activeSubs = await prisma.boutiqueSubscription.count({ where: { status: 'ACTIVE' } });
      const trialSubs = await prisma.boutiqueSubscription.count({ where: { status: 'TRIAL' } });
      const expiredSubs = await prisma.boutiqueSubscription.count({ where: { status: 'EXPIRED' } });

      let mrr = 0;
      try {
        const result = await prisma.$queryRawUnsafe(
          `SELECT COALESCE(SUM(sp.monthly_price), 0) as mrr FROM boutique_subscriptions bs JOIN subscription_plans sp ON bs.plan_id = sp.id WHERE bs.status = 'ACTIVE'`
        );
        mrr = parseFloat(result[0]?.mrr || 0);
      } catch (e) { console.error('[Subscriptions Service] _getAnalytics MRR error:', e); }

      return { totalPlans, activePlans, totalSubs, activeSubs, trialSubs, expiredSubs, mrr };
    } catch { return {}; }
  }

  async _updateInvoicesConfig(data) {
    return this._upsertMap('invoice', data);
  }

  async _updateTaxConfig(data) {
    return this._upsertMap('tax', data);
  }

  async _updateCreditLedger(data) {
    return this._upsertMap('credit_ledger', data);
  }

  async _updateWebhookConfig(data) {
    return this._upsertMap('webhook', data);
  }

  async _updateUsageMetering(data) {
    return this._upsertMap('usage_metering', data);
  }

  async _updateBillingConfig(data) {
    return this._upsertMap('billing', data);
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
      } catch (e) { console.error('[Subscriptions Service] _upsertMap error:', e); }
    }
    const categoryMap = { invoice: 'invoices', credit_ledger: 'credits', usage_metering: 'usage_metering', billing: 'billing' };
    await cache.del(`cms:subs:${category}`);
    return this.getCategory(categoryMap[category] || category);
  }
}

module.exports = new CmsSubscriptionsService();
