// IToolService Interface definition
class IToolService {
  async registerTool(tool) {
    throw new Error("Method registerTool() must be implemented.");
  }
  async execute(toolId, params) {
    throw new Error("Method execute() must be implemented.");
  }
  async listEnabledTools() {
    throw new Error("Method listEnabledTools() must be implemented.");
  }
}

module.exports = IToolService;
