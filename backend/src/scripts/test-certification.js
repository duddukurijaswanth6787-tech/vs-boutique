const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const http = require('http');

const port = process.env.PORT || 3005;

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
  console.log('🧪 RUNNING CMS CERTIFICATION ENGINE INTEGRATION TESTS');
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

  const business = await prisma.business.findFirst();
  if (!business) {
    console.error('❌ Business context not found in database. Seed first.');
    process.exit(1);
  }

  // Cleanup old mock release
  await prisma.immutableRelease.deleteMany({
    where: { releaseTag: 'test-qa-release-tag' }
  });

  // Create mock ImmutableRelease
  const release = await prisma.immutableRelease.create({
    data: {
      businessId: business.id,
      releaseTag: 'test-qa-release-tag',
      status: 'QA',
      environment: 'DEV',
      payloadDump: {
        pages: [{ slug: 'home' }, { slug: 'cart' }]
      },
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      createdBy: 'test-operator'
    }
  });

  try {
    // --------------------------------------------------
    // TEST 1: Trigger QA Audit
    // --------------------------------------------------
    console.log('--- TEST 1: Triggering Quality Assurance Audit ---');
    const auditRes = await requestJson({
      hostname: 'localhost',
      port,
      path: '/api/v1/cms/certification/audit',
      method: 'POST',
      headers: authHeaders
    }, {
      releaseTag: 'test-qa-release-tag',
      targetType: 'WEBSITE'
    });

    assert(auditRes.statusCode === 202 && auditRes.data?.success === true, 'Audit trigger request accepted with 202 status.');
    const workflowId = auditRes.data?.workflowId;

    // Poll status until complete or failed
    let finalWorkflow = null;
    for (let attempts = 0; attempts < 15; attempts++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const statusRes = await requestJson({
        hostname: 'localhost',
        port,
        path: '/api/v1/cms/certification/status/test-qa-release-tag',
        method: 'GET',
        headers: authHeaders
      });
      finalWorkflow = statusRes.data;
      if (finalWorkflow && (finalWorkflow.status === 'COMPLETED' || finalWorkflow.status === 'FAILED')) {
        break;
      }
    }

    assert(finalWorkflow && (finalWorkflow.status === 'COMPLETED' || finalWorkflow.status === 'FAILED'), 'QA Audit workflow completed execution pipeline.');

    // --------------------------------------------------
    // TEST 2: Fetch Certification Report
    // --------------------------------------------------
    console.log('\n--- TEST 2: Retrieving Certification Score Card ---');
    const reportRes = await requestJson({
      hostname: 'localhost',
      port,
      path: '/api/v1/cms/certification/report/test-qa-release-tag',
      method: 'GET',
      headers: authHeaders
    });

    assert(reportRes.statusCode === 200 && reportRes.data?.success === true, 'GET /report/:tag returns 200 Success.');
    const report = reportRes.data?.report;
    assert(!!report, 'Report structure returned contains dynamic audit scores map.');
    assert(typeof report.overallScore === 'number', `Audit overall certification score computed: ${report.overallScore}%`);

    // --------------------------------------------------
    // TEST 3: Conversational Chatbot
    // --------------------------------------------------
    console.log('\n--- TEST 3: Conversational QA Chatbot Query ---');
    const chatRes = await requestJson({
      hostname: 'localhost',
      port,
      path: '/api/v1/cms/certification/chat',
      method: 'POST',
      headers: authHeaders
    }, {
      certificationId: report.id,
      message: 'Why did my performance score drop?'
    });

    assert(chatRes.statusCode === 200 && chatRes.data?.success === true, 'POST /chat returns 200 Success.');
    assert(!!chatRes.data?.reply, 'Chatbot reply successfully returned.');

    // --------------------------------------------------
    // TEST 4: Fetch history log
    // --------------------------------------------------
    console.log('\n--- TEST 4: Retrieving Trend History Logs ---');
    const historyRes = await requestJson({
      hostname: 'localhost',
      port,
      path: '/api/v1/cms/certification/history',
      method: 'GET',
      headers: authHeaders
    });
    assert(historyRes.statusCode === 200 && historyRes.data?.success === true, 'GET /history returns 200 Success.');

  } catch (err) {
    console.error('❌ Certification test error:', err);
    failed++;
  } finally {
    // Cleanup
    await prisma.immutableRelease.deleteMany({
      where: { releaseTag: 'test-qa-release-tag' }
    });
    await prisma.certificationWorkflow.deleteMany({
      where: { releaseTag: 'test-qa-release-tag' }
    });
    await prisma.boutiqueCertification.deleteMany({
      where: { releaseTag: 'test-qa-release-tag' }
    });
  }

  console.log('\n==================================================');
  console.log('📊 CERTIFICATION ENGINE INTEGRATION TESTS SUMMARY');
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
