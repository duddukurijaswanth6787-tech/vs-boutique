const http = require('http');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
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

async function run() {
  console.log('--- PHASE 7 API ENDPOINTS VERIFICATION ---');

  // 1. Authenticate / Login
  console.log('\n1. POST /auth/login (JWT Auth Validation)...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 3005,
    path: '/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: 'superadmin',
    password: 'Test@123'
  });

  console.log(`Status: ${loginRes.statusCode}`);
  const token = loginRes.data?.token || loginRes.data?.data?.token;
  if (!token) {
    console.error('Failed to authenticate superadmin user. Response:', loginRes.data);
    process.exit(1);
  }
  console.log('✓ Successfully authenticated and received JWT Token.');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Trigger Audit
  console.log('\n2. POST /api/v1/cms/certification/audit...');
  const auditRes = await request({
    hostname: 'localhost',
    port: 3005,
    path: '/api/v1/cms/certification/audit',
    method: 'POST',
    headers: authHeaders
  }, {
    releaseTag: 'v1.0.62',
    targetType: 'WEBSITE'
  });
  console.log(`Status: ${auditRes.statusCode}`, auditRes.data);

  // 3. Get progress status
  console.log('\n3. GET /api/v1/cms/certification/status/v1.0.62...');
  const statusRes = await request({
    hostname: 'localhost',
    port: 3005,
    path: '/api/v1/cms/certification/status/v1.0.62',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Status: ${statusRes.statusCode}`, statusRes.data);

  // 4. Get QA History
  console.log('\n4. GET /api/v1/cms/certification/history...');
  const historyRes = await request({
    hostname: 'localhost',
    port: 3005,
    path: '/api/v1/cms/certification/history',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Status: ${historyRes.statusCode}`);
  console.log(`Certifications Count: ${historyRes.data?.certifications?.length || 0}`);
  const lastReport = historyRes.data?.certifications?.[0];

  if (lastReport) {
    console.log(`Last Report ID: ${lastReport.id}, Overall Score: ${lastReport.overallScore}`);

    // 5. Get Report
    console.log(`\n5. GET /api/v1/cms/certification/report/v1.0.62...`);
    const reportRes = await request({
      hostname: 'localhost',
      port: 3005,
      path: '/api/v1/cms/certification/report/v1.0.62',
      method: 'GET',
      headers: authHeaders
    });
    console.log(`Status: ${reportRes.statusCode}`);
    console.log(`Report Score: ${reportRes.data?.report?.overallScore}, Status: ${reportRes.data?.report?.status}`);

    // 6. Test Chatbot
    console.log('\n6. POST /api/v1/cms/certification/chat...');
    const chatRes = await request({
      hostname: 'localhost',
      port: 3005,
      path: '/api/v1/cms/certification/chat',
      method: 'POST',
      headers: authHeaders
    }, {
      certificationId: lastReport.id,
      message: 'Explain my SEO score'
    });
    console.log(`Status: ${chatRes.statusCode}`, chatRes.data);
  }

  console.log('\n--- API ENDPOINTS VERIFICATION COMPLETE ---');
}

run().catch(console.error);
