const BaseQAAgent = require('./BaseQAAgent');

class SecurityAgent extends BaseQAAgent {
  constructor() {
    super('security_agent', 'CSP & Security Auditor', 'SECURITY');
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

    // Audit for unsafe HTTP URLs in visual configurations
    const typography = theme.typography || {};
    const headingFont = typography.headingFont || '';
    if (headingFont.startsWith('http://')) {
      this.score -= 20.0;
      this.issues.push({
        key: 'sec-http-font-url',
        name: 'Insecure External Asset Reference',
        type: 'ERROR',
        message: 'External fonts or assets loaded using insecure HTTP connection protocol.',
        element: `Font config: ${headingFont}`,
        safetyLevel: 'SAFE_AUTO_FIX',
        fixSuggestion: 'Upgrade font protocol connection endpoint to secure HTTPS.'
      });
      this.recs.push({
        issueKey: 'sec-http-font-url',
        description: 'Upgrade Google Fonts resource connection link to HTTPS.',
        proposedChange: { action: 'upgrade_font_protocol', secureUrl: headingFont.replace('http://', 'https://') }
      });
    }

    // Audit for CSP inline javascript in custom layout scripts
    const pages = payload.pages || [];
    pages.forEach(page => {
      const components = page.components || [];
      components.forEach(comp => {
        const editableProps = comp.editableProperties || {};
        const customScript = editableProps.customScript || '';
        if (customScript.includes('<script') && this.config.blockInlineScripts) {
          this.score -= 25.0;
          this.issues.push({
            key: `sec-inline-script-${comp.id}`,
            name: 'CSP Inline Script Violation',
            type: 'ERROR',
            message: `Component "${comp.name}" defines inline executable javascript tags blocking Content Security Policy (CSP).`,
            element: `Component: ${comp.name}`,
            safetyLevel: 'MANUAL_APPROVAL_REQUIRED',
            fixSuggestion: 'Move scripts to separate modular assets or use nonce headers.'
          });
          this.recs.push({
            issueKey: `sec-inline-script-${comp.id}`,
            description: 'Isolate custom scripts from element attributes to meet security standards.',
            proposedChange: { action: 'sanitize_custom_script', componentId: comp.id }
          });
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

module.exports = SecurityAgent;
