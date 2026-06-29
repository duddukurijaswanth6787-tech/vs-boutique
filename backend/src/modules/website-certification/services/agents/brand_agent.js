const BaseQAAgent = require('./BaseQAAgent');

class BrandAgent extends BaseQAAgent {
  constructor() {
    super('brand_agent', 'Brand Alignment Auditor', 'BRAND');
    this.score = 100.0;
    this.issues = [];
    this.recs = [];
  }

  async execute(targetRelease, context) {
    this.score = 100.0;
    this.issues = [];
    this.recs = [];

    const payload = targetRelease.payloadDump || {};
    const theme = payload.theme || {};
    const colors = theme.colorsLight || {};

    // Audit for standard enterprise brand primary color configs
    if (!colors.primary || colors.primary === '#ffffff' || colors.primary === '#000000') {
      this.score -= 20.0;
      this.issues.push({
        key: 'brand-primary-invalid',
        name: 'Monochromatic Primary Palette Warning',
        type: 'WARNING',
        message: 'Primary brand color is configured as monochromatic black/white, which degrades corporate visibility.',
        element: 'Theme: ColorsLight config',
        safetyLevel: 'SUGGESTED',
        fixSuggestion: 'Specify a corporate primary brand color from the design system.'
      });
      this.recs.push({
        issueKey: 'brand-primary-invalid',
        description: 'Update light theme primary color to royal indigo.',
        proposedChange: { action: 'set_theme_color', key: 'primary', color: '#4f46e5' }
      });
    }

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

module.exports = BrandAgent;
