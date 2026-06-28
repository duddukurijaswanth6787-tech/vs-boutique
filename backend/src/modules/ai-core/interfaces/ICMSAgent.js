// ICMSAgent interface definition
class ICMSAgent {
  async initialize(sessionId) {
    throw new Error("Method initialize() must be implemented.");
  }
  async validateInput(inputPayload) {
    throw new Error("Method validateInput() must be implemented.");
  }
  async prepareContext() {
    throw new Error("Method prepareContext() must be implemented.");
  }
  async execute() {
    throw new Error("Method execute() must be implemented.");
  }
  async validateOutput(outputPayload) {
    throw new Error("Method validateOutput() must be implemented.");
  }
  async repair(failedPayload, errorDetail) {
    throw new Error("Method repair() must be implemented.");
  }
  async publishArtifact() {
    throw new Error("Method publishArtifact() must be implemented.");
  }
  async cleanup() {
    throw new Error("Method cleanup() must be implemented.");
  }
}

module.exports = ICMSAgent;
