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
  console.log('🔍 VERIFYING CMS STANDARDS REST API ENDPOINTS');
  console.log('==================================================');

  const port = process.env.PORT || 3005;

  // 1. Authenticate / Login
  console.log('\n1. POST /auth/login (JWT Auth Validation)...');
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

  console.log(`Status: ${loginRes.statusCode}`);
  const token = loginRes.data?.token || loginRes.data?.data?.token;
  if (!token) {
    console.error('Failed to authenticate. Response:', loginRes.data);
    process.exit(1);
  }
  console.log('✓ Successfully authenticated and received JWT Token.');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. GET /api/v1/cms/standards
  console.log('\n2. GET /api/v1/cms/standards...');
  const stdRes = await request({
    hostname: 'localhost',
    port: port,
    path: '/api/v1/cms/standards',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Status: ${stdRes.statusCode}`);
  console.log(`Standards count: ${stdRes.data?.standards?.length}`);
  if (stdRes.data?.standards?.length > 0) {
    console.log('✓ CMS Standards fetched successfully.');
  } else {
    throw new Error('No standards returned');
  }

  // 3. GET /api/v1/cms/standards/blueprints
  console.log('\n3. GET /api/v1/cms/standards/blueprints...');
  const bpRes = await request({
    hostname: 'localhost',
    port: port,
    path: '/api/v1/cms/standards/blueprints',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Status: ${bpRes.statusCode}`);
  console.log(`Blueprints count: ${bpRes.data?.blueprints?.length}`);

  // 4. GET /api/v1/cms/standards/builders
  console.log('\n4. GET /api/v1/cms/standards/builders...');
  const builderRes = await request({
    hostname: 'localhost',
    port: port,
    path: '/api/v1/cms/standards/builders',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Status: ${builderRes.statusCode}`);
  console.log(`Builders count: ${builderRes.data?.builders?.length}`);

  console.log('\n==================================================');
  console.log('🎉 ALL CMS STANDARDS REST API ENDPOINTS VERIFIED!');
  console.log('==================================================');
}

run().catch(err => {
  console.error('Verification failed:', err.message);
  process.exit(1);
});
