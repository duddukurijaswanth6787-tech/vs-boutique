const analyticsService = require('../src/modules/analytics/services/analytics.service');
const assert = require('assert');

async function run() {
  console.log('Running Analytics Service Unit Tests...');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`  FAIL: ${name}`);
      console.error(e);
      failed++;
    }
  }

  test('calculateTrend returns correct percentage', () => {
    assert.strictEqual(analyticsService.calculateTrend(120, 100), 20.0);
    assert.strictEqual(analyticsService.calculateTrend(80, 100), -20.0);
    assert.strictEqual(analyticsService.calculateTrend(100, 100), 0.0);
    assert.strictEqual(analyticsService.calculateTrend(10, 0), 100.0);
  });

  test('formatRevenue formats correctly', () => {
    assert.strictEqual(analyticsService.formatRevenue(500), '₹500');
    assert.strictEqual(analyticsService.formatRevenue(1500), '₹1.5K');
    assert.strictEqual(analyticsService.formatRevenue(250000), '₹2.5L');
  });

  console.log(`\nRESULTS: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
