const prisma = require('../../../utils/prisma');
const { notificationsService } = require('../../notifications/services/notifications.service');
const cache = require('../middleware/notification-cache');

async function getTemplates() {
  const cacheKey = 'templates';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const templates = await notificationsService.getTemplates();
  await cache.set(cacheKey, templates, 120);
  return templates;
}

async function getTemplate(templateId) {
  const templates = await getTemplates();
  return templates.find(t => t.id === templateId) || null;
}

async function createTemplate(data) {
  const template = await notificationsService.createTemplate(data);
  await cache.delPattern('*');
  return template;
}

async function updateTemplate(templateId, data) {
  const existing = await prisma.notificationTemplate.findUnique({ where: { id: templateId } });
  if (!existing) throw new Error('Template not found');
  const updated = await prisma.notificationTemplate.update({
    where: { id: templateId },
    data: { name: data.name, subject: data.subject, body: data.body, channels: data.channels }
  });
  await cache.delPattern('*');
  return updated;
}

async function deleteTemplate(templateId) {
  const existing = await prisma.notificationTemplate.findUnique({ where: { id: templateId } });
  if (!existing) throw new Error('Template not found');
  await prisma.notificationTemplate.delete({ where: { id: templateId } });
  await cache.delPattern('*');
  return { deleted: true };
}

async function previewTemplate(templateId, variables = {}) {
  const template = await prisma.notificationTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new Error('Template not found');
  let subject = template.subject;
  let body = template.body;
  for (const [key, value] of Object.entries(variables)) {
    subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return { subject, body };
}

async function getTemplateVariables() {
  return [
    { key: 'userName', description: 'Recipient username' },
    { key: 'businessName', description: 'Business name' },
    { key: 'boutiqueName', description: 'Boutique name' },
    { key: 'orderId', description: 'Order ID' },
    { key: 'amount', description: 'Monetary amount' },
    { key: 'date', description: 'Current date' },
    { key: 'link', description: 'Action URL' },
    { key: 'reason', description: 'Reason for notification' }
  ];
}

module.exports = { getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, previewTemplate, getTemplateVariables };
