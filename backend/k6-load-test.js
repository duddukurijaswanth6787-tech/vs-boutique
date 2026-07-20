// ponytail: k6 load test script — requires k6 installed (https://k6.io)
// Usage: k6 run --vus 10 --duration 2m k6-load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const latency = new Trend('latency');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // ramp up
    { duration: '1m', target: 10 },     // steady state
    { duration: '30s', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'avg<200'],
    errors: ['rate<0.01'],
  },
};

const endpoints = [
  { name: 'Health', method: 'GET', url: `${BASE_URL}/health` },
  { name: 'Products', method: 'GET', url: `${BASE_URL}/api/v1/products?page=1&limit=10` },
  { name: 'Categories', method: 'GET', url: `${BASE_URL}/api/v1/categories` },
  { name: 'Brands', method: 'GET', url: `${BASE_URL}/api/v1/brands` },
];

export default function () {
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

  const res = http.get(endpoint.url, {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s',
  });

  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'latency < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(res.status >= 400);
  latency.add(res.timings.duration);

  sleep(0.1);
}
