const prisma = require('../../../utils/prisma');
const { calculateHealth } = require('./health-score.service');
const { getLifecycle, getAllLifecycles } = require('./lifecycle.service');
const { getEngagement } = require('./engagement.service');
const { getTimeline } = require('./timeline.service');
const { getRecommendations } = require('./recommendation.service');
const { getAnalytics } = require('./analytics.service');

async function getOverview(businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      boutique: { select: { id: true, name: true, email: true, mobileNumber: true } },
      websites: { select: { id: true, name: true, status: true } },
      _count: { select: { users: true } }
    }
  });
  if (!business) return null;

  const [health, lifecycle, engagement] = await Promise.all([
    calculateHealth(businessId),
    getLifecycle(businessId),
    getEngagement(businessId)
  ]);

  return {
    business: {
      id: business.id,
      name: business.name,
      status: business.status,
      email: business.boutique?.email || 'N/A',
      phone: business.boutique?.mobileNumber || 'N/A',
      boutique: business.boutique,
      staffCount: business._count?.users || 0,
      websiteCount: business.websites?.length || 0,
      createdAt: business.createdAt
    },
    health,
    lifecycle,
    engagement
  };
}

async function listBusinesses(options = {}) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;
  const search = options.search || '';
  const status = options.status || '';

  const where = {};
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { boutique: { email: { contains: search, mode: 'insensitive' } } }
  ];
  if (status) where.status = status;

  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        boutique: { select: { email: true } }
      }
    }),
    prisma.business.count({ where })
  ]);

  const enriched = await Promise.allSettled(
    businesses.map(async (b) => {
      const [health, lifecycle] = await Promise.all([
        calculateHealth(b.id).catch(() => null),
        getLifecycle(b.id).catch(() => null)
      ]);
      const mapped = {
        id: b.id,
        name: b.name,
        status: b.status,
        createdAt: b.createdAt,
        email: b.boutique?.email || 'N/A',
        health: health?.overall || 0,
        riskLevel: health?.riskLevel || 'unknown',
        stage: lifecycle?.stage || 'unknown'
      };
      return mapped;
    })
  );

  return {
    businesses: enriched.filter(r => r.status === 'fulfilled').map(r => r.value),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

async function getCustomerDetail(businessId) {
  const [health, lifecycle, engagement, recommendations] = await Promise.all([
    calculateHealth(businessId),
    getLifecycle(businessId),
    getEngagement(businessId),
    getRecommendations(businessId)
  ]);
  return { health, lifecycle, engagement, recommendations };
}

module.exports = { getOverview, listBusinesses, getCustomerDetail, calculateHealth, getLifecycle, getEngagement, getTimeline, getRecommendations, getAnalytics, getAllLifecycles };
