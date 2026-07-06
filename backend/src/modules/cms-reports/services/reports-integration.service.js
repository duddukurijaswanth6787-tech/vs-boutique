const eventBus = require('../../../services/eventBus').eventBus;
const reportsService = require('./reports.service');

class ReportsIntegrationService {
  start() {
    eventBus.on('CertificationCompleted', this._handleCertificationCompleted.bind(this));
    console.warn('[ReportsIntegration] Subscribed to ai-core eventBus: CertificationCompleted');
  }

  async _handleCertificationCompleted(data) {
    try {
      const { certificationId, uploadId, businessId, userId } = data || {};
      if (!certificationId) {
        console.warn('[ReportsIntegration] CertificationCompleted event missing certificationId');
        return;
      }

      console.warn(`[ReportsIntegration] Auto-generating report for certification ${certificationId}`);

      const report = await reportsService.generateReport(
        uploadId || null,
        certificationId,
        userId || 'system',
        businessId || null,
        `Certification Auto-Report`
      );

      console.warn(`[ReportsIntegration] Report ${report.id} auto-generated for certification ${certificationId}`);
      eventBus.emit('report:auto-generated', {
        reportId: report.id,
        certificationId,
        businessId
      });
    } catch (err) {
      console.error(`[ReportsIntegration] Failed to auto-generate report: ${err.message}`);
    }
  }
}

module.exports = new ReportsIntegrationService();
