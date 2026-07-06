const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const ENCODING = 'hex';

class EncryptionService {
  constructor() {
    this.encryptionKey = crypto.createHash('sha256')
      .update(process.env.AI_ENCRYPTION_KEY || process.env.JWT_SECRET || 'ai-center-default-key')
      .digest();
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
    let encrypted = cipher.update(String(text), 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);
    const authTag = cipher.getAuthTag().toString(ENCODING);
    return `${iv.toString(ENCODING)}:${authTag}:${encrypted}`;
  }

  decrypt(encryptedText) {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted format');
    const iv = Buffer.from(parts[0], ENCODING);
    const authTag = Buffer.from(parts[1], ENCODING);
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

module.exports = new EncryptionService();
