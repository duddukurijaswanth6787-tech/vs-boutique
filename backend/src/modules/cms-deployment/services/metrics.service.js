const promClient = require('prom-client');

class MetricsService {
  constructor() {
    this.registry = new promClient.Registry();
    promClient.collectDefaultMetrics({ register: this.registry });

    this.deploymentTotal = new promClient.Counter({
      name: 'deployment_total',
      help: 'Total deployments by status and environment',
      labelNames: ['status', 'environment'],
      registers: [this.registry]
    });

    this.deploymentDuration = new promClient.Histogram({
      name: 'deployment_duration_seconds',
      help: 'Deployment duration in seconds',
      labelNames: ['environment'],
      buckets: [1, 5, 15, 30, 60, 120, 300, 600],
      registers: [this.registry]
    });

    this.deploymentActive = new promClient.Gauge({
      name: 'deployment_active',
      help: 'Currently active (in-progress) deployments',
      labelNames: ['environment'],
      registers: [this.registry]
    });

    this.rollbackTotal = new promClient.Counter({
      name: 'deployment_rollback_total',
      help: 'Total rollbacks performed',
      labelNames: ['environment'],
      registers: [this.registry]
    });

    this.domainTotal = new promClient.Gauge({
      name: 'deployment_domain_total',
      help: 'Total domains by status',
      labelNames: ['status'],
      registers: [this.registry]
    });

    this.envVarTotal = new promClient.Gauge({
      name: 'deployment_envvar_total',
      help: 'Total environment variables by environment',
      labelNames: ['environmentId'],
      registers: [this.registry]
    });

    this.buildLogTotal = new promClient.Counter({
      name: 'deployment_buildlog_total',
      help: 'Total build log entries by level',
      labelNames: ['level'],
      registers: [this.registry]
    });

    this.storageBytesTotal = new promClient.Gauge({
      name: 'deployment_storage_bytes',
      help: 'Total storage used by deployment artifacts in bytes',
      registers: [this.registry]
    });

    this.queueDepth = new promClient.Gauge({
      name: 'deployment_queue_depth',
      help: 'Deployment queue depth by queue name',
      labelNames: ['queue'],
      registers: [this.registry]
    });

    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    });

    this.httpRequestTotal = new promClient.Counter({
      name: 'http_request_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry]
    });

    this.queueActive = new promClient.Gauge({
      name: 'deployment_queue_active',
      help: 'Active queue processing status',
      labelNames: ['provider'],
      registers: [this.registry]
    });
  }

  recordDeployment(status, environment) {
    this.deploymentTotal.inc({ status, environment: environment || 'unknown' });
  }

  recordDeploymentDuration(environment, seconds) {
    this.deploymentDuration.observe({ environment: environment || 'unknown' }, seconds);
  }

  setActiveDeployments(environment, count) {
    this.deploymentActive.set({ environment: environment || 'unknown' }, count);
  }

  recordRollback(environment) {
    this.rollbackTotal.inc({ environment: environment || 'unknown' });
  }

  setDomainCount(status, count) {
    this.domainTotal.set({ status }, count);
  }

  setEnvVarCount(environmentId, count) {
    this.envVarTotal.set({ environmentId: environmentId || 'unknown' }, count);
  }

  recordBuildLog(level) {
    this.buildLogTotal.inc({ level: level || 'INFO' });
  }

  setStorageBytes(bytes) {
    this.storageBytesTotal.set(bytes);
  }

  setQueueDepth(queue, depth) {
    this.queueDepth.set({ queue }, depth);
  }

  recordHttpRequest(method, route, statusCode, durationSeconds) {
    const normalizedRoute = route || 'unknown';
    this.httpRequestDuration.observe(
      { method, route: normalizedRoute, status_code: String(statusCode) },
      durationSeconds
    );
    this.httpRequestTotal.inc({ method, route: normalizedRoute, status_code: String(statusCode) });
  }

  setQueueActive(connected) {
    this.queueActive.set({ provider: connected ? 'redis' : 'in-memory' }, connected ? 1 : 0);
  }

  async getMetrics() {
    return this.registry.metrics();
  }

  getContentType() {
    return this.registry.contentType;
  }
}

module.exports = new MetricsService();
