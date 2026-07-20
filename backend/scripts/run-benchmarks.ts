import { spawn } from 'child_process';
import http from 'http';
import * as fs from 'fs';
import * as path from 'path';

const PORT = 4001;
const BASE_URL = `http://localhost:${PORT}/api/v1`;
const RESULT_PATH = path.join(__dirname, '../benchmark-results.json');

// Helper to make HTTP requests
function httpRequest(
  method: string,
  urlPath: string,
  headers: Record<string, string> = {},
  body: any = null
): Promise<{ statusCode: number; headers: any; data: any; duration: number }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlPath.startsWith('http') ? urlPath : `${BASE_URL}${urlPath}`);
    const start = performance.now();
    const options = {
      method,
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      timeout: 30000
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        const end = performance.now();
        const duration = end - start;
        let parsed = rawData;
        try {
          parsed = JSON.parse(rawData);
        } catch {}
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          data: parsed,
          duration
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request Timeout'));
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

// Stats helper
function getStats(durations: number[]) {
  const sorted = [...durations].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  
  const getPercentile = (p: number) => {
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  };

  return {
    min: Math.round(min * 100) / 100,
    p50: Math.round(getPercentile(50) * 100) / 100,
    p95: Math.round(getPercentile(95) * 100) / 100,
    p99: Math.round(getPercentile(99) * 100) / 100,
    max: Math.round(max * 100) / 100,
    avg: Math.round(avg * 100) / 100,
  };
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('Starting NestJS server on port 4001 for benchmark testing...');

  const dbUrl = 'postgresql://postgres:postgres@localhost:5432/vasanthi_benchmark?schema=public';
  
  // Spawn the compiled production build of the backend
  const serverProcess = spawn('node', ['dist/src/main.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: PORT.toString(),
      DATABASE_URL: dbUrl,
      NODE_ENV: 'development',
      ENABLE_REDIS: 'false',
      ENABLE_BULLMQ: 'false',
    },
    shell: true
  });

  serverProcess.stdout.on('data', (data) => {
    const logStr = data.toString();
    if (logStr.includes('Nest application successfully started')) {
      console.log('Server process reports: Nest application successfully started.');
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[SERVER STDERR] ${data}`);
  });

  // Poll system health until ready (query raw /health endpoint on port 4001)
  let isReady = false;
  console.log('Waiting for backend server to boot...');
  for (let i = 0; i < 30; i++) {
    try {
      const res = await httpRequest('GET', `http://localhost:${PORT}/health`);
      if (res.statusCode === 200) {
        isReady = true;
        break;
      }
    } catch (e) {}
    await wait(1000);
  }

  if (!isReady) {
    console.error('NestJS backend failed to start on port 4001 in 30 seconds.');
    serverProcess.kill('SIGKILL');
    process.exit(1);
  }

  console.log('Backend is up and running. Starting benchmarks...');

  // Authenticate as Admin
  console.log('Authenticating Super Admin user...');
  const loginRes = await httpRequest('POST', '/auth/login', {}, {
    email: 'superadmin@vasanthidesigners.com',
    password: 'SuperAdminSecurePassword123!'
  });

  if (loginRes.statusCode !== 200 && loginRes.statusCode !== 201) {
    console.error('Authentication failed:', loginRes.data);
    serverProcess.kill();
    process.exit(1);
  }

  const token = loginRes.data.data.accessToken;
  const authHeaders = { Authorization: `Bearer ${token}` };
  console.log('Authentication successful.');

  const results: any = {
    apiLatencies: {},
    pagination: {},
    search: {},
    filters: {},
    concurrency: {},
  };

  // List of paths to test in Phase 7
  const routesToTest = [
    { name: 'dashboard_summary', path: '/dashboard/summary' },
    { name: 'sales_chart', path: '/dashboard/sales-chart?period=monthly' },
    { name: 'products_list', path: '/products?limit=10' },
    { name: 'orders_list', path: '/orders?limit=10' },
    { name: 'inventory_list', path: '/inventory?limit=10' },
    { name: 'social_analytics', path: '/admin/social/analytics/summary' },
  ];

  // 1. Phase 7 & 8: Benchmark Admin APIs directly (Cold vs Warm)
  for (const route of routesToTest) {
    console.log(`Benchmarking API: ${route.name} (${route.path})...`);
    
    // Cold start is the very first request
    const coldStartRes = await httpRequest('GET', route.path, authHeaders);
    const coldDuration = coldStartRes.duration;

    // Warm-up requests
    for (let w = 0; w < 5; w++) {
      await httpRequest('GET', route.path, authHeaders);
    }

    // Measured requests
    const durations: number[] = [];
    let responseSize = 0;
    let httpStatus = 200;
    let rowsCount = 0;

    for (let r = 0; r < 30; r++) {
      const res = await httpRequest('GET', route.path, authHeaders);
      durations.push(res.duration);
      if (r === 0) {
        httpStatus = res.statusCode;
        responseSize = JSON.stringify(res.data).length;
        if (res.data && Array.isArray(res.data.data)) {
          rowsCount = res.data.data.length;
        } else if (res.data && res.data.data && Array.isArray(res.data.data.data)) {
          rowsCount = res.data.data.data.length;
        }
      }
    }

    const stats = getStats(durations);

    results.apiLatencies[route.name] = {
      path: route.path,
      httpStatus,
      responseSize,
      rowsReturned: rowsCount,
      coldDuration,
      ...stats
    };
  }

  // 2. Phase 9: Benchmark Pagination Depth
  const paginationTests = [
    { name: 'products_page_1', path: '/products?page=1&limit=10' },
    { name: 'products_page_middle', path: '/products?page=50&limit=10' },
    { name: 'products_page_deep', path: '/products?page=100&limit=10' },
    
    { name: 'orders_page_1', path: '/orders?page=1&limit=10' },
    { name: 'orders_page_middle', path: '/orders?page=250&limit=10' },
    { name: 'orders_page_deep', path: '/orders?page=500&limit=10' },
    
    { name: 'inventory_page_1', path: '/inventory?page=1&limit=10' },
    { name: 'inventory_page_middle', path: '/inventory?page=100&limit=10' },
    { name: 'inventory_page_deep', path: '/inventory?page=200&limit=10' },
  ];

  for (const test of paginationTests) {
    console.log(`Pagination Test: ${test.name} (${test.path})...`);
    
    // Warm-up
    await httpRequest('GET', test.path, authHeaders);

    const durations: number[] = [];
    for (let r = 0; r < 10; r++) {
      const res = await httpRequest('GET', test.path, authHeaders);
      durations.push(res.duration);
    }
    const stats = getStats(durations);
    results.pagination[test.name] = {
      path: test.path,
      p50: stats.p50,
      p95: stats.p95
    };
  }

  // 3. Phase 10: Benchmark Search
  const searchTests = [
    // Products
    { name: 'products_search_exact', path: '/products?search=SKU-500-100500' },
    { name: 'products_search_prefix', path: '/products?search=SKU-5' },
    { name: 'products_search_partial', path: '/products?search=Title' },
    { name: 'products_search_nomatch', path: '/products?search=XYZNonExistentSearchTerm' },
    // Orders
    { name: 'orders_search_exact', path: '/orders?search=ORD-1000500' },
    { name: 'orders_search_prefix', path: '/orders?search=ORD-10' },
    { name: 'orders_search_partial', path: '/orders?search=St' },
    { name: 'orders_search_nomatch', path: '/orders?search=XYZNonExistentSearchTerm' },
  ];

  for (const test of searchTests) {
    console.log(`Search Test: ${test.name} (${test.path})...`);
    
    const res = await httpRequest('GET', test.path, authHeaders);
    let matchedCount = 0;
    if (res.data && Array.isArray(res.data.data)) {
      matchedCount = res.data.data.length;
    } else if (res.data && res.data.data && Array.isArray(res.data.data.data)) {
      matchedCount = res.data.data.data.length;
    }

    const durations: number[] = [];
    for (let r = 0; r < 10; r++) {
      const runRes = await httpRequest('GET', test.path, authHeaders);
      durations.push(runRes.duration);
    }
    const stats = getStats(durations);
    results.search[test.name] = {
      path: test.path,
      rowsMatched: matchedCount,
      p50: stats.p50,
      p95: stats.p95
    };
  }

  // 4. Phase 11: Benchmark Filters and Sorting
  const filterTests = [
    // Products
    { name: 'products_filter_status_active', path: '/products?status=ACTIVE&sortBy=createdAt&sortOrder=desc' },
    { name: 'products_filter_brand', path: '/products?brandId=brand-uuid-1' },
    { name: 'products_filter_price_range', path: '/products?minPrice=1000&maxPrice=3000' },
    // Orders
    { name: 'orders_filter_status_shipped', path: '/orders?status=SHIPPED&sortBy=createdAt&sortOrder=desc' },
    // Inventory
    { name: 'inventory_filter_lowstock', path: '/inventory?stockStatus=LOW_STOCK' },
    { name: 'inventory_filter_outofstock', path: '/inventory?stockStatus=OUT_OF_STOCK' },
  ];

  for (const test of filterTests) {
    console.log(`Filter/Sort Test: ${test.name} (${test.path})...`);

    const res = await httpRequest('GET', test.path, authHeaders);
    let matchedCount = 0;
    if (res.data && Array.isArray(res.data.data)) {
      matchedCount = res.data.data.length;
    } else if (res.data && res.data.data && Array.isArray(res.data.data.data)) {
      matchedCount = res.data.data.data.length;
    }

    const durations: number[] = [];
    for (let r = 0; r < 10; r++) {
      const runRes = await httpRequest('GET', test.path, authHeaders);
      durations.push(runRes.duration);
    }
    const stats = getStats(durations);
    results.filters[test.name] = {
      path: test.path,
      rowsMatched: matchedCount,
      p50: stats.p50,
      p95: stats.p95
    };
  }

  // 5. Phase 18: Test Concurrent Admin Load
  const concurrencyProfiles = [1, 5, 10, 25];
  const trafficMix = [
    { weight: 0.30, path: '/dashboard/summary' },
    { weight: 0.25, path: '/products?limit=10' },
    { weight: 0.20, path: '/orders?limit=10' },
    { weight: 0.10, path: '/inventory?limit=10' },
    { weight: 0.15, path: '/admin/social/analytics/summary' },
  ];

  // Select a path based on the weights
  const getRandomPath = () => {
    const rnd = Math.random();
    let cumulative = 0;
    for (const mix of trafficMix) {
      cumulative += mix.weight;
      if (rnd <= cumulative) return mix.path;
    }
    return trafficMix[0].path;
  };

  for (const concurrency of concurrencyProfiles) {
    console.log(`Running concurrency load test: Profile = ${concurrency} users...`);
    const totalRequests = 100;
    const start = performance.now();

    let successCount = 0;
    let errorCount = 0;
    const durations: number[] = [];

    // Helper to run requests in chunks equal to concurrency
    const runWorker = async () => {
      while (durations.length < totalRequests) {
        const path = getRandomPath();
        try {
          const res = await httpRequest('GET', path, authHeaders);
          durations.push(res.duration);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (e) {
          errorCount++;
          durations.push(30000);
        }
      }
    };

    // Spawn concurrent workers
    const workers = [];
    for (let w = 0; w < concurrency; w++) {
      workers.push(runWorker());
    }
    await Promise.all(workers);

    const end = performance.now();
    const totalDurationMs = end - start;
    const rps = totalRequests / (totalDurationMs / 1000);
    const stats = getStats(durations);

    results.concurrency[`users_${concurrency}`] = {
      concurrency,
      requests: totalRequests,
      successRate: (successCount / totalRequests) * 100,
      errorRate: (errorCount / totalRequests) * 100,
      p50: stats.p50,
      p95: stats.p95,
      p99: stats.p99,
      rps: Math.round(rps * 100) / 100
    };
  }

  // Cleanup
  console.log('Tearing down NestJS backend server...');
  serverProcess.kill('SIGINT');

  console.log('Writing results file to:', RESULT_PATH);
  fs.writeFileSync(RESULT_PATH, JSON.stringify(results, null, 2));

  console.log('Benchmarks completed successfully!');
}

main().catch(err => {
  console.error('Benchmark execution failed:', err);
  process.exit(1);
});
