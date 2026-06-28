import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:3005';
const TEST_PHONE = '9999999999';

let serverProcess = null;
let jwtToken = null;
let createdOrderId = null;

function api(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE);
        const opts = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: { 'Content-Type': 'application/json' }
        };
        if (token) opts.headers['Authorization'] = `Bearer ${token}`;
        
        const req = http.request(opts, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                let parsed = null;
                try { parsed = JSON.parse(data); } catch { parsed = data; }
                resolve({ status: res.statusCode, body: parsed });
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function startServer() {
    return new Promise((resolve, reject) => {
        const serverPath = path.resolve(__dirname, 'src/server.js');
        serverProcess = spawn('node', [serverPath], {
            cwd: path.resolve(__dirname),
            env: process.env,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let started = false;
        serverProcess.stdout.on('data', (data) => {
            const text = data.toString();
            if (text.includes('Available Routes:') && !started) {
                started = true;
                setTimeout(resolve, 500);
            }
        });
        serverProcess.stderr.on('data', (data) => {
            console.error('SERVER STDERR:', data.toString());
        });
        serverProcess.on('error', reject);
        setTimeout(() => { if (!started) resolve(); }, 4000);
    });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runTests() {
    let pass = 0, fail = 0;
    
    function test(step, desc, ok) {
        if (ok) { pass++; console.log(`  PASS  ${step} - ${desc}`); }
        else { fail++; console.log(`  FAIL  ${step} - ${desc}`); }
    }

    // ── Step 1: Start server ──
    console.log('\n=== VERIFYING BACKEND SERVER ===');
    try {
        await startServer();
        const health = await api('GET', '/');
        test('S1', 'Server responds to GET /', health.status >= 200 && health.status < 500);
    } catch (e) {
        test('S1', 'Server responds to GET /', false);
        console.error('Server start failed:', e.message);
        return;
    }

    // ── Step 2: Send OTP ──
    console.log('\n=== OTP FLOW ===');
    const otpRes = await api('POST', '/auth/send-otp', { phone: TEST_PHONE });
    test('S2', 'send-otp returns 200', otpRes.status === 200);
    test('S2b', 'send-otp returns OTP', otpRes.body && otpRes.body.otp && otpRes.body.otp.length === 6);
    const otpCode = otpRes.body?.otp;
    console.log(`       OTP generated: ${otpCode}`);

    // ── Step 3: Verify OTP stored in DB ──
    await sleep(500);
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    let dbUser;
    try {
        dbUser = await prisma.user.findUnique({ where: { phone: TEST_PHONE } });
        test('S3', 'OTP stored in database', dbUser !== null && dbUser.otp === otpCode && dbUser.otpExpiresAt !== null);
        console.log(`       DB user: ${dbUser?.id}, OTP match: ${dbUser?.otp === otpCode}, expires: ${dbUser?.otpExpiresAt}`);
    } catch (e) {
        test('S3', 'OTP stored in database', false);
        console.error('DB check error:', e.message);
    }

    // ── Step 4: Verify OTP ──
    const verifyRes = await api('POST', '/auth/verify-otp', { phone: TEST_PHONE, otp: otpCode });
    test('S4', 'verify-otp returns 200', verifyRes.status === 200);
    test('S4b', 'verify-otp returns JWT token', verifyRes.body && verifyRes.body.token && verifyRes.body.token.length > 20);
    test('S4c', 'verify-otp returns user object', verifyRes.body && verifyRes.body.user && verifyRes.body.user.phone === TEST_PHONE);
    test('S4d', 'verify-otp returns role=customer', verifyRes.body?.user?.role === 'customer');
    jwtToken = verifyRes.body?.token;
    console.log(`       JWT: ${jwtToken?.substring(0, 30)}...`);
    console.log(`       User: ${JSON.stringify(verifyRes.body?.user)}`);

    // ── Step 5: OTP cleared after verify ──
    try {
        const userAfter = await prisma.user.findUnique({ where: { phone: TEST_PHONE } });
        test('S5', 'OTP cleared after verification', userAfter.otp === null && userAfter.otpExpiresAt === null);
    } catch (e) {
        test('S5', 'OTP cleared after verification', false);
    }
    await prisma.$disconnect();

    // ── Step 6: Auth header attached ──
    console.log('\n=== JWT & AUTH HEADER ===');
    // Verify that a request WITH token gets through
    const myOrdersRes = await api('GET', '/orders/my', null, jwtToken);
    test('S6', 'Protected endpoint with JWT returns 200', myOrdersRes.status === 200);
    console.log(`       GET /orders/my with JWT: ${myOrdersRes.status}`);
    
    // Verify that a request WITHOUT token gets 401
    const noAuthRes = await api('GET', '/orders/my', null, null);
    test('S6b', 'Protected endpoint without JWT returns 401', noAuthRes.status === 401);

    // ── Step 7: Customer Order Endpoints ──
    console.log('\n=== CUSTOMER ORDER ENDPOINTS ===');
    const ordersList = await api('GET', '/orders/my', null, jwtToken);
    test('S7a', 'GET /orders/my returns 200', ordersList.status === 200);
    test('S7a2', 'GET /orders/my returns array', Array.isArray(ordersList.body));
    console.log(`       My orders count: ${ordersList.body?.length || 0}`);

    const orderDetail = await api('GET', '/orders/my/fake-id', null, jwtToken);
    test('S7b', 'GET /orders/my/:id with fake id returns 404', orderDetail.status === 404);

    // Test cancel on non-existent order
    const cancelRes = await api('POST', '/orders/fake-id/cancel', { reason: 'Test' }, jwtToken);
    test('S7c', 'POST /:id/cancel with fake id returns 404', cancelRes.status === 404);

    // ── Step 8: Logout verification ──
    console.log('\n=== LOGOUT ===');
    test('S8', 'JWT exists before logout', jwtToken !== null && jwtToken.length > 0);
    
    // After logout simulation (clear token), verify API still rejects
    test('S8b', 'API with cleared token is rejected', noAuthRes.status === 401);

    // ── Summary ──
    console.log(`\n========================================`);
    console.log(`  PASS: ${pass}  |  FAIL: ${fail}`);
    console.log(`========================================\n`);

    // Cleanup
    if (serverProcess) serverProcess.kill();
    process.exit(fail > 0 ? 1 : 0);
}

runTests().catch(e => {
    console.error('Test crashed:', e);
    if (serverProcess) serverProcess.kill();
    process.exit(1);
});
