class BaseQAAgent {
  constructor(agentKey, name, category) {
    this.agentKey = agentKey;
    this.name = name;
    this.category = category;
    this.config = {};
  }

  /**
   * Initialize agent parameters.
   */
  async initialize(configJson) {
    this.config = configJson || {};
  }

  /**
   * Execute audit code. Target is the ImmutableRelease record payload.
   */
  async execute(targetRelease, context) {
    throw new Error('execute() must be implemented by subclasses.');
  }

  /**
   * Calculate score contribution (0.0 to 100.0).
   */
  calculateScore() {
    return 100.0;
  }

  /**
   * Return audit issues.
   */
  generateIssues() {
    return [];
  }

  /**
   * Return improvement recommendations.
   */
  generateRecommendations() {
    return [];
  }

  /**
   * Teardown logic.
   */
  async cleanup() {
    // Override in subclasses
  }
}

module.exports = BaseQAAgent;
