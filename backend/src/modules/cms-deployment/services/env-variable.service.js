const prisma = require('../../../utils/prisma');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const ENCODING = 'hex';

class EnvironmentVariableService {
  constructor() {
    this.encryptionKey = this._deriveKey(process.env.DEPLOYMENT_ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-key-change-in-production');
  }

  _deriveKey(secret) {
    return crypto.createHash('sha256').update(secret).digest();
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);
    const authTag = cipher.getAuthTag().toString(ENCODING);
    return `${iv.toString(ENCODING)}:${authTag}:${encrypted}`;
  }

  decrypt(encryptedText) {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format');
    }
    const iv = Buffer.from(parts[0], ENCODING);
    const authTag = Buffer.from(parts[1], ENCODING);
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async listVariables(environmentId) {
    const variables = await prisma.deploymentEnvironmentVariable.findMany({
      where: { environmentId },
      orderBy: { key: 'asc' }
    });

    return variables.map(v => ({
      id: v.id,
      environmentId: v.environmentId,
      key: v.key,
      value: v.isSecret ? '********' : this.decrypt(v.encryptedValue),
      isSecret: v.isSecret,
      version: v.version,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt
    }));
  }

  async getVariable(id) {
    const variable = await prisma.deploymentEnvironmentVariable.findUnique({ where: { id } });
    if (!variable) throw new Error('Variable not found');
    return {
      ...variable,
      value: this.decrypt(variable.encryptedValue)
    };
  }

  async createVariable(environmentId, data, userId) {
    const { key, value, isSecret } = data;
    if (!key || value === undefined) {
      throw new Error('Key and value are required');
    }

    const existing = await prisma.deploymentEnvironmentVariable.findUnique({
      where: { environmentId_key: { environmentId, key } }
    });
    if (existing) {
      throw new Error(`Variable "${key}" already exists in this environment`);
    }

    const encryptedValue = this.encrypt(String(value));

    return prisma.$transaction(async (tx) => {
      const variable = await tx.deploymentEnvironmentVariable.create({
        data: {
          environmentId,
          key,
          encryptedValue,
          isSecret: isSecret || false,
          version: 1,
          createdBy: userId
        }
      });

      await tx.deploymentVariableHistory.create({
        data: {
          variableId: variable.id,
          key,
          encryptedValue,
          isSecret: isSecret || false,
          version: 1,
          changedBy: userId
        }
      });

      return { id: variable.id, key, isSecret: variable.isSecret, version: 1 };
    });
  }

  async updateVariable(id, data, userId) {
    const { value, isSecret } = data;
    const existing = await prisma.deploymentEnvironmentVariable.findUnique({ where: { id } });
    if (!existing) throw new Error('Variable not found');

    const encryptedValue = this.encrypt(String(value));
    const newVersion = existing.version + 1;

    return prisma.$transaction(async (tx) => {
      const variable = await tx.deploymentEnvironmentVariable.update({
        where: { id },
        data: {
          encryptedValue,
          isSecret: isSecret !== undefined ? isSecret : existing.isSecret,
          version: newVersion
        }
      });

      await tx.deploymentVariableHistory.create({
        data: {
          variableId: id,
          key: existing.key,
          encryptedValue,
          isSecret: isSecret !== undefined ? isSecret : existing.isSecret,
          version: newVersion,
          changedBy: userId
        }
      });

      return { id: variable.id, key: variable.key, version: variable.version };
    });
  }

  async deleteVariable(id) {
    return prisma.$transaction(async (tx) => {
      await tx.deploymentVariableHistory.deleteMany({ where: { variableId: id } });
      return tx.deploymentEnvironmentVariable.delete({ where: { id } });
    });
  }

  async getVariableHistory(variableId) {
    return prisma.deploymentVariableHistory.findMany({
      where: { variableId },
      orderBy: { version: 'desc' }
    });
  }

  async rollbackVariable(id, targetVersion, userId) {
    const history = await prisma.deploymentVariableHistory.findFirst({
      where: { variableId: id, version: targetVersion }
    });
    if (!history) throw new Error(`Version ${targetVersion} not found in variable history`);

    return prisma.$transaction(async (tx) => {
      const variable = await tx.deploymentEnvironmentVariable.update({
        where: { id },
        data: {
          encryptedValue: history.encryptedValue,
          isSecret: history.isSecret,
          version: history.version + 1
        }
      });

      await tx.deploymentVariableHistory.create({
        data: {
          variableId: id,
          key: history.key,
          encryptedValue: history.encryptedValue,
          isSecret: history.isSecret,
          version: history.version + 1,
          changedBy: userId
        }
      });

      return { id: variable.id, key: variable.key, version: variable.version };
    });
  }

  async resolveVariables(environmentId) {
    const variables = await prisma.deploymentEnvironmentVariable.findMany({
      where: { environmentId }
    });

    const resolved = {};
    for (const v of variables) {
      resolved[v.key] = this.decrypt(v.encryptedValue);
    }
    return resolved;
  }
}

module.exports = new EnvironmentVariableService();
