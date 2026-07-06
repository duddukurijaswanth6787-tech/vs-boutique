const prisma = require('../../../utils/prisma');
const eventBus = require('../../../services/eventBus').eventBus;
const certificationService = require('../../website-certification/services/certification.service');
const templatesService = require('../../cms-templates/services/templates.service');

const SECTION_TYPES = {
  FOLDER: 'FOLDER',
  COMPONENTS: 'COMPONENTS',
  APIS: 'APIS',
  CMS_COMPATIBILITY: 'CMS_COMPATIBILITY',
  PERFORMANCE: 'PERFORMANCE',
  SEO: 'SEO',
  ACCESSIBILITY: 'ACCESSIBILITY',
  SECURITY: 'SECURITY',
  RESPONSIVE: 'RESPONSIVE',
  AI_RECOMMENDATIONS: 'AI_RECOMMENDATIONS',
  SUMMARY: 'SUMMARY',
  OVERALL_SCORE: 'OVERALL_SCORE'
};

const SECTION_ORDER = [
  'FOLDER', 'COMPONENTS', 'APIS', 'CMS_COMPATIBILITY',
  'PERFORMANCE', 'SEO', 'ACCESSIBILITY', 'SECURITY', 'RESPONSIVE',
  'AI_RECOMMENDATIONS', 'SUMMARY', 'OVERALL_SCORE'
];

class ReportsService {
  async generateReport(uploadId, certificationId, userId, businessId, sourceLabel) {
    let upload = null;
    let certification = null;

    if (uploadId) {
      upload = await prisma.cmsUpload.findUnique({ where: { id: uploadId } });
      if (!upload) throw new Error('Upload not found');
      businessId = businessId || upload.businessId;
    }

    if (certificationId) {
      certification = await prisma.boutiqueCertification.findUnique({ where: { id: certificationId } });
      if (!certification) throw new Error('Certification not found');
      businessId = businessId || certification.businessId;
    }

    if (!businessId) throw new Error('Business ID is required');

    const report = await prisma.cmsValidationReport.create({
      data: {
        businessId,
        uploadId: uploadId || null,
        certificationId: certificationId || null,
        templateId: upload?.blueprintId ? null : null,
        overallScore: 0,
        status: 'GENERATING',
        generatedBy: userId,
        sourceType: certificationId ? 'CERTIFICATION' : 'VERIFICATION',
        sourceLabel: sourceLabel || (certification ? `Certification #${certification.releaseTag}` : upload ? `Upload #${upload.filename}` : 'Manual Report'),
        certificationSummary: certification ? {
          id: certification.id,
          releaseTag: certification.releaseTag,
          overallScore: certification.overallScore,
          scoresMap: certification.scoresMap,
          status: certification.status,
          createdAt: certification.createdAt
        } : null,
        aiRecommendations: await this._getAiRecommendations(certification, upload),
        templateVersion: await this._getTemplateVersion(certification, upload)
      }
    });

    const sections = await this._generateSections(report.id, certification, upload, userId);
    const overallScore = this._calculateOverallScore(sections);

    const updated = await prisma.cmsValidationReport.update({
      where: { id: report.id },
      data: {
        overallScore,
        status: 'COMPLETED',
        sections: {
          connect: sections.map(s => ({ id: s.id }))
        }
      },
      include: { sections: true }
    });

    await this._recordHistory(report.id, 'GENERATED', null, 'COMPLETED', { uploadId, certificationId }, userId);
    eventBus.emit('report:generated', { reportId: report.id, businessId, overallScore });

    return updated;
  }

  async getReport(id) {
    return prisma.cmsValidationReport.findUnique({
      where: { id },
      include: {
        sections: { orderBy: { executionOrder: 'asc' } }
      }
    });
  }

  async listReports(params = {}) {
    const { page = 1, limit = 20, businessId, search, sortBy = 'createdAt', sortOrder = 'desc', status, sectionType, minScore, maxScore, dateFrom, dateTo } = params;
    const where = {};

    if (businessId) where.businessId = businessId;
    if (status) where.status = status;
    if (minScore !== undefined || maxScore !== undefined) {
      where.overallScore = {};
      if (minScore !== undefined) where.overallScore.gte = parseFloat(minScore);
      if (maxScore !== undefined) where.overallScore.lte = parseFloat(maxScore);
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (search) {
      where.OR = [
        { sourceLabel: { contains: search, mode: 'insensitive' } },
        { id: { contains: search } }
      ];
    }
    if (sectionType) {
      where.sections = { some: { sectionType } };
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [reports, total] = await Promise.all([
      prisma.cmsValidationReport.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { sections: { orderBy: { executionOrder: 'asc' } } }
      }),
      prisma.cmsValidationReport.count({ where })
    ]);

    return { reports, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async regenerateReport(id, userId) {
    const existing = await prisma.cmsValidationReport.findUnique({ where: { id } });
    if (!existing) throw new Error('Report not found');

    const newReport = await this.generateReport(
      existing.uploadId,
      existing.certificationId,
      userId,
      existing.businessId,
      `${existing.sourceLabel} (Regenerated)`
    );

    await this._recordHistory(id, 'REGENERATED', existing.status, 'ARCHIVED', { regeneratedTo: newReport.id }, userId);
    eventBus.emit('report:regenerated', { originalId: id, newId: newReport.id, businessId: existing.businessId });

    return newReport;
  }

  async deleteReport(id) {
    const report = await prisma.cmsValidationReport.findUnique({ where: { id } });
    if (!report) throw new Error('Report not found');
    await prisma.cmsValidationReportHistory.deleteMany({ where: { reportId: id } });
    await prisma.cmsValidationReportSection.deleteMany({ where: { reportId: id } });
    await prisma.cmsValidationReportExport.deleteMany({ where: { reportId: id } });
    await prisma.cmsValidationReport.delete({ where: { id } });
    return { deleted: true };
  }

  async compareReports(reportId1, reportId2, userId) {
    const [r1, r2] = await Promise.all([this.getReport(reportId1), this.getReport(reportId2)]);
    if (!r1 || !r2) throw new Error('One or both reports not found');

    const sections1 = r1.sections || [];
    const sections2 = r2.sections || [];
    const diffData = {};
    const sectionDiffs = [];

    for (const type of SECTION_ORDER) {
      const s1 = sections1.find(s => s.sectionType === type);
      const s2 = sections2.find(s => s.sectionType === type);
      const diff = {
        type,
        score1: s1?.score ?? null,
        score2: s2?.score ?? null,
        scoreDiff: s1?.score != null && s2?.score != null ? s2.score - s1.score : null,
        status1: s1?.status ?? 'N/A',
        status2: s2?.status ?? 'N/A',
        issues1Count: Array.isArray(s1?.issues) ? s1.issues.length : 0,
        issues2Count: Array.isArray(s2?.issues) ? s2.issues.length : 0,
        issuesDiff: (Array.isArray(s2?.issues) ? s2.issues.length : 0) - (Array.isArray(s1?.issues) ? s1.issues.length : 0)
      };
      sectionDiffs.push(diff);
      diffData[type] = diff;
    }

    const summary = {
      overallScore1: r1.overallScore,
      overallScore2: r2.overallScore,
      overallDiff: r2.overallScore - r1.overallScore,
      totalSections1: sections1.length,
      totalSections2: sections2.length,
      passed1: sections1.filter(s => s.status === 'PASSED').length,
      passed2: sections2.filter(s => s.status === 'PASSED').length,
      report1Date: r1.createdAt,
      report2Date: r2.createdAt,
      report1Label: r1.sourceLabel,
      report2Label: r2.sourceLabel
    };

    const comparison = await prisma.cmsValidationReportComparison.create({
      data: {
        businessId: r1.businessId,
        reportId1,
        reportId2,
        diffData,
        summary,
        createdBy: userId
      }
    });

    return { ...comparison, sectionDiffs };
  }

  async exportReport(id, format, userId) {
    const report = await this.getReport(id);
    if (!report) throw new Error('Report not found');

    const exportRecord = await prisma.cmsValidationReportExport.create({
      data: {
        reportId: id,
        format: format.toUpperCase(),
        status: 'GENERATING',
        createdBy: userId
      }
    });

    let fileUrl = null;
    try {
      if (format === 'json') {
        fileUrl = await this._exportJson(report, exportRecord.id);
      } else if (format === 'csv') {
        fileUrl = await this._exportCsv(report, exportRecord.id);
      } else {
        fileUrl = await this._exportJson(report, exportRecord.id);
      }

      await prisma.cmsValidationReportExport.update({
        where: { id: exportRecord.id },
        data: { status: 'COMPLETED', fileUrl, completedAt: new Date() }
      });
    } catch (err) {
      await prisma.cmsValidationReportExport.update({
        where: { id: exportRecord.id },
        data: { status: 'FAILED', errorDetails: err.message }
      });
      throw err;
    }

    eventBus.emit('report:exported', { reportId: id, exportId: exportRecord.id, format, businessId: report.businessId });
    return { exportId: exportRecord.id, format, fileUrl };
  }

  async _exportJson(report, exportId) {
    const data = {
      report: {
        id: report.id,
        overallScore: report.overallScore,
        status: report.status,
        sourceLabel: report.sourceLabel,
        sourceType: report.sourceType,
        certificationSummary: report.certificationSummary,
        aiRecommendations: report.aiRecommendations,
        templateVersion: report.templateVersion,
        createdAt: report.createdAt
      },
      sections: (report.sections || []).map(s => ({
        type: s.sectionType,
        score: s.score,
        maxScore: s.maxScore,
        status: s.status,
        issues: s.issues,
        suggestions: s.suggestions,
        data: s.data
      })),
      exportedAt: new Date().toISOString()
    };
    return `/api/v1/cms/reports/exports/${exportId}/download?type=json`;
  }

  async _exportCsv(report, exportId) {
    const rows = [['Section', 'Score', 'Max Score', 'Status', 'Issues', 'Suggestions']];
    (report.sections || []).forEach(s => {
      rows.push([
        s.sectionType,
        s.score ?? '',
        s.maxScore ?? '',
        s.status,
        (Array.isArray(s.issues) ? s.issues.length : 0).toString(),
        (Array.isArray(s.suggestions) ? s.suggestions.length : 0).toString()
      ]);
    });
    return `/api/v1/cms/reports/exports/${exportId}/download?type=csv`;
  }

  async getAnalytics(params = {}) {
    const { businessId, periodStart, periodEnd } = params;

    const where = { status: 'COMPLETED' };
    if (businessId) where.businessId = businessId;
    if (periodStart || periodEnd) {
      where.createdAt = {};
      if (periodStart) where.createdAt.gte = new Date(periodStart);
      if (periodEnd) where.createdAt.lte = new Date(periodEnd);
    }

    const reports = await prisma.cmsValidationReport.findMany({
      where,
      include: { sections: true },
      orderBy: { createdAt: 'asc' }
    });

    const totalReports = reports.length;
    if (totalReports === 0) {
      return {
        totalReports: 0, avgScore: 0, passCount: 0, failCount: 0,
        scoreDistribution: {}, sectionAverages: {}, trends: []
      };
    }

    const avgScore = reports.reduce((sum, r) => sum + r.overallScore, 0) / totalReports;
    const passCount = reports.filter(r => r.overallScore >= 70).length;
    const failCount = totalReports - passCount;

    const scoreDistribution = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    reports.forEach(r => {
      const s = r.overallScore;
      if (s <= 20) scoreDistribution['0-20']++;
      else if (s <= 40) scoreDistribution['21-40']++;
      else if (s <= 60) scoreDistribution['41-60']++;
      else if (s <= 80) scoreDistribution['61-80']++;
      else scoreDistribution['81-100']++;
    });

    const sectionTotals = {};
    const sectionCounts = {};
    reports.forEach(r => {
      (r.sections || []).forEach(s => {
        if (s.score != null) {
          sectionTotals[s.sectionType] = (sectionTotals[s.sectionType] || 0) + s.score;
          sectionCounts[s.sectionType] = (sectionCounts[s.sectionType] || 0) + 1;
        }
      });
    });
    const sectionAverages = {};
    Object.keys(sectionTotals).forEach(k => {
      sectionAverages[k] = sectionCounts[k] > 0 ? sectionTotals[k] / sectionCounts[k] : 0;
    });

    const trends = reports.map(r => ({
      date: r.createdAt,
      score: r.overallScore,
      label: r.sourceLabel
    }));

    return {
      totalReports, avgScore: Math.round(avgScore * 100) / 100,
      passCount, failCount,
      passRate: totalReports > 0 ? Math.round((passCount / totalReports) * 100) : 0,
      scoreDistribution, sectionAverages, trends
    };
  }

  async getHistory(reportId) {
    return prisma.cmsValidationReportHistory.findMany({
      where: { reportId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSection(id, sectionType) {
    return prisma.cmsValidationReportSection.findUnique({
      where: { reportId_sectionType: { reportId: id, sectionType } }
    });
  }

  async getSources() {
    const [uploads, certifications] = await Promise.all([
      prisma.cmsUpload.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.boutiqueCertification.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
    ]);
    return { uploads, certifications };
  }

  async getStats(businessId) {
    const where = businessId ? { businessId } : {};
    const [total, completed, failed, avgResult] = await Promise.all([
      prisma.cmsValidationReport.count({ where }),
      prisma.cmsValidationReport.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.cmsValidationReport.count({ where: { ...where, status: 'FAILED' } }),
      prisma.cmsValidationReport.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _avg: { overallScore: true }
      })
    ]);
    return {
      total,
      completed,
      failed,
      avgScore: avgResult._avg?.overallScore ? Math.round(avgResult._avg.overallScore * 100) / 100 : 0,
      passRate: completed > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  async getTrends(businessId) {
    const where = businessId ? { businessId, status: 'COMPLETED' } : { status: 'COMPLETED' };
    const reports = await prisma.cmsValidationReport.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: { overallScore: true, createdAt: true, sourceLabel: true }
    });

    const byMonth = {};
    reports.forEach(r => {
      const key = r.createdAt.toISOString().substring(0, 7);
      if (!byMonth[key]) byMonth[key] = { scores: [], count: 0 };
      byMonth[key].scores.push(r.overallScore);
      byMonth[key].count++;
    });

    return Object.entries(byMonth).map(([month, data]) => ({
      month,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      count: data.count
    }));
  }

  async _generateSections(reportId, certification, upload, userId) {
    const sections = [];

    for (const type of SECTION_ORDER) {
      const sectionData = await this._buildSectionData(type, certification, upload);
      const section = await prisma.cmsValidationReportSection.create({
        data: {
          reportId,
          sectionType: type,
          score: sectionData.score,
          maxScore: sectionData.maxScore,
          status: sectionData.status,
          issues: sectionData.issues || [],
          suggestions: sectionData.suggestions || [],
          data: sectionData.data || {},
          executionOrder: SECTION_ORDER.indexOf(type)
        }
      });
      sections.push(section);
    }

    return sections;
  }

  async _buildSectionData(sectionType, certification, upload) {
    const base = { issues: [], suggestions: [], data: {} };

    if (!certification) {
      return { ...base, score: null, maxScore: null, status: 'SKIPPED', data: { message: 'No certification data available' } };
    }

    const scores = certification.scoresMap || {};
    const issues = certification.issues || [];
    const suggestions = certification.suggestions || [];
    const agentRuns = certification.agentRuns || {};

    switch (sectionType) {
      case 'FOLDER':
        return {
          score: null,
          maxScore: null,
          status: 'INFO',
          issues: [],
          suggestions: [],
          data: {
            releaseTag: certification.releaseTag,
            targetType: certification.targetType,
            structureVerified: true
          }
        };

      case 'COMPONENTS':
        return {
          score: null,
          maxScore: null,
          status: 'INFO',
          issues: [],
          suggestions: [],
          data: { componentCount: Object.keys(agentRuns).length, agents: Object.keys(agentRuns) }
        };

      case 'APIS':
        return {
          score: null,
          maxScore: null,
          status: 'INFO',
          issues: [],
          suggestions: [],
          data: { apiEndpoints: [] }
        };

      case 'CMS_COMPATIBILITY':
        return {
          score: scores.compatibility != null ? scores.compatibility : scores.cms_compatibility ?? null,
          maxScore: 100,
          status: this._scoreStatus(scores.compatibility ?? scores.cms_compatibility),
          issues: issues.filter(i => i.category === 'compatibility' || i.category === 'cms'),
          suggestions: suggestions.filter(s => s.category === 'compatibility' || s.category === 'cms'),
          data: {}
        };

      case 'PERFORMANCE':
        return {
          score: scores.performance_agent ?? scores.performance ?? null,
          maxScore: 100,
          status: this._scoreStatus(scores.performance_agent ?? scores.performance),
          issues: issues.filter(i => i.category === 'performance' || i.agent === 'performance_agent'),
          suggestions: suggestions.filter(s => s.category === 'performance' || s.agent === 'performance_agent'),
          data: agentRuns.performance_agent || {}
        };

      case 'SEO':
        return {
          score: scores.seo_agent ?? scores.seo ?? null,
          maxScore: 100,
          status: this._scoreStatus(scores.seo_agent ?? scores.seo),
          issues: issues.filter(i => i.category === 'seo' || i.agent === 'seo_agent'),
          suggestions: suggestions.filter(s => s.category === 'seo' || s.agent === 'seo_agent'),
          data: agentRuns.seo_agent || {}
        };

      case 'ACCESSIBILITY':
        return {
          score: scores.accessibility_agent ?? scores.accessibility ?? null,
          maxScore: 100,
          status: this._scoreStatus(scores.accessibility_agent ?? scores.accessibility),
          issues: issues.filter(i => i.category === 'accessibility' || i.agent === 'accessibility_agent'),
          suggestions: suggestions.filter(s => s.category === 'accessibility' || s.agent === 'accessibility_agent'),
          data: agentRuns.accessibility_agent || {}
        };

      case 'SECURITY':
        return {
          score: scores.security_agent ?? scores.security ?? null,
          maxScore: 100,
          status: this._scoreStatus(scores.security_agent ?? scores.security),
          issues: issues.filter(i => i.category === 'security' || i.agent === 'security_agent'),
          suggestions: suggestions.filter(s => s.category === 'security' || s.agent === 'security_agent'),
          data: agentRuns.security_agent || {}
        };

      case 'RESPONSIVE':
        return {
          score: scores.responsive_agent ?? scores.responsive ?? null,
          maxScore: 100,
          status: this._scoreStatus(scores.responsive_agent ?? scores.responsive),
          issues: issues.filter(i => i.category === 'responsive' || i.agent === 'responsive_agent'),
          suggestions: suggestions.filter(s => s.category === 'responsive' || s.agent === 'responsive_agent'),
          data: agentRuns.responsive_agent || {}
        };

      case 'AI_RECOMMENDATIONS':
        return {
          score: null,
          maxScore: null,
          status: 'INFO',
          issues: [],
          suggestions: suggestions,
          data: { recommendationCount: suggestions.length, autoFixItems: [] }
        };

      case 'SUMMARY':
        return {
          score: certification.overallScore,
          maxScore: 100,
          status: this._scoreStatus(certification.overallScore),
          issues: issues.slice(0, 10),
          suggestions: suggestions.slice(0, 5),
          data: {
            overallScore: certification.overallScore,
            totalIssues: issues.length,
            totalSuggestions: suggestions.length,
            releaseTag: certification.releaseTag,
            status: certification.status
          }
        };

      case 'OVERALL_SCORE':
        return {
          score: certification.overallScore,
          maxScore: 100,
          status: this._scoreStatus(certification.overallScore),
          issues: [],
          suggestions: [],
          data: { scoresMap: scores }
        };

      default:
        return { ...base, score: null, maxScore: null, status: 'SKIPPED' };
    }
  }

  async _getAiRecommendations(certification, upload) {
    if (!certification) return null;
    const autoFixItems = await prisma.autoFixQueueItem.findMany({
      where: { releaseTag: certification.releaseTag },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return {
      autoFixItems: autoFixItems.map(a => ({
        issueKey: a.issueKey,
        safetyLevel: a.safetyLevel,
        description: a.description,
        status: a.status
      })),
      totalRecommendations: autoFixItems.length,
      criticalItems: autoFixItems.filter(a => a.safetyLevel === 'CRITICAL').length
    };
  }

  async _getTemplateVersion(certification, upload) {
    if (!certification) return null;
    const templates = await prisma.cmsTemplate.findMany({
      where: { certificationId: certification.id },
      select: { id: true, name: true, version: true, status: true },
      take: 1
    });
    if (templates.length > 0) {
      return { id: templates[0].id, name: templates[0].name, version: templates[0].version, status: templates[0].status };
    }
    return null;
  }

  async _recordHistory(reportId, action, previousStatus, newStatus, changes, userId) {
    return prisma.cmsValidationReportHistory.create({
      data: { reportId, action, previousStatus, newStatus, changes, performedBy: userId }
    });
  }

  _calculateOverallScore(sections) {
    const scored = sections.filter(s => s.score != null && s.maxScore != null && s.maxScore > 0);
    if (scored.length === 0) return 0;
    const totalWeight = scored.length;
    const totalScore = scored.reduce((sum, s) => sum + (s.score / s.maxScore) * 100, 0);
    return Math.round(totalScore / totalWeight);
  }

  _scoreStatus(score) {
    if (score == null) return 'SKIPPED';
    if (score >= 80) return 'PASSED';
    if (score >= 50) return 'WARNING';
    return 'FAILED';
  }
}

module.exports = new ReportsService();
