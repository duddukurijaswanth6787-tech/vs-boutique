const crypto = require('crypto');
const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');

const HASH_ALGO = 'sha256';
const KEY_PREFIX = 'dev_';

function generateKey() {
  const raw = KEY_PREFIX + crypto.randomBytes(32).toString('hex');
  const prefix = raw.substring(0, 20);
  const hash = crypto.createHash(HASH_ALGO).update(raw).digest('hex');
  return { raw, prefix, hash };
}

function hashKey(key) {
  return crypto.createHash(HASH_ALGO).update(key).digest('hex');
}

function generateWebhookSecret() {
  return 'whsec_' + crypto.randomBytes(24).toString('hex');
}

async function createKey(businessId, { name, scopes, environment, expiresAt, allowedIps, rateLimitOverride, createdBy }) {
  const { raw, prefix, hash } = generateKey();
  const webhookSigningSecret = generateWebhookSecret();
  const key = await prisma.developerApiKey.create({
    data: {
      businessId,
      name,
      key: hash,
      prefix,
      scopes: scopes || [],
      environment: environment || 'PRODUCTION',
      expiresAt: expiresAt || null,
      allowedIps: allowedIps || [],
      rateLimitOverride: rateLimitOverride || null,
      webhookSigningSecret,
      createdBy: createdBy || null,
      metadata: {}
    }
  });
  eventBus.emit(Events.DEVELOPER_APIKEY_CREATED, { businessId, keyId: key.id, name });
  return { ...key, raw };
}

async function listKeys(businessId) {
  const keys = await prisma.developerApiKey.findMany({
    where: { businessId },
    select: {
      id: true, name: true, prefix: true, status: true, environment: true,
      scopes: true, expiresAt: true, lastUsedAt: true, createdAt: true,
      rotatedAt: true, revokedAt: true, usageCount: true, rateLimitOverride: true
    },
    orderBy: { createdAt: 'desc' }
  });
  return keys;
}

async function getKey(keyId) {
  const k = await prisma.developerApiKey.findUnique({ where: { id: keyId } });
  if (!k) return null;
  const { key: _, webhookSigningSecret: _s, ...safe } = k;
  return safe;
}

async function validateKey(rawKey) {
  const hash = hashKey(rawKey);
  const k = await prisma.developerApiKey.findUnique({ where: { key: hash } });
  if (!k) return null;
  if (k.status !== 'ACTIVE') return null;
  if (k.expiresAt && new Date(k.expiresAt) < new Date()) return null;
  await prisma.developerApiKey.update({
    where: { id: k.id },
    data: { lastUsedAt: new Date(), usageCount: { increment: 1 } }
  }).catch(() => {});
  return k;
}

async function revokeKey(keyId) {
  const k = await prisma.developerApiKey.update({
    where: { id: keyId },
    data: { status: 'REVOKED', revokedAt: new Date() }
  });
  eventBus.emit(Events.DEVELOPER_APIKEY_REVOKED, { businessId: k.businessId, keyId: k.id, name: k.name });
  return k;
}

async function rotateKey(keyId) {
  const existing = await prisma.developerApiKey.findUnique({ where: { id: keyId } });
  if (!existing) return null;
  const { raw, prefix, hash } = generateKey();
  const newWebhookSecret = generateWebhookSecret();
  const updated = await prisma.developerApiKey.update({
    where: { id: keyId },
    data: { key: hash, prefix, rotatedAt: new Date(), webhookSigningSecret: newWebhookSecret }
  });
  eventBus.emit(Events.DEVELOPER_APIKEY_ROTATED, { businessId: existing.businessId, keyId: existing.id, name: existing.name });
  return { ...updated, raw };
}

async function deleteKey(keyId) {
  await prisma.developerApiKey.delete({ where: { id: keyId } });
}

async function updateKey(keyId, data) {
  const k = await prisma.developerApiKey.update({ where: { id: keyId }, data });
  const { key: _, webhookSigningSecret: _s, ...safe } = k;
  return safe;
}

module.exports = { createKey, listKeys, getKey, validateKey, revokeKey, rotateKey, deleteKey, updateKey };
