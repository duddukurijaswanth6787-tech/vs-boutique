const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const port = process.env.PORT || 3005;

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
  console.log('🧪 RUNNING CMS VERIFICATION ENGINE AST TESTS');
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

  // Pre-requisite: login
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
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Compile the Boutique Blueprint template first to ensure sitemaps exist in DB
  let blueprintId = null;
  try {
    const bpList = await requestJson({
      hostname: 'localhost',
      port,
      path: '/api/v1/cms/blueprints',
      method: 'GET',
      headers: authHeaders
    });
    const boutique = bpList.data?.blueprints.find(b => b.key === 'boutique-ecom-blueprint');
    blueprintId = boutique?.id;
    
    // Compile it
    await requestJson({
      hostname: 'localhost',
      port,
      path: `/api/v1/cms/blueprints/${blueprintId}/compile`,
      method: 'POST',
      headers: authHeaders
    });
  } catch (err) {
    console.error('❌ Pre-requisite compilation failed:', err);
    process.exit(1);
  }

  // Generate a mock compliant codebase structure
  const tempDir = path.join(__dirname, '../../../../node_modules/.metadata-uploads/temp/mock-app');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const pagesDir = path.join(tempDir, 'pages');
  const compsDir = path.join(tempDir, 'components');
  if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });
  if (!fs.existsSync(compsDir)) fs.mkdirSync(compsDir, { recursive: true });

  // Add required page components files
  fs.writeFileSync(path.join(pagesDir, 'cart.jsx'), 'export default function Cart() {}');
  fs.writeFileSync(path.join(pagesDir, 'checkout_custom.jsx'), 'export default function Checkout() {}');
  fs.writeFileSync(path.join(pagesDir, 'measurements.jsx'), 'export default function Measurements() {}');

  // Add required components files
  fs.writeFileSync(path.join(compsDir, 'Navbar.jsx'), 'const Navbar = () => {}');
  fs.writeFileSync(path.join(compsDir, 'CartGrid.jsx'), 'const CartGrid = () => {}');
  fs.writeFileSync(path.join(compsDir, 'Footer.jsx'), 'const Footer = () => {}');
  fs.writeFileSync(path.join(compsDir, 'GenericContainer.jsx'), 'const GenericContainer = () => {}');

  // Add API handlers in server.js file
  fs.writeFileSync(path.join(tempDir, 'server.js'), `
    router.post('/api/v1/cart/add', handler);
    router.delete('/api/v1/cart/remove', handler);
    router.post('/api/v1/checkout/custom-order', handler);
    const process_env = process.env.STRIPE_PUBLIC_KEY;
    const jwt = process.env.JWT_SECRET;
  `);

  // Add configuration & security CSP details in HTML file
  fs.writeFileSync(path.join(tempDir, 'index.html'), `
    <meta property="og:title" content="Boutique" />
    <meta name="ContentSecurityPolicy" content="default-src 'self'" />
  `);

  fs.writeFileSync(path.join(tempDir, '.env.example'), 'STRIPE_PUBLIC_KEY=\nJWT_SECRET=\n');

  // Compress mock app to zip
  const zipPath = path.join(tempDir, '../mock-app.zip');
  execSync(`tar -a -cf "${zipPath}" -C "${tempDir}" .`);

  try {
    // 1. Ingest clean zip
    console.log('--- Step 1: Uploading mock codebase archive ---');
    const uploadRes = await uploadFile({
      hostname: 'localhost',
      port,
      path: '/api/v1/cms/projects/upload',
      method: 'POST',
      headers: authHeaders
    }, zipPath, { blueprintId });

    assert(uploadRes.statusCode === 202, 'Codebase ZIP uploaded successfully.');
    const uploadId = uploadRes.data?.upload?.id;

    // Poll status until complete
    let finalTask = null;
    for (let attempts = 0; attempts < 10; attempts++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const statusRes = await requestJson({
        hostname: 'localhost',
        port,
        path: `/api/v1/cms/projects/${uploadId}`,
        method: 'GET',
        headers: authHeaders
      });
      finalTask = statusRes.data?.upload;
      if (finalTask && finalTask.status === 'COMPLETED') break;
    }

    assert(finalTask && finalTask.status === 'COMPLETED', 'ZIP extracted successfully.');

    // 2. Trigger Verification
    console.log('\n--- Step 2: Running Verification AST Scanners ---');
    const verifyRes = await requestJson({
      hostname: 'localhost',
      port,
      path: '/api/v1/cms/projects/verify',
      method: 'POST',
      headers: authHeaders
    }, { uploadId });

    assert(verifyRes.statusCode === 200, 'Verification POST endpoint returned 200 OK.');
    const report = verifyRes.data?.report;
    
    assert(report && report.score === 100, 'Verification report calculated a score of 100%.');
    assert(report && report.isValid === true, 'Verification successfully passed validator flags.');

    // Verify detail lists
    assert(report.details.pages.every(p => p.status === 'PASSED'), 'All expected page routes verified as present.');
    assert(report.details.components.every(c => c.status === 'PASSED'), 'All expected React components verified.');
    assert(report.details.apis.every(a => a.status === 'PASSED'), 'All API controller endpoints parsed successfully.');

  } catch (err) {
    console.error('❌ Verification test error:', err);
    failed++;
  } finally {
    // Cleanup generated folders
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  }

  console.log('\n==================================================');
  console.log('📊 VERIFICATION AST TESTS SUMMARY');
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
