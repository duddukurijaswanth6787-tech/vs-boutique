const BaseQAAgent = require('./BaseQAAgent');

class ContentAgent extends BaseQAAgent {
  constructor() {
    super('content_agent', 'Content Quality Auditor', 'BRAND');
    this.score = 100.0;
    this.issues = [];
    this.recs = [];
  }

  async execute(targetRelease, context) {
    this.score = 100.0;
    this.issues = [];
    this.recs = [];

    const payload = targetRelease.payloadDump || {};
    const contents = payload.contents || [];

    contents.forEach(content => {
      const text = content.baseText || '';

      // Audit for empty text fields or placeholder lengths
      if (text.length === 0) {
        this.score -= 10.0;
        this.issues.push({
          key: `content-empty-${content.id}`,
          name: 'Empty Content Key Block',
          type: 'WARNING',
          message: `Universal content key "${content.key}" contains an empty text value.`,
          element: `Content Key: ${content.key}`,
          safetyLevel: 'SAFE_AUTO_FIX',
          fixSuggestion: 'Inject a descriptive fallback copy string.'
        });
        this.recs.push({
          issueKey: `content-empty-${content.id}`,
          description: `Automatically inject descriptive copy for content key "${content.key}".`,
          proposedChange: { action: 'set_content_text', contentId: content.id, text: 'Discover bespoke custom tailor fashion accessories and premium designer blouses styled for you.' }
        });
      }
    });

    if (this.score < 0) this.score = 0.0;
  }

  calculateScore() {
    return this.score;
  }

  generateIssues() {
    return this.issues;
  }

  generateRecommendations() {
    return this.recs;
  }
}

module.exports = ContentAgent;
