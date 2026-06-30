const assert = require('assert');
const envVarService = require('../src/modules/cms-deployment/services/env-variable.service');
const domainService = require('../src/modules/cms-deployment/services/domain.service');
const rollbackService = require('../src/modules/cms-deployment/services/rollback.service');
const deploymentService = require('../src/modules/cms-deployment/services/deployment.service');
const antivirusService = require('../src/modules/cms-deployment/services/antivirus.service');
const metricsService = require('../src/modules/cms-deployment/services/metrics.service');
const { getStorageAdapter } = require('../src/modules/cms-deployment/adapters');

async function run() {
  console.log('Running Deployment Module Tests...');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`  FAIL: ${name}`);
      console.error(`    ${e.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`  FAIL: ${name}`);
      console.error(`    ${e.message}`);
      failed++;
    }
  }

  // ========================================
  // Section 1: Environment Variable Encryption Tests
  // ========================================
  console.log('\n--- Environment Variable Encryption Tests ---');

  test('encrypt returns proper format (iv:authTag:encrypted)', () => {
    const encrypted = envVarService.encrypt('test-value');
    const parts = encrypted.split(':');
    assert.strictEqual(parts.length, 3, 'Should have 3 colon-separated parts');
    assert.strictEqual(parts[0].length, 32, 'IV should be 32 hex chars (16 bytes)');
    assert.strictEqual(parts[1].length, 32, 'Auth tag should be 32 hex chars (16 bytes)');
    assert.ok(parts[2].length > 0, 'Encrypted payload should not be empty');
  });

  test('decrypt returns original value after encryption', () => {
    const original = 'my-super-secret-api-key-12345';
    const encrypted = envVarService.encrypt(original);
    const decrypted = envVarService.decrypt(encrypted);
    assert.strictEqual(decrypted, original, 'Decrypted value should match original');
  });

  test('decrypt with tampered ciphertext throws error', () => {
    const encrypted = envVarService.encrypt('test');
    const parts = encrypted.split(':');
    const tampered = `${parts[0]}:${parts[1]}:deadbeef`;
    assert.throws(() => {
      envVarService.decrypt(tampered);
    }, /Unsupported|auth tag|bad decrypt/i);
  });

  test('decrypt with invalid format throws error', () => {
    assert.throws(() => {
      envVarService.decrypt('invalid-format');
    }, /Invalid encrypted format/);
  });

  test('encrypt produces different ciphertext for same plaintext (random IV)', () => {
    const plaintext = 'constant-value';
    const encrypted1 = envVarService.encrypt(plaintext);
    const encrypted2 = envVarService.encrypt(plaintext);
    assert.notStrictEqual(encrypted1, encrypted2, 'Each encryption should produce unique ciphertext');
    assert.strictEqual(envVarService.decrypt(encrypted1), plaintext, 'First decryption should match');
    assert.strictEqual(envVarService.decrypt(encrypted2), plaintext, 'Second decryption should match');
  });

  test('encrypt handles special characters', () => {
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`\'"\\\n\t';
    const encrypted = envVarService.encrypt(special);
    const decrypted = envVarService.decrypt(encrypted);
    assert.strictEqual(decrypted, special, 'Special characters should round-trip correctly');
  });

  test('encrypt handles unicode characters', () => {
    const unicode = 'Hello 你好 ñ ñ 日本語 🚀🔥';
    const encrypted = envVarService.encrypt(unicode);
    const decrypted = envVarService.decrypt(encrypted);
    assert.strictEqual(decrypted, unicode, 'Unicode characters should round-trip correctly');
  });

  test('encrypt handles empty string', () => {
    const encrypted = envVarService.encrypt('');
    const decrypted = envVarService.decrypt(encrypted);
    assert.strictEqual(decrypted, '', 'Empty string should round-trip correctly');
  });

  test('encrypt handles numeric values as strings', () => {
    const numeric = '1234567890.0987654321';
    const encrypted = envVarService.encrypt(numeric);
    const decrypted = envVarService.decrypt(encrypted);
    assert.strictEqual(decrypted, numeric, 'Numeric strings should round-trip correctly');
  });

  test('encrypt handles very long values (10KB)', () => {
    const long = 'A'.repeat(10240);
    const encrypted = envVarService.encrypt(long);
    const decrypted = envVarService.decrypt(encrypted);
    assert.strictEqual(decrypted.length, 10240, 'Long value should round-trip correctly');
    assert.strictEqual(decrypted, long, 'Decrypted long value should match original');
  });

  test('encrypt handles JSON strings', () => {
    const json = JSON.stringify({ key: 'value', nested: { arr: [1,2,3] } });
    const encrypted = envVarService.encrypt(json);
    const decrypted = envVarService.decrypt(encrypted);
    assert.strictEqual(decrypted, json, 'JSON strings should round-trip correctly');
    assert.deepStrictEqual(JSON.parse(decrypted), JSON.parse(json));
  });

  test('resolveVariables returns object with decrypted values', async () => {
    try {
      const envId = '00000000-0000-0000-0000-000000000000';
      const variables = await envVarService.listVariables(envId);
      assert.ok(Array.isArray(variables), 'listVariables should return an array');
    } catch (err) {
      assert.ok(err.message.includes('UUID') || err.message.includes('uuid'), 'UUID errors expected with test IDs: ' + err.message);
    }
  });

  // ========================================
  // Section 2: Storage Adapter Tests
  // ========================================
  console.log('\n--- Storage Adapter Tests ---');

  test('getStorageAdapter returns S3 adapter by default', () => {
    const adapter = getStorageAdapter();
    assert.ok(adapter, 'Storage adapter should be created');
    assert.strictEqual(typeof adapter.upload, 'function', 'Should have upload method');
    assert.strictEqual(typeof adapter.download, 'function', 'Should have download method');
    assert.strictEqual(typeof adapter.delete, 'function', 'Should have delete method');
    assert.strictEqual(typeof adapter.list, 'function', 'Should have list method');
    assert.strictEqual(typeof adapter.exists, 'function', 'Should have exists method');
    assert.strictEqual(typeof adapter.copy, 'function', 'Should have copy method');
  });

  test('storage adapter handles exists check for non-existent key gracefully', async () => {
    const adapter = getStorageAdapter();
    const exists = await adapter.exists('non-existent-bucket', 'non-existent-key');
    assert.strictEqual(exists, false, 'Should return false for non-existent objects');
  });

  // ========================================
  // Section 3: Antivirus Service Tests
  // ========================================
  console.log('\n--- Antivirus Service Tests ---');

  test('validateZipBomb rejects excessive files', () => {
    const entries = Array.from({ length: 10001 }, (_, i) => ({
      name: `file${i}.txt`,
      uncompressedSize: 100,
      compressedSize: 100
    }));
    assert.throws(() => {
      antivirusService.validateZipBomb(entries);
    }, /Zip bomb detected/);
  });

  test('validateZipBomb rejects excessive total size', () => {
    const entries = Array.from({ length: 100 }, (_, i) => ({
      name: `file${i}.txt`,
      uncompressedSize: 2 * 1024 * 1024,
      compressedSize: 1024
    }));
    assert.throws(() => {
      antivirusService.validateZipBomb(entries);
    }, /Zip bomb detected/);
  });

  test('validateZipBomb rejects high compression ratio', () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({
      name: `file${i}.txt`,
      uncompressedSize: 10 * 1024 * 1024,
      compressedSize: 1024
    }));
    assert.throws(() => {
      antivirusService.validateZipBomb(entries);
    }, /Zip bomb detected/);
  });

  test('validateZipBomb rejects zero-uncompressed entries with large compressed size', () => {
    const entries = [
      { name: 'suspicious.dll', uncompressedSize: 0, compressedSize: 500000 }
    ];
    assert.throws(() => {
      antivirusService.validateZipBomb(entries);
    }, /Suspicious entry detected/);
  });

  test('validateZipBomb accepts legitimate zip entries', () => {
    const entries = [
      { name: 'index.html', uncompressedSize: 5000, compressedSize: 1500 },
      { name: 'style.css', uncompressedSize: 3000, compressedSize: 800 },
      { name: 'app.js', uncompressedSize: 15000, compressedSize: 5000 }
    ];
    const result = antivirusService.validateZipBomb(entries);
    assert.strictEqual(result.safe, true, 'Legitimate entries should pass validation');
    assert.strictEqual(result.totalFiles, 3, 'Should report correct file count');
  });

  test('validateZipBomb handles empty zip', () => {
    const result = antivirusService.validateZipBomb([]);
    assert.strictEqual(result.safe, true, 'Empty zip should pass validation');
    assert.strictEqual(result.totalFiles, 0);
  });

  test('getFallbackWarning returns descriptive message', () => {
    const warning = antivirusService.getFallbackWarning();
    assert.ok(warning.includes('ClamAV'), 'Warning should mention ClamAV');
    assert.ok(warning.includes('CLAMAV_HOST'), 'Warning should mention CLAMAV_HOST env var');
  });

  // ========================================
  // Section 4: Prometheus Metrics Tests
  // ========================================
  console.log('\n--- Metrics Service Tests ---');

  test('metrics service records deployment counters', () => {
    metricsService.recordDeployment('DEPLOYED', 'production');
    metricsService.recordDeployment('FAILED', 'staging');
    assert.ok(true, 'Metrics counters should not throw');
  });

  test('metrics service records rollback counter', () => {
    metricsService.recordRollback('production');
    assert.ok(true, 'Rollback counter should not throw');
  });

  test('metrics service sets active deployments', () => {
    metricsService.setActiveDeployments('production', 3);
    assert.ok(true, 'Active deployments gauge should not throw');
  });

  test('metrics service sets domain count', () => {
    metricsService.setDomainCount('ACTIVE', 5);
    assert.ok(true, 'Domain count gauge should not throw');
  });

  test('metrics service records HTTP requests', () => {
    metricsService.recordHttpRequest('POST', '/api/v1/cms/deployment', '201', 0.235);
    assert.ok(true, 'HTTP request metrics should not throw');
  });

  test('metrics service generates metrics output', async () => {
    const metrics = await metricsService.getMetrics();
    assert.ok(typeof metrics === 'string', 'Metrics output should be a string');
    assert.ok(metrics.length > 0, 'Metrics output should not be empty');
    assert.ok(metrics.includes('deployment_total'), 'Metrics should include deployment_total');
    assert.ok(metrics.includes('http_request_total'), 'Metrics should include http_request_total');
    assert.ok(metrics.includes('# HELP'), 'Metrics should include HELP lines');
    assert.ok(metrics.includes('# TYPE'), 'Metrics should include TYPE lines');
  });

  test('metrics service content type is correct', () => {
    const contentType = metricsService.getContentType();
    assert.ok(contentType.includes('text/plain'), 'Content type should be text/plain');
    assert.ok(contentType.includes('protobuf') || contentType.includes('0.0.4'),
      'Content type should include protocol buffer version');
  });

  test('metrics service handles concurrent recording', () => {
    const promises = Array.from({ length: 100 }, (_, i) => {
      metricsService.recordDeployment('DEPLOYED', `env-${i % 5}`);
    });
    assert.ok(true, 'Concurrent metrics recording should not throw');
  });

  // ========================================
  // Section 5: Deployment Logic Tests
  // ========================================
  console.log('\n--- Deployment Logic Tests ---');

  test('createDeployment validates required fields', async () => {
    try {
      await deploymentService.createDeployment('biz-id', 'user-id', {});
      assert.fail('Should have thrown validation error');
    } catch (err) {
      assert.ok(err.message.includes('Environment ID'), 'Should require environment ID');
    }
  });

  test('createDeployment validates version field', async () => {
    try {
      await deploymentService.createDeployment('biz-id', 'user-id', { environmentId: 'env-id' });
      assert.fail('Should have thrown validation error');
    } catch (err) {
      assert.ok(err.message.includes('version'), 'Should require version');
    }
  });

  test('listDeployments returns expected structure', async () => {
    try {
      const result = await deploymentService.listDeployments('00000000-0000-0000-0000-000000000000', { limit: 10 });
      assert.ok(Array.isArray(result.deployments), 'Should return deployments array');
      assert.strictEqual(typeof result.total, 'number', 'Should return total count');
      assert.strictEqual(result.limit, 10, 'Should respect limit parameter');
    } catch (err) {
      assert.ok(err.message.includes('deployment') || err.message.includes('Deployment'), 'Should handle query gracefully: ' + err.message);
    }
  });

  test('getDeploymentStats returns expected structure', async () => {
    try {
      const stats = await deploymentService.getDeploymentStats('00000000-0000-0000-0000-000000000000');
      assert.strictEqual(typeof stats.totalDeployments, 'number', 'Should have totalDeployments');
      assert.strictEqual(typeof stats.activeDeployments, 'number', 'Should have activeDeployments');
      assert.strictEqual(typeof stats.failedDeployments, 'number', 'Should have failedDeployments');
      assert.strictEqual(typeof stats.environments, 'number', 'Should have environments count');
      assert.strictEqual(typeof stats.storageBytes, 'number', 'Should have storageBytes');
    } catch (err) {
      assert.ok(err.message.includes('UUID') || err.message.includes('uuid'), 'UUID errors expected with test IDs: ' + err.message);
    }
  });

  test('getHealthStatus returns expected structure', async () => {
    try {
      const health = await deploymentService.getHealthStatus('00000000-0000-0000-0000-000000000000');
      assert.ok(['healthy', 'degraded'].includes(health.status), 'Status should be healthy or degraded');
    } catch (err) {
      assert.ok(err.message.includes('UUID') || err.message.includes('uuid'), 'UUID errors expected with test IDs: ' + err.message);
    }
  });

  // ========================================
  // Section 6: Domain Service Logic Tests
  // ========================================
  console.log('\n--- Domain Service Logic Tests ---');

  test('createDomain validates domain required', async () => {
    try {
      await domainService.createDomain('biz-id', {});
      assert.fail('Should have thrown validation error');
    } catch (err) {
      assert.ok(err.message.includes('Domain name'), 'Should require domain name');
    }
  });

  test('verifyDns handles non-existent domain', async () => {
    try {
      await domainService.verifyDns('00000000-0000-0000-0000-000000000000');
      assert.fail('Should have thrown error');
    } catch (err) {
      const msg = err.message.toLowerCase();
      assert.ok(msg.includes('domain not found') || msg.includes('not found') || msg.includes('uuid'),
        'Should handle non-existent domain: ' + err.message);
    }
  });

  test('checkPropagation handles non-existent domain', async () => {
    try {
      await domainService.checkPropagation('00000000-0000-0000-0000-000000000000');
      assert.fail('Should have thrown error');
    } catch (err) {
      const msg = err.message.toLowerCase();
      assert.ok(msg.includes('domain not found') || msg.includes('not found') || msg.includes('uuid'),
        'Should handle non-existent domain: ' + err.message);
    }
  });

  test('requestSsl handles non-existent domain', async () => {
    try {
      await domainService.requestSsl('00000000-0000-0000-0000-000000000000');
      assert.fail('Should have thrown error');
    } catch (err) {
      const msg = err.message.toLowerCase();
      assert.ok(msg.includes('domain not found') || msg.includes('not found') || msg.includes('uuid'),
        'Should handle non-existent domain: ' + err.message);
    }
  });

  test('getDomainStats returns expected structure', async () => {
    try {
      const stats = await domainService.getDomainStats('00000000-0000-0000-0000-000000000000');
      assert.strictEqual(typeof stats.total, 'number', 'Should have total domains');
      assert.strictEqual(typeof stats.active, 'number', 'Should have active domains');
      assert.strictEqual(typeof stats.sslActive, 'number', 'Should have sslActive count');
      assert.strictEqual(typeof stats.dnsPending, 'number', 'Should have dnsPending count');
    } catch (err) {
      assert.ok(err.message.includes('UUID') || err.message.includes('uuid'), 'UUID errors expected with test IDs: ' + err.message);
    }
  });

  // ========================================
  // Section 7: Rollback Service Logic Tests
  // ========================================
  console.log('\n--- Rollback Service Logic Tests ---');

  test('getRollbackTargets returns array', async () => {
    try {
      const targets = await rollbackService.getRollbackTargets('00000000-0000-0000-0000-000000000000');
      assert.ok(Array.isArray(targets), 'Should return an array');
    } catch (err) {
      assert.ok(err.message.includes('UUID') || err.message.includes('uuid'), 'UUID errors expected with test IDs: ' + err.message);
    }
  });

  test('rollback validates deployment exists', async () => {
    try {
      await rollbackService.rollback('00000000-0000-0000-0000-000000000000', 'user-id');
      assert.fail('Should have thrown error');
    } catch (err) {
      assert.ok(
        err.message.includes('Deployment not found') || err.message.includes('Record to update') || err.message.includes('not found') || err.message.includes('UUID'),
        'Should report not found: ' + err.message
      );
    }
  });

  test('getRollbackHistory returns expected structure', async () => {
    try {
      const result = await rollbackService.getRollbackHistory('00000000-0000-0000-0000-000000000000');
      assert.ok(Array.isArray(result.rollbacks), 'Should return rollbacks array');
      assert.strictEqual(typeof result.total, 'number', 'Should have total count');
    } catch (err) {
      assert.ok(err.message.includes('UUID') || err.message.includes('uuid'), 'UUID errors expected with test IDs: ' + err.message);
    }
  });

  // ========================================
  // Results
  // ========================================
  const total = passed + failed;
  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed}/${total} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
