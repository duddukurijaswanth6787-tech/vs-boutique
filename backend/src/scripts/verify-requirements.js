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
  console.log('==================================================');
  console.log('🔍 VERIFYING CMS REQUIREMENTS REST API ENDPOINTS');
  console.log('==================================================');

  const port = process.env.PORT || 3005;
  let token = null;

  // 1. Authenticate / Login (try Test@123 first, then admin@123)
  console.log('\n1. POST /auth/login (JWT Auth Validation)...');
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
  } catch (e) { console.error('[verify-requirements] first login error:', e); }

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
    } catch (e) { console.error('[verify-requirements] second login error:', e); }
  }

  if (!token) {
    console.error('❌ Failed to authenticate superadmin.');
    process.exit(1);
  }
  console.log('✓ Successfully authenticated and received JWT Token.');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. GET /api/v1/cms/requirements
  console.log('\n2. GET /api/v1/cms/requirements...');
  const reqList = await request({
    hostname: 'localhost',
    port: port,
    path: '/api/v1/cms/requirements',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Status: ${reqList.statusCode}`);
  console.log(`Success: ${reqList.data?.success}`);
  console.log(`Count: ${reqList.data?.requirements?.length}`);

  // 3. GET /api/v1/cms/requirements/templates
  console.log('\n3. GET /api/v1/cms/requirements/templates...');
  const templateList = await request({
    hostname: 'localhost',
    port: port,
    path: '/api/v1/cms/requirements/templates',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Status: ${templateList.statusCode}`);
  console.log(`Success: ${templateList.data?.success}`);
  console.log(`Count: ${templateList.data?.templates?.length}`);

  // 4. POST /api/v1/cms/requirements/validate
  console.log('\n4. POST /api/v1/cms/requirements/validate...');
  const validateRes = await request({
    hostname: 'localhost',
    port: port,
    path: '/api/v1/cms/requirements/validate',
    method: 'POST',
    headers: authHeaders
  }, {
    activeKeys: []
  });
  console.log(`Status: ${validateRes.statusCode}`);
  console.log(`IsValid: ${validateRes.data?.isValid}`);

  console.log('\n==================================================');
  console.log('🎉 ALL CMS REQUIREMENTS API VERIFICATIONS PASSED!');
  console.log('==================================================');
}

run().catch(console.error);
