const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const http = require('http');
const blueprintService = require('../modules/cms-blueprints/services/blueprint.service');

const port = process.env.PORT || 3005;

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

async function runTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING CMS BLUEPRINT ENGINE INTEGRATION TESTS');
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

  // Cleanup test templates
  await prisma.cmsBlueprintTemplate.deleteMany({
    where: { key: 'test-temp-crud' }
  });

  // Get Super Admin Auth Token
  let token = null;
  try {
    const loginRes = await request({
      hostname: 'localhost',
      port: port,
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      username: 'superadmin',
      password: 'Test@123'
    });
    token = loginRes.data?.token || loginRes.data?.data?.token;
  } catch (e) {}

  if (!token) {
    try {
      const loginRes = await request({
        hostname: 'localhost',
        port: port,
        path: '/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        username: 'superadmin',
        password: 'admin@123'
      });
      token = loginRes.data?.token || loginRes.data?.data?.token;
    } catch (e) {}
  }

  if (!token) {
    console.error('❌ Authentication failed. Test runner aborted.');
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    // --------------------------------------------------
    // PART 1: SERVICE CRUD & TRANSACTION COMPILATION
    // --------------------------------------------------
    console.log('--- PART 1: Blueprint CRUD & Compilation ---');

    // 1.1 Create template
    const newTemp = await blueprintService.createBlueprint({
      key: 'test-temp-crud',
      name: 'Temp Test Blueprint',
      description: 'Sandbox testing'
    }, '6280f364-2664-49f8-a19b-14ca697e4fa6');

    assert(newTemp.key === 'test-temp-crud', 'Blueprint template created successfully.');

    // Find boutique template
    const boutique = await prisma.cmsBlueprintTemplate.findFirst({
      where: { key: 'boutique-ecom-blueprint' }
    });

    // 1.2 Compile template
    const startTime = Date.now();
    const compileResult = await blueprintService.compileBlueprint(boutique.id, '6280f364-2664-49f8-a19b-14ca697e4fa6');
    const compileDuration = Date.now() - startTime;

    assert(compileResult.success === true, 'Blueprint compiled successfully.');
    console.log(`  ⏱️  Compilation Duration: ${compileDuration}ms`);
    assert(compileDuration < 150, 'Blueprint compilation completes under 150ms performance threshold.');

    // 1.3 Database Normalization checks
    const pageRecords = await prisma.cmsBlueprintPage.findMany({
      where: { blueprintTemplateId: boutique.id },
      include: { components: true }
    });
    assert(pageRecords.length === 3, 'Seeded sitemap resolved 3 normalized pages.');
    assert(pageRecords.some(p => p.route === '/cart'), 'Cart page route registered.');
    assert(pageRecords.find(p => p.route === '/cart').components.length === 3, 'Cart page contains 3 injected component nodes.');

    const apiRecords = await prisma.cmsBlueprintApi.findMany({
      where: { blueprintTemplateId: boutique.id }
    });
    assert(apiRecords.length === 3, 'Compiled resolved 3 normalized APIs.');

    // --------------------------------------------------
    // PART 2: API ROUTER INTEGRATION
    // --------------------------------------------------
    console.log('\n--- PART 2: REST API Routes & Access Controls ---');

    // 2.1 Auth Check
    const noAuth = await request({
      hostname: 'localhost',
      port: port,
      path: '/api/v1/cms/blueprints',
      method: 'GET'
    });
    assert(noAuth.statusCode === 401, 'Request without authorization header returns 401.');

    // 2.2 GET /api/v1/cms/blueprints
    const listRes = await request({
      hostname: 'localhost',
      port: port,
      path: '/api/v1/cms/blueprints',
      method: 'GET',
      headers: authHeaders
    });
    assert(listRes.statusCode === 200 && listRes.data?.success === true, 'GET /blueprints returns 200 Success.');

    // 2.3 POST /api/v1/cms/blueprints/:id/compile
    const apiCompile = await request({
      hostname: 'localhost',
      port: port,
      path: `/api/v1/cms/blueprints/${boutique.id}/compile`,
      method: 'POST',
      headers: authHeaders
    });
    assert(apiCompile.statusCode === 200 && apiCompile.data?.success === true, 'POST /blueprints/:id/compile returns 200 OK.');

    // Cleanup
    await prisma.cmsBlueprintTemplate.deleteMany({
      where: { key: 'test-temp-crud' }
    });
    console.log('\n🧹 Database cleaned up.');

  } catch (err) {
    console.error('❌ Unexpected test error:', err);
    failed++;
  }

  console.log('\n==================================================');
  console.log('📊 BLUEPRINT ENGINE INTEGRATION TESTS SUMMARY');
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
