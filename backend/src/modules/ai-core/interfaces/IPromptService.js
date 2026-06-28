// IPromptService Interface definition
class IPromptService {
  async getPrompt(templateId, version) {
    throw new Error("Method getPrompt() must be implemented.");
  }
  async createPrompt(name, content) {
    throw new Error("Method createPrompt() must be implemented.");
  }
  async compilePrompt(templateId, variables) {
    throw new Error("Method compilePrompt() must be implemented.");
  }
  async rollbackPrompt(templateId, targetVersion) {
    throw new Error("Method rollbackPrompt() must be implemented.");
  }
}

module.exports = IPromptService;
