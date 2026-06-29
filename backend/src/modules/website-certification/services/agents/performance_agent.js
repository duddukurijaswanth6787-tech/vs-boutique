const BaseQAAgent = require('./BaseQAAgent');

class PerformanceAgent extends BaseQAAgent {
  constructor() {
    super('performance_agent', 'Performance Auditor', 'PERFORMANCE');
    this.score = 100.0;
    this.issues = [];
    this.recs = [];
  }

  async execute(targetRelease, context) {
    this.score = 100.0;
    this.issues = [];
    this.recs = [];

    const payload = targetRelease.payloadDump || {};
    const assets = payload.assets || [];

    // Audit asset sizes and formats
    assets.forEach(asset => {
      const sizeBytes = asset.meta?.sizeBytes || 0;
      const sizeKb = sizeBytes / 1024;
      const threshold = this.config.imageSizeThresholdKb || 500;

      if (sizeKb > threshold) {
        this.score -= 10.0;
        this.issues.push({
          key: `perf-asset-size-${asset.id}`,
          name: 'Large Asset Payload Warning',
          type: 'WARNING',
          message: `Asset ${asset.name} is ${sizeKb.toFixed(1)}KB, exceeding the ${threshold}KB threshold.`,
          element: `Asset ID: ${asset.id}`,
          safetyLevel: 'SUGGESTED',
          fixSuggestion: 'Compress image or request scaled CDN parameters.'
        });
        this.recs.push({
          issueKey: `perf-asset-size-${asset.id}`,
          description: `Compress and resize image asset ${asset.name}.`,
          proposedChange: { action: 'compress_asset', assetId: asset.id }
        });
      }

      // Check for non-WebP/SVG images
      const fileExt = asset.name.split('.').pop()?.toLowerCase();
      if (asset.type === 'IMAGE' && !['webp', 'svg'].includes(fileExt)) {
        this.score -= 5.0;
        this.issues.push({
          key: `perf-asset-format-${asset.id}`,
          name: 'Non-optimal Image Format',
          type: 'INFO',
          message: `Image ${asset.name} uses format .${fileExt}. WebP or SVG format is recommended.`,
          element: `Asset ID: ${asset.id}`,
          safetyLevel: 'SAFE_AUTO_FIX',
          fixSuggestion: `Convert ${asset.name} to WebP format.`
        });
        this.recs.push({
          issueKey: `perf-asset-format-${asset.id}`,
          description: `Convert ${asset.name} to WebP format.`,
          proposedChange: { action: 'convert_format', assetId: asset.id, targetFormat: 'webp' }
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

module.exports = PerformanceAgent;
