const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');
const crypto = require('crypto');

const WEBHOOK_SETTINGS_KEY = 'developer_webhooks';

async function _getWebhookConfigs() {
  const setting = await prisma.platformSetting.findUnique({ where: { key: WEBHOOK_SETTINGS_KEY } });
  return setting ? setting.value : [];
}

async function _saveWebhookConfigs(configs) {
  await prisma.platformSetting.upsert({
    where: { key: WEBHOOK_SETTINGS_KEY },
    update: { value: configs },
    create: { key: WEBHOOK_SETTINGS_KEY, value: configs }
  });
}

async function listWebhooks(businessId) {
  const configs = await _getWebhookConfigs();
  return configs.filter(w => w.businessId === businessId);
}

async function createWebhook(businessId, { name, url, events, secret, status }) {
  const configs = await _getWebhookConfigs();
  const webhook = {
    id: crypto.randomUUID(),
    businessId,
    name,
    url,
    events: events || ['*'],
    secret: secret || crypto.randomBytes(16).toString('hex'),
    status: status || 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  configs.push(webhook);
  await _saveWebhookConfigs(configs);
  return webhook;
}

async function updateWebhook(webhookId, data) {
  const configs = await _getWebhookConfigs();
  const idx = configs.findIndex(w => w.id === webhookId);
  if (idx === -1) return null;
  configs[idx] = { ...configs[idx], ...data, updatedAt: new Date().toISOString() };
  await _saveWebhookConfigs(configs);
  return configs[idx];
}

async function deleteWebhook(webhookId) {
  let configs = await _getWebhookConfigs();
  configs = configs.filter(w => w.id !== webhookId);
  await _saveWebhookConfigs(configs);
}

async function triggerWebhooks(eventType, payload) {
  const configs = await _getWebhookConfigs();
  const matched = configs.filter(w =>
    w.status === 'ACTIVE' && (w.events.includes('*') || w.events.includes(eventType))
  );
  for (const webhook of matched) {
    _deliverWebhook(webhook, eventType, payload).catch(() => {});
  }
  return matched.length;
}

async function _deliverWebhook(webhook, eventType, payload) {
  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': eventType
      },
      body: JSON.stringify({ event: eventType, data: payload })
    });
    if (res.ok) {
      eventBus.emit(Events.DEVELOPER_WEBHOOK_SENT, { webhookId: webhook.id, eventType });
    } else {
      eventBus.emit(Events.DEVELOPER_WEBHOOK_FAILED, { webhookId: webhook.id, eventType, status: res.status });
    }
  } catch {
    eventBus.emit(Events.DEVELOPER_WEBHOOK_FAILED, { webhookId: webhook.id, eventType, error: 'delivery_failed' });
  }
}

module.exports = { listWebhooks, createWebhook, updateWebhook, deleteWebhook, triggerWebhooks };
