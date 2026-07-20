import { Injectable } from '@nestjs/common';
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

// ponytail: Prometheus metrics — single registry, default metrics + custom app metrics
@Injectable()
export class MetricsService {
  readonly registry: Registry;

  // HTTP metrics
  readonly httpRequestsTotal: Counter<string>;
  readonly httpRequestDuration: Histogram<string>;
  readonly httpErrorsTotal: Counter<string>;

  // Business metrics
  readonly queueJobsTotal: Counter<string>;
  readonly cacheHitsTotal: Counter<string>;
  readonly cacheMissesTotal: Counter<string>;
  readonly dbQueryDuration: Histogram<string>;

  // System gauges
  readonly activeConnections: Gauge<string>;

  constructor() {
    this.registry = new Registry();

    // Collect default Node.js metrics (CPU, memory, event loop, GC)
    collectDefaultMetrics({ register: this.registry, prefix: 'vasanthi_' });

    // HTTP request counter
    this.httpRequestsTotal = new Counter({
      name: 'vasanthi_http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    // HTTP request duration
    this.httpRequestDuration = new Histogram({
      name: 'vasanthi_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    // HTTP errors
    this.httpErrorsTotal = new Counter({
      name: 'vasanthi_http_errors_total',
      help: 'Total HTTP errors (4xx/5xx)',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    // Queue jobs
    this.queueJobsTotal = new Counter({
      name: 'vasanthi_queue_jobs_total',
      help: 'Total queue jobs processed',
      labelNames: ['queue', 'status'],
      registers: [this.registry],
    });

    // Cache hits
    this.cacheHitsTotal = new Counter({
      name: 'vasanthi_cache_hits_total',
      help: 'Total cache hits',
      labelNames: ['key_prefix'],
      registers: [this.registry],
    });

    // Cache misses
    this.cacheMissesTotal = new Counter({
      name: 'vasanthi_cache_misses_total',
      help: 'Total cache misses',
      labelNames: ['key_prefix'],
      registers: [this.registry],
    });

    // DB query duration
    this.dbQueryDuration = new Histogram({
      name: 'vasanthi_db_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['model', 'action'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });

    // Active connections
    this.activeConnections = new Gauge({
      name: 'vasanthi_active_connections',
      help: 'Number of active connections',
      registers: [this.registry],
    });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
