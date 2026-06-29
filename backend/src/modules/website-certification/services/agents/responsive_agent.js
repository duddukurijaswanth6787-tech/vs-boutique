const BaseQAAgent = require('./BaseQAAgent');

class ResponsiveAgent extends BaseQAAgent {
  constructor() {
    super('responsive_agent', 'Responsive Layout Auditor', 'UX');
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
        // Audit grid layout component breakpoint values
        if (comp.type === 'ProductGrid') {
          const styleTokens = comp.styleTokens || {};
          const cols = styleTokens.cols || {};

          // Check if small/xs breakpoints are set to avoid overflows
          if (!cols.xs && this.config.auditedBreakpoints?.includes('xs')) {
            this.score -= 10.0;
            this.issues.push({
              key: `resp-missing-xs-cols-${comp.id}`,
              name: 'Missing Responsive Mobile Breakpoint Grid Columns',
              type: 'WARNING',
              message: `Grid component "${comp.name}" does not configure column sizing rules for extra-small (xs) mobile displays.`,
              element: `Component ID: ${comp.id}`,
              safetyLevel: 'SAFE_AUTO_FIX',
              fixSuggestion: 'Inject column grid configuration properties matching mobile layouts.'
            });
            this.recs.push({
              issueKey: `resp-missing-xs-cols-${comp.id}`,
              description: 'Inject standard mobile viewport grid columns properties.',
              proposedChange: { action: 'set_style_tokens', componentId: comp.id, styleTokens: { ...styleTokens, cols: { ...cols, xs: 1 } } }
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

module.exports = ResponsiveAgent;
