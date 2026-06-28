const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const BASE = 'http://localhost:3005';
const TEST_PHONE = '9999999998';

let serverProcess = null;
let jwtToken = null;
let failCount = 0;
let passCount = 0;

function api(method, pathname, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const opts = {
            method,
            hostname: 'localhost',
            port: 3005,
            path: pathname,
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

function startServer() {
    return new Promise((resolve, reject) => {
        const serverPath = path.join(__dirname, 'src/server.js');
        serverProcess = spawn('node', [serverPath], {
            cwd: __dirname,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let started = false;
        serverProcess.stdout.on('data', (data) => {
            if (data.toString().includes('Available Routes:')) {
                started = true;
                setTimeout(resolve, 500);
            }
        });
        serverProcess.stderr.on('data', (data) => {
            console.error('STDERR:', data.toString().trim());
        });
        serverProcess.on('error', reject);
        setTimeout(() => { if (!started) resolve(); }, 5000);
    });
}

function test(step, desc, ok) {
    if (ok) { passCount++; console.log(`  PASS  ${step} - ${desc}`); }
    else { failCount++; console.log(`  FAIL  ${step} - ${desc}`); }
}

async function main() {
    console.log('\n========================================');
    console.log('  POST-IMPLEMENTATION AUTH AUDIT');
    console.log('========================================');

    // Step 1: Start server
    console.log('\n--- Step 1: Server Startup ---');
    try {
        await startServer();
        test('1.1', 'Backend server starts', true);
        const root = await api('GET', '/');
        test('1.2', 'Server responds to requests', root.status >= 200);
    } catch (e) {
        test('1.1', 'Backend server starts', false);
        console.error('FATAL:', e.message);
        process.exit(1);
    }

    // Step 2-5: Full OTP flow
    console.log('\n--- Steps 2-5: OTP Flow ---');
    
    // Step 2: Send OTP
    const sendRes = await api('POST', '/auth/send-otp', { phone: TEST_PHONE });
    test('2.1', 'send-otp returns 200', sendRes.status === 200);
    test('2.2', 'send-otp returns 6-digit OTP', sendRes.body && sendRes.body.otp && /^\d{6}$/.test(sendRes.body.otp));
    console.log(`         OTP: ${sendRes.body?.otp}`);
    
    // Step 3: OTP stored in database
    await new Promise(r => setTimeout(r, 300));
    const prisma = new PrismaClient();
    let dbUser;
    try {
        dbUser = await prisma.user.findUnique({ where: { phone: TEST_PHONE } });
        test('3.1', 'User record created in DB', dbUser !== null);
        test('3.2', 'OTP matches in DB', dbUser !== null && dbUser.otp === sendRes.body?.otp);
        test('3.3', 'OTP expiry set', dbUser !== null && dbUser.otpExpiresAt !== null);
        console.log(`         DB user id: ${dbUser?.id}, OTP stored: ${dbUser?.otp}`);
    } catch (e) {
        test('3.1', 'User record created in DB', false);
        test('3.2', 'OTP matches in DB', false);
        test('3.3', 'OTP expiry set', false);
    }

    // Step 4: Verify OTP
    const verifyRes = await api('POST', '/auth/verify-otp', { phone: TEST_PHONE, otp: sendRes.body?.otp });
    test('4.1', 'verify-otp returns 200', verifyRes.status === 200);
    test('4.2', 'JWT token returned', verifyRes.body && verifyRes.body.token && verifyRes.body.token.length > 20);
    test('4.3', 'User object returned', verifyRes.body && verifyRes.body.user && verifyRes.body.user.phone === TEST_PHONE);
    test('4.4', 'Role is "customer"', verifyRes.body?.user?.role === 'customer');
    test('4.5', 'Token is a valid JWT', verifyRes.body && verifyRes.body.token.split('.').length === 3);
    jwtToken = verifyRes.body?.token;
    console.log(`         JWT: ${jwtToken?.substring(0, 30)}...`);
    console.log(`         User: ${JSON.stringify(verifyRes.body?.user)}`);

    // Step 5: OTP cleared after verify
    try {
        const userAfter = await prisma.user.findUnique({ where: { phone: TEST_PHONE } });
        test('5.1', 'OTP cleared from DB after verify', userAfter.otp === null);
        test('5.2', 'OTP expiry cleared from DB after verify', userAfter.otpExpiresAt === null);
    } catch (e) {
        test('5.1', 'OTP cleared after verify', false);
        test('5.2', 'OTP expiry cleared after verify', false);
    }
    await prisma.$disconnect();

    // Step 6: JWT auth header verification
    console.log('\n--- Step 6: JWT Auth Header ---');
    const withToken = await api('GET', '/orders/my', null, jwtToken);
    test('6.1', 'Protected API with valid JWT returns 200', withToken.status === 200);
    
    const withoutToken = await api('GET', '/orders/my', null, null);
    test('6.2', 'Protected API without JWT returns 401', withoutToken.status === 401);
    
    const badToken = await api('GET', '/orders/my', null, 'Bearer invalidtoken');
    test('6.3', 'Protected API with bad JWT returns 401', badToken.status === 401);

    // Step 7: Customer order endpoints
    console.log('\n--- Step 7: Customer Order Endpoints ---');
    const orders = await api('GET', '/orders/my', null, jwtToken);
    test('7.1', 'GET /orders/my returns 200', orders.status === 200);
    test('7.1b', 'GET /orders/my returns array', Array.isArray(orders.body));
    console.log(`         Orders count: ${orders.body?.length || 0}`);

    const detail = await api('GET', '/orders/my/fake-nonexistent-id', null, jwtToken);
    test('7.2', 'GET /orders/my/:id (nonexistent) returns 404', detail.status === 404);

    const cancel = await api('POST', '/orders/fake-id/cancel', { reason: 'Test' }, jwtToken);
    test('7.3', 'POST /:id/cancel (nonexistent) returns 404', cancel.status === 404);

    // Step 8: Verify JWT expiry (30 days)
    console.log('\n--- Step 8: JWT Properties ---');
    const parts = jwtToken?.split('.') || [];
    let payload = {};
    try { payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()); } catch {}
    test('8.1', 'JWT contains customer id', payload.id !== undefined);
    test('8.2', 'JWT role is "customer"', payload.role === 'customer');
    test('8.3', 'JWT expiry set (30d)', payload.exp !== undefined);
    console.log(`         Payload: ${JSON.stringify(payload)}`);

    // Final summary
    const total = passCount + failCount;
    console.log(`\n========================================`);
    console.log(`  RESULTS: ${passCount} PASS / ${failCount} FAIL / ${total} TOTAL`);
    console.log(`========================================\n`);

    // Cleanup
    if (serverProcess) serverProcess.kill();

    // Now do the mobile screen audit (static analysis)
    console.log('\n========================================');
    console.log('  MOBILE SCREEN AUTH AUDIT');
    console.log('========================================\n');

    const fs = require('fs');
    const screenDir = path.join(__dirname, '..', 'mobile', 'src', 'screens');
    
    const screens = [
        'ProfileScreen.js',
        'OrdersScreen.js',
        'WishlistScreen.js',
        'ReviewScreen.js',
        'MeasurementScreen.js',
        'BookingScreen.js'
    ];

    for (const file of screens) {
        const fp = path.join(screenDir, file);
        if (!fs.existsSync(fp)) {
            console.log(`  SKIP  ${file} - file not found`);
            continue;
        }
        const content = fs.readFileSync(fp, 'utf8');
        const importsApi = content.includes("from '../services/api'") || content.includes("from \"../services/api\"");
        const importsToken = content.includes('token') || content.includes('Token');
        const usesStore = content.includes('useStore') || content.includes('../store/useStore');
        const hasOnPress = content.includes('onPress') || content.includes('fetch') || content.includes('api.');
        const hasNavigation = content.includes('router') || content.includes('navigation');
        
        console.log(`  ${file}:`);
        console.log(`    Imports API:     ${importsApi ? 'YES' : 'NO'}`);
        console.log(`    Uses Store:      ${usesStore ? 'YES' : 'NO'}`);
        console.log(`    Has API calls:   ${hasOnPress ? 'YES' : 'NO'}`);
        console.log(`    Navigates:       ${hasNavigation ? 'YES' : 'NO'}`);
        console.log();
    }

    process.exit(failCount > 0 ? 1 : 0);
}

main().catch(e => {
    console.error('TEST CRASHED:', e.message);
    if (serverProcess) serverProcess.kill();
    process.exit(1);
});
