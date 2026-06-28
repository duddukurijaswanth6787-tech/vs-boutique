// IMemoryService Interface definition
class IMemoryService {
  async saveArtifact(sessionId, agentId, payload) {
    throw new Error("Method saveArtifact() must be implemented.");
  }
  async loadArtifact(artifactId) {
    throw new Error("Method loadArtifact() must be implemented.");
  }
  async getConversationHistory(contextId) {
    throw new Error("Method getConversationHistory() must be implemented.");
  }
  async searchKnowledgeBase(query, limit) {
    throw new Error("Method searchKnowledgeBase() must be implemented.");
  }
}

module.exports = IMemoryService;
