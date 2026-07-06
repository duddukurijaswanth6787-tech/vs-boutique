const EventEmitter = require('events');

const eventBus = new EventEmitter();
eventBus.setMaxListeners(100);

const Events = {
  ORDER_PLACED: 'order:placed',
  PAYMENT_FAILED: 'payment:failed',
  PAYMENT_SUCCESS: 'payment:success',
  ORDER_SHIPPED: 'order:shipped',
  ORDER_DELIVERED: 'order:delivered',
  ORDER_CANCELLED: 'order:cancelled',
  REVIEW_SUBMITTED: 'review:submitted',
  REVIEW_REPLIED: 'review:replied',
  MEASUREMENT_SUBMITTED: 'measurement:submitted',
  RETURN_REQUESTED: 'return:requested',
  RETURN_STATUS_CHANGED: 'return:status_changed',
  EXCHANGE_REQUESTED: 'exchange:requested',
  EXCHANGE_STATUS_CHANGED: 'exchange:status_changed',
  BOOKING_CREATED: 'booking:created',
  BOOKING_CONFIRMED: 'booking:confirmed',
  BOOKING_REJECTED: 'booking:rejected',
  LOW_STOCK: 'inventory:low_stock',
  MONITORING_ALERT: 'monitoring:alert',
  // Workflow lifecycle events (Phase 19)
  WORKFLOW_STARTED: 'workflow:started',
  WORKFLOW_COMPLETED: 'workflow:completed',
  WORKFLOW_FAILED: 'workflow:failed',
  WORKFLOW_PAUSED: 'workflow:paused',
  WORKFLOW_RESUMED: 'workflow:resumed',
  WORKFLOW_CANCELLED: 'workflow:cancelled',
  WORKFLOW_ROLLBACK: 'workflow:rollback',
  WORKFLOW_RETRY: 'workflow:retry',
  WORKFLOW_STEP_STARTED: 'workflow:step:started',
  WORKFLOW_STEP_COMPLETED: 'workflow:step:completed',
  WORKFLOW_STEP_FAILED: 'workflow:step:failed',
  // Customer Success events (Phase 20)
  CUSTOMER_HEALTH_UPDATED: 'customer:health-updated',
  CUSTOMER_RISK_DETECTED: 'customer:risk-detected',
  CUSTOMER_RECOMMENDATION_CREATED: 'customer:recommendation-created',
  // Developer Platform events (Phase 21)
  DEVELOPER_APIKEY_CREATED: 'developer:apikey-created',
  DEVELOPER_APIKEY_REVOKED: 'developer:apikey-revoked',
  DEVELOPER_APIKEY_ROTATED: 'developer:apikey-rotated',
  DEVELOPER_WEBHOOK_SENT: 'developer:webhook-sent',
  DEVELOPER_WEBHOOK_FAILED: 'developer:webhook-failed',
  // Compliance events (Phase 22)
  COMPLIANCE_VIOLATION_DETECTED: 'compliance:violation-detected',
  COMPLIANCE_SCORE_CHANGED: 'compliance:score-changed',
  // Disaster Recovery events (Phase 23)
  DISASTER_BACKUP_STARTED: 'disaster:backup-started',
  DISASTER_BACKUP_COMPLETED: 'disaster:backup-completed',
  DISASTER_BACKUP_FAILED: 'disaster:backup-failed',
  DISASTER_RESTORE_STARTED: 'disaster:restore-started',
  DISASTER_RESTORE_COMPLETED: 'disaster:restore-completed',
  DISASTER_RECOVERY_FAILED: 'disaster:recovery-failed',

  // Infrastructure events (Phase 24)
  INFRA_REGION_ONLINE: 'infra:region-online',
  INFRA_REGION_OFFLINE: 'infra:region-offline',
  INFRA_SSL_EXPIRED: 'infra:ssl-expired',
  INFRA_CAPACITY_WARNING: 'infra:capacity-warning',
  INFRA_STORAGE_WARNING: 'infra:storage-warning',
  INFRA_ENVIRONMENT_CREATED: 'infra:environment-created',

  // Analytics & BI events (Phase 25)
  ANALYTICS_REFRESHED: 'analytics:refreshed',
  EXECUTIVE_REPORT_READY: 'analytics:executive-report-ready',
  FORECAST_UPDATED: 'analytics:forecast-updated',
  KPI_THRESHOLD_REACHED: 'analytics:kpi-threshold-reached',

  // Partner & White-Label events (Phase 26)
  PARTNER_CREATED: 'partner:created',
  PARTNER_UPDATED: 'partner:updated',
  PARTNER_BRANDING_CHANGED: 'partner:branding-changed',
  PARTNER_THEME_CHANGED: 'partner:theme-changed',
  PARTNER_LICENSE_UPDATED: 'partner:license-updated',
  PARTNER_DOMAIN_ATTACHED: 'partner:domain-attached',

  // Enterprise Notification Center events (Phase 27)
  NOTIFICATION_SENT: 'notification:sent',
  NOTIFICATION_FAILED: 'notification:failed',
  NOTIFICATION_DELIVERED: 'notification:delivered',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_CLICKED: 'notification:clicked',
  NOTIFICATION_BOUNCED: 'notification:bounced',
  NOTIFICATION_PREFERENCE_CHANGED: 'notification:preference-changed',
  NOTIFICATION_TEMPLATE_UPDATED: 'notification:template-updated',
  NOTIFICATION_CAMPAIGN_STARTED: 'notification:campaign-started',
  NOTIFICATION_CAMPAIGN_COMPLETED: 'notification:campaign-completed',

  // DevOps / CI-CD Center events (Phase 28)
  DEVOPS_PIPELINE_STARTED: 'devops:pipeline-started',
  DEVOPS_PIPELINE_COMPLETED: 'devops:pipeline-completed',
  DEVOPS_PIPELINE_FAILED: 'devops:pipeline-failed',
  DEVOPS_BUILD_STARTED: 'devops:build-started',
  DEVOPS_BUILD_COMPLETED: 'devops:build-completed',
  DEVOPS_BUILD_FAILED: 'devops:build-failed',
  DEVOPS_DEPLOYMENT_STARTED: 'devops:deployment-started',
  DEVOPS_DEPLOYMENT_COMPLETED: 'devops:deployment-completed',
  DEVOPS_DEPLOYMENT_FAILED: 'devops:deployment-failed',
  DEVOPS_RELEASE_CREATED: 'devops:release-created',
  DEVOPS_RELEASE_APPROVED: 'devops:release-approved',
  DEVOPS_RELEASE_ROLLED_BACK: 'devops:release-rolled-back',
};

module.exports = { eventBus, Events };
