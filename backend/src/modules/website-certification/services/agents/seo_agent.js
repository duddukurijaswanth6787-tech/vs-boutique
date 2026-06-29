const BaseQAAgent = require('./BaseQAAgent');

class SEOAgent extends BaseQAAgent {
  constructor() {
    super('seo_agent', 'SEO & Metadata Auditor', 'SEO');
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
      // 1. Audit title length
      const title = page.title || '';
      if (title.length < 10) {
        this.score -= 10.0;
        this.issues.push({
          key: `seo-title-short-${page.id}`,
          name: 'Short Page Title',
          type: 'WARNING',
          message: `Page "${page.title}" has a very short title (${title.length} chars). Title tags should be at least 10 chars.`,
          element: `Page: ${page.slug}`,
          safetyLevel: 'SUGGESTED',
          fixSuggestion: `Lengthen title tag for ${page.title} to improve search visibility.`
        });
        this.recs.push({
          issueKey: `seo-title-short-${page.id}`,
          description: `Optimize title tag for page "${page.title}" to be descriptive.`,
          proposedChange: { action: 'set_page_title', pageId: page.id, title: `${title} | Premium Couture & Custom Fashion` }
        });
      }

      // 2. Audit meta description bindings
      // Check if universal content contains meta description key
      const content = payload.contents || [];
      const hasMetaDesc = content.some(c => c.key === `${page.slug}-meta-description` && c.baseText?.length > 30);
      if (!hasMetaDesc && this.config.requireMetaDescription) {
        this.score -= 15.0;
        this.issues.push({
          key: `seo-meta-desc-missing-${page.slug}`,
          name: 'Missing SEO Meta Description',
          type: 'ERROR',
          message: `Page "${page.title}" is missing an optimized meta description content block.`,
          element: `Page: ${page.slug}`,
          safetyLevel: 'SAFE_AUTO_FIX',
          fixSuggestion: 'Create a descriptive meta description in universal contents.'
        });
        this.recs.push({
          issueKey: `seo-meta-desc-missing-${page.slug}`,
          description: `Automatically generate a descriptive meta description for page "${page.title}".`,
          proposedChange: { action: 'create_meta_desc', pageSlug: page.slug, key: `${page.slug}-meta-description`, value: `Bespoke tailoring, custom design couture and premium alterations for ${page.title}. Discover high quality fabrics.` }
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

module.exports = SEOAgent;
