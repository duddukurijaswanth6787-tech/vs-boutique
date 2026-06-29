const BaseQAAgent = require('./BaseQAAgent');

class UxUiAgent extends BaseQAAgent {
  constructor() {
    super('ux_ui_agent', 'UI / UX Auditor', 'UX');
    this.score = 100.0;
    this.issues = [];
    this.recs = [];
  }

  async execute(targetRelease, context) {
    this.score = 100.0;
    this.issues = [];
    this.recs = [];

    const payload = targetRelease.payloadDump || {};
    const pages = payload.pages || [];

    pages.forEach(page => {
      const components = page.components || [];
      components.forEach(comp => {
        // Audit custom padding variables or button dimensions
        if (comp.type === 'Hero') {
          const styleTokens = comp.styleTokens || {};
          const padding = styleTokens.padding || '';

          if (padding === 'none') {
            this.score -= 10.0;
            this.issues.push({
              key: `ux-short-padding-${comp.id}`,
              name: 'Zero Element Spacing Warning',
              type: 'WARNING',
              message: `Hero panel "${comp.name}" sets zero padding spacing, which might cause text clipping.`,
              element: `Component: ${comp.name}`,
              safetyLevel: 'SUGGESTED',
              fixSuggestion: 'Set safe container padding margins.'
            });
            this.recs.push({
              issueKey: `ux-short-padding-${comp.id}`,
              description: 'Adjust container padding to standard spacing value.',
              proposedChange: { action: 'set_style_tokens', componentId: comp.id, styleTokens: { ...styleTokens, padding: 'md' } }
            });
          }
        }
      });
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

module.exports = UxUiAgent;
