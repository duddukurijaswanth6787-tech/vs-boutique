import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Failure rate metric (auth/permission rejections count as failures for alerting).
const failures = new Rate('request_failures');

// Scenario: simulates an admin browsing the dashboard + reports.
// The backend caches dashboard summary (60s) and reports (120s), so a steady
// load mainly exercises cache hits after the first warm-up request.
export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 10,
      duration: '1m',
    },
    soak: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    request_failures: ['rate<0.01'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:4000';
const API = `${BASE}/api`; // adjust to your API prefix
const TOKEN = __ENV.AUTH_TOKEN || '';

const params = {
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  },
  tags: { stage: 'admin' },
};

const endpoints = [
  '/dashboard/summary',
  '/dashboard/sales-chart?period=monthly',
  '/dashboard/cancellation-refund-trends',
  '/dashboard/inventory-valuation',
  '/reports/sales',
  '/reports/orders',
  '/reports/inventory',
  '/reports/customers',
  '/reports/payments',
  '/categories/tree',
  '/brands',
  '/settings',
];

export default function () {
  for (const ep of endpoints) {
    const res = http.get(`${API}${ep}`, params);
    const ok = check(res, {
      'status is 200': (r) => r.status === 200,
      'has body': (r) => r.body && r.body.length > 2,
    });
    failures.add(!ok);
    sleep(0.5);
  }
}
