const http = require('http');

const request = (url) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          time: Date.now() - start
        });
      });
    }).on('error', reject);
  });
};

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function test() {
  // Use a known boutique ID from the database
  const boutiqueId = '9713de00-8c88-48c2-9ecc-902b86954f96';
  const BASE = 'http://localhost:3005';

  const endpoints = [
    { label: 'GET /boutiques/public',                  url: `${BASE}/boutiques/public` },
    { label: `GET /boutiques/public/:id`,              url: `${BASE}/boutiques/public/${boutiqueId}` },
    { label: `GET /reviews/boutique/:id`,              url: `${BASE}/reviews/boutique/${boutiqueId}` },
  ];

  console.log('\n========== LATENCY TEST ==========\n');
  const results = [];

  for (const ep of endpoints) {
    // Cache-Miss: first request
    const miss = await request(ep.url);
    await delay(50);
    // Cache-Hit: second request (should serve from in-memory cache)
    const hit = await request(ep.url);

    results.push({ label: ep.label, miss: miss.time, hit: hit.time });
    console.log(`${ep.label}`);
    console.log(`  Cache Miss : ${miss.time}ms   |   Cache Hit : ${hit.time}ms`);
  }

  console.log('\n=========== SUMMARY TABLE ===========');
  console.log(`${'Endpoint'.padEnd(35)} | ${'Cache Miss'.padStart(12)} | ${'Cache Hit'.padStart(12)} | ${'Improvement'.padStart(12)}`);
  console.log('-'.repeat(80));
  for (const r of results) {
    const improvement = r.miss > 0 ? `${Math.round((1 - r.hit / r.miss) * 100)}%` : 'N/A';
    console.log(`${r.label.padEnd(35)} | ${(r.miss + 'ms').padStart(12)} | ${(r.hit + 'ms').padStart(12)} | ${improvement.padStart(12)}`);
  }
  console.log('=====================================\n');
}

test().catch(console.error);
