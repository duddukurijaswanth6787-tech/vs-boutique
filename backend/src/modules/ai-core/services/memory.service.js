const IMemoryService = require('../interfaces/IMemoryService');
const prisma = require('../../../utils/prisma');
const crypto = require('crypto');
const logger = require('../utils/logger');

class MemoryService extends IMemoryService {
  constructor() {
    super();
  }

  async saveArtifact(sessionId, agentId, payload, version = '1.0.0', parentArtifactId = null) {
    const stringified = JSON.stringify(payload);
    const checksum = crypto.createHash('sha256').update(stringified).digest('hex');

    logger.info(`Saving artifact for session ${sessionId} created by ${agentId} with checksum: ${checksum.substring(0, 10)}`);

    const artifact = await prisma.aIArtifact.create({
      data: {
        version,
        checksum,
        createdByAgent: agentId,
        schemaVersion: '1.0.0',
        parentArtifactId,
        status: 'Finalized',
        payload: payload
      }
    });

    return artifact;
  }

  async loadArtifact(artifactId) {
    const artifact = await prisma.aIArtifact.findUnique({
      where: { id: artifactId }
    });

    if (!artifact) {
      throw new Error(`Artifact with ID '${artifactId}' not found.`);
    }

    return artifact;
  }

  async getConversationHistory(contextId) {
    return prisma.aIConversation.findMany({
      where: { contextId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async searchKnowledgeBase(query, limit = 10) {
    // Basic text search over key/value fields in AIKnowledgeBase
    return prisma.aIKnowledgeBase.findMany({
      where: {
        OR: [
          { key: { contains: query, mode: 'insensitive' } },
          { value: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: limit
    });
  }
}

module.exports = new MemoryService();
