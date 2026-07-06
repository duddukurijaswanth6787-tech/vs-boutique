const prisma = require('../../../utils/prisma');

const FRAMEWORKS = [
  { id: 'gdpr', label: 'GDPR', description: 'General Data Protection Regulation' },
  { id: 'soc2', label: 'SOC 2', description: 'Service Organization Control 2' },
  { id: 'iso27001', label: 'ISO 27001', description: 'Information Security Management' },
  { id: 'hipaa', label: 'HIPAA', description: 'Health Insurance Portability and Accountability Act' },
  { id: 'pci', label: 'PCI DSS', description: 'Payment Card Industry Data Security Standard' }
];

const DEFAULT_POLICIES = FRAMEWORKS.map(f => ({
  framework: f.id,
  label: f.label,
  status: 'not_started',
  enabled: false,
  controls: []
}));

function _getPoliciesKey(businessId) { return `compliance:policies:${businessId}`; }

async function getPolicies(businessId) {
  const key = _getPoliciesKey(businessId);
  const setting = await prisma.cmsAiSettings.findUnique({ where: { key } });

  if (!setting) {
    return DEFAULT_POLICIES.map(p => ({ ...p }));
  }

  return setting.value;
}

async function updatePolicy(businessId, framework, updates) {
  const key = _getPoliciesKey(businessId);
  const setting = await prisma.cmsAiSettings.findUnique({ where: { key } });

  let policies = setting ? setting.value : DEFAULT_POLICIES.map(p => ({ ...p }));
  const idx = policies.findIndex(p => p.framework === framework);

  if (idx === -1) {
    policies.push({ ...DEFAULT_POLICIES.find(p => p.framework === framework), ...updates });
  } else {
    policies[idx] = { ...policies[idx], ...updates };
  }

  await prisma.cmsAiSettings.upsert({
    where: { key },
    create: { key, value: policies, category: 'compliance', description: `Compliance policies for ${businessId}` },
    update: { value: policies }
  });

  return policies.find(p => p.framework === framework);
}

async function getFrameworkMapping() {
  return FRAMEWORKS;
}

async function countBusinessesWithPolicies() {
  try {
    const count = await prisma.cmsAiSettings.count({
      where: { key: { startsWith: 'compliance:policies:' } }
    });
    return count;
  } catch { return 0; }
}

module.exports = { getPolicies, updatePolicy, getFrameworkMapping, countBusinessesWithPolicies };
