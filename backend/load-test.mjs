#!/usr/bin/env node
// ponytail: minimal load test script — no dependencies, uses Node.js built-in fetch
// Usage: node load-test.mjs [base_url] [duration_seconds] [concurrency]

const BASE_URL = process.argv[2] || 'http://localhost:4000';
const DURATION_SEC = parseInt(process.argv[3] || '30');
const CONCURRENCY = parseInt(process.argv[4] || '10');

const endpoints = [
  { name: 'Health', method: 'GET', path: '/health', auth: false },
  { name: 'Products List', method: 'GET', path: '/api/v1/products?page=1&limit=10', auth: false },
  { name: 'Categories List', method: 'GET', path: '/api/v1/categories', auth: false },
  { name: 'Brands List', method: 'GET', path: '/api/v1/brands', auth: false },
  { name: 'Dashboard Summary', method: 'GET', path: '/api/v1/dashboard/summary', auth: true },
  { name: 'Orders List', method: 'GET', path: '/api/v1/orders?page=1&limit=10', auth: true },
  { name: 'Customers List', method: 'GET', path: '/api/v1/customer-profile?page=1&limit=10', auth: true },
  { name: 'Settings List', method: 'GET', path: '/api/v1/app-settings', auth: true },
];

const results = new Map();
let running = true;
let totalRequests = 0;
let totalErrors = 0;
let totalLatency = 0;

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function makeRequest(endpoint) {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      signal: AbortSignal.timeout(10000),
    });
    const latency = performance.now() - start;
    const status = res.status;

    if (!results.has(endpoint.name)) results.set(endpoint.name, { latencies: [], errors: 0, total: 0 });
    const r = results.get(endpoint.name);
    r.latencies.push(latency);
    r.total++;
    totalRequests++;
    totalLatency += latency;

    if (status >= 400) {
      r.errors++;
      totalErrors++;
    }
  } catch (err) {
    const latency = performance.now() - start;
    if (!results.has(endpoint.name)) results.set(endpoint.name, { latencies: [], errors: 0, total: 0 });
    const r = results.get(endpoint.name);
    r.latencies.push(latency);
    r.total++;
    r.errors++;
    totalRequests++;
    totalErrors++;
    totalLatency += latency;
  }
}

async function worker() {
  while (running) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    await makeRequest(endpoint);
  }
}

async function main() {
  console.log(`\n=== Load Test ===`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Duration: ${DURATION_SEC}s`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Endpoints: ${endpoints.length}`);
  console.log(`Starting...\n`);

  const startTime = Date.now();

  // Start workers
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }

  // Progress reporter
  const progressInterval = setInterval(() => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const rps = totalRequests / ((Date.now() - startTime) / 1000) || 0;
    process.stdout.write(`\r  [${elapsed}s] ${totalRequests} requests | ${rps.toFixed(1)} req/s | ${totalErrors} errors`);
  }, 1000);

  // Stop after duration
  await new Promise(resolve => setTimeout(resolve, DURATION_SEC * 1000));
  running = false;
  clearInterval(progressInterval);

  await Promise.all(workers);

  const totalTime = (Date.now() - startTime) / 1000;
  const allLatencies = [];
  for (const r of results.values()) allLatencies.push(...r.latencies);

  console.log(`\n\n=== Results ===`);
  console.log(`Duration: ${totalTime.toFixed(1)}s`);
  console.log(`Total requests: ${totalRequests}`);
  console.log(`Requests/sec: ${(totalRequests / totalTime).toFixed(1)}`);
  console.log(`Total errors: ${totalErrors} (${((totalErrors / totalRequests) * 100).toFixed(2)}%)`);
  console.log(`\nLatency (ms):`);
  console.log(`  Avg: ${(totalLatency / totalRequests).toFixed(1)}`);
  console.log(`  P50: ${percentile(allLatencies, 50).toFixed(1)}`);
  console.log(`  P95: ${percentile(allLatencies, 95).toFixed(1)}`);
  console.log(`  P99: ${percentile(allLatencies, 99).toFixed(1)}`);
  console.log(`  Max: ${Math.max(...allLatencies).toFixed(1)}`);

  console.log(`\nPer-endpoint:`);
  for (const [name, r] of results) {
    const avg = r.latencies.reduce((a, b) => a + b, 0) / r.latencies.length;
    const p95 = percentile(r.latencies, 95);
    const errRate = ((r.errors / r.total) * 100).toFixed(1);
    console.log(`  ${name}: avg=${avg.toFixed(0)}ms p95=${p95.toFixed(0)}ms err=${errRate}% (${r.total} reqs)`);
  }

  console.log(`\n=== Acceptance Criteria ===`);
  const avgLatency = totalLatency / totalRequests;
  const p95 = percentile(allLatencies, 95);
  const errRate = (totalErrors / totalRequests) * 100;
  console.log(`  Avg <200ms: ${avgLatency < 200 ? '✅ PASS' : '❌ FAIL'} (${avgLatency.toFixed(0)}ms)`);
  console.log(`  P95 <500ms: ${p95 < 500 ? '✅ PASS' : '❌ FAIL'} (${p95.toFixed(0)}ms)`);
  console.log(`  Error <1%:  ${errRate < 1 ? '✅ PASS' : '❌ FAIL'} (${errRate.toFixed(2)}%)`);
}

main().catch(console.error);
