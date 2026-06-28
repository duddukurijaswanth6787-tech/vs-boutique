// IProviderService Interface definition
class IProviderService {
  async generate(systemPrompt, userPrompt, schema) {
    throw new Error("Method generate() must be implemented.");
  }
  async stream(systemPrompt, userPrompt) {
    throw new Error("Method stream() must be implemented.");
  }
  async countTokens(text) {
    throw new Error("Method countTokens() must be implemented.");
  }
  async estimateCost(model, tokensCount) {
    throw new Error("Method estimateCost() must be implemented.");
  }
}

module.exports = IProviderService;
