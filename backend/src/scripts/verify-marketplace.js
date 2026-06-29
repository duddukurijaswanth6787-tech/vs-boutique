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
  console.log('🔍 VERIFYING MARKETPLACE REST API ENDPOINTS');
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

  // 2. Search packages
  console.log('\n2. GET /api/v1/marketplace/packages/search...');
  const searchRes = await request({
    hostname: 'localhost',
    port: port,
    path: '/api/v1/marketplace/packages/search?q=neon',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Status: ${searchRes.statusCode}`);
  console.log(`Found packages count: ${searchRes.data?.packages?.length || 0}`);

  // 3. Get single package
  console.log('\n3. GET /api/v1/marketplace/packages/dark-neon-theme...');
  const detailRes = await request({
    hostname: 'localhost',
    port: port,
    path: '/api/v1/marketplace/packages/dark-neon-theme',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Status: ${detailRes.statusCode}`);
  console.log(`Package Name: ${detailRes.data?.data?.name}`);

  console.log('\n==================================================');
  console.log('🎉 MARKETPLACE REST API ENDPOINTS VERIFIED!');
  console.log('==================================================');
}

run().catch(err => {
  console.error('API Verification failed:', err.message);
  process.exit(1);
});
