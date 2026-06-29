const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const port = process.env.PORT || 3005;

// Helper to make multipart form-data requests in pure node
function uploadFile(options, filePath, fields = {}) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const filename = path.basename(filePath);
    
    let header = '';
    for (const [key, val] of Object.entries(fields)) {
      header += `--${boundary}\r\n`;
      header += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      header += `${val}\r\n`;
    }

    header += `--${boundary}\r\n`;
    header += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
    header += `Content-Type: application/zip\r\n\r\n`;

    const footer = `\r\n--${boundary}--\r\n`;
    const fileData = fs.readFileSync(filePath);
    const contentLength = Buffer.byteLength(header) + fileData.length + Buffer.byteLength(footer);

    const reqOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': contentLength
      }
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: body ? JSON.parse(body) : null
        });
      });
    });

    req.on('error', reject);
    req.write(Buffer.from(header));
    req.write(fileData);
    req.write(Buffer.from(footer));
    req.end();
  });
}

function requestJson(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: body ? JSON.parse(body) : null
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING CMS ZIP UPLOAD INTEGRATION TESTS');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // Pre-requisite: login to get admin JWT token
  let token = null;
  const loginCredentials = [
    { username: 'superadmin', password: 'Test@123' },
    { username: 'superadmin', password: 'admin@123' }
  ];

  for (const creds of loginCredentials) {
    try {
      const res = await requestJson({
        hostname: 'localhost',
        port,
        path: '/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, creds);
      token = res.data?.token || res.data?.data?.token;
      if (token) break;
    } catch (e) {}
  }

  if (!token) {
    console.error('❌ Failed to authenticate. Test runner aborted.');
    process.exit(1);
  }

  const authHeaders = {
    'Authorization': `Bearer ${token}`
  };

  // Generate test files
  const tempDir = path.join(__dirname, '../../../../node_modules/.metadata-uploads/temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const cleanTxtPath = path.join(tempDir, 'index.html');
  fs.writeFileSync(cleanTxtPath, '<h1>Clean Boutique Site</h1>');
  const cleanZipPath = path.join(tempDir, 'clean-code.zip');
  execSync(`tar -a -cf "${cleanZipPath}" -C "${tempDir}" index.html`);
  fs.unlinkSync(cleanTxtPath);

  const infectedZipPath = path.join(tempDir, 'malware-signature-virus.zip');
  fs.writeFileSync(infectedZipPath, 'Mock Infected Threat Vector Data Payload');

  try {
    // --------------------------------------------------
    // TEST 1: Clean codebase upload and successful extract
    // --------------------------------------------------
    console.log('--- TEST 1: Ingesting Clean Code ZIP ---');
    const cleanUploadRes = await uploadFile({
      hostname: 'localhost',
      port,
      path: '/api/v1/cms/projects/upload',
      method: 'POST',
      headers: authHeaders
    }, cleanZipPath, { blueprintId: 'some-blueprint-uuid' });

    assert(cleanUploadRes.statusCode === 202, 'API accepted clean ZIP file with 202 Accepted status.');
    const uploadId = cleanUploadRes.data?.upload?.id;
    assert(!!uploadId, 'Upload task ID returned in response payload.');

    // Poll status until complete
    let attempts = 0;
    let finalTask = null;
    while (attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const statusRes = await requestJson({
        hostname: 'localhost',
        port,
        path: `/api/v1/cms/projects/${uploadId}`,
        method: 'GET',
        headers: authHeaders
      });
      finalTask = statusRes.data?.upload;
      if (finalTask && (finalTask.status === 'COMPLETED' || finalTask.status === 'FAILED')) {
        break;
      }
      attempts++;
    }

    assert(finalTask && finalTask.status === 'COMPLETED', 'ZIP extraction sandbox compilation completed successfully.');
    assert(finalTask && finalTask.virusScanResult === 'CLEAN', 'Threat signature checks verified target payload is CLEAN.');

    // --------------------------------------------------
    // TEST 2: Infected file upload block
    // --------------------------------------------------
    console.log('\n--- TEST 2: Ingesting Malware-Name Infected ZIP ---');
    const infectedUploadRes = await uploadFile({
      hostname: 'localhost',
      port,
      path: '/api/v1/cms/projects/upload',
      method: 'POST',
      headers: authHeaders
    }, infectedZipPath, { blueprintId: 'some-blueprint-uuid' });

    assert(infectedUploadRes.statusCode === 202, 'API accepted file metadata.');
    const infectedId = infectedUploadRes.data?.upload?.id;

    attempts = 0;
    let infectedTask = null;
    while (attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const statusRes = await requestJson({
        hostname: 'localhost',
        port,
        path: `/api/v1/cms/projects/${infectedId}`,
        method: 'GET',
        headers: authHeaders
      });
      infectedTask = statusRes.data?.upload;
      if (infectedTask && (infectedTask.status === 'COMPLETED' || infectedTask.status === 'FAILED')) {
        break;
      }
      attempts++;
    }

    assert(infectedTask && infectedTask.status === 'FAILED', 'Task flagged as FAILED due to threat infection.');
    assert(infectedTask && infectedTask.virusScanResult === 'INFECTED', 'Virus scanning quarantined infected file.');

  } catch (err) {
    console.error('❌ Unexpected test runner error:', err);
    failed++;
  } finally {
    // Cleanup temporary files
    if (fs.existsSync(cleanZipPath)) fs.unlinkSync(cleanZipPath);
    if (fs.existsSync(infectedZipPath)) fs.unlinkSync(infectedZipPath);
  }

  console.log('\n==================================================');
  console.log('📊 ZIP UPLOAD INTEGRATION TESTS SUMMARY');
  console.log('==================================================');
  console.log(`  • Tests Executed: ${passed + failed}`);
  console.log(`  • Passed Checks: ${passed}`);
  console.log(`  • Failed Checks: ${failed}`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
