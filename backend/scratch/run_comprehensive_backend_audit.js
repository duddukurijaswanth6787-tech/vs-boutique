const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3005';
const TEST_PHONE = '9999999999';

async function run() {
    console.log("Starting Comprehensive Backend Audit...");
    const reportLines = [];
    reportLines.push("# Backend Audit Report");
    reportLines.push("");
    reportLines.push(`**Audit Date:** ${new Date().toISOString()}`);
    reportLines.push(`**Service:** Node.js Express API`);
    reportLines.push(`**Target URL:** ${BASE_URL}`);
    reportLines.push("");

    let overallPass = true;
    let jwtToken = null;
    const testResults = [];

    // helper function for making HTTP requests
    async function apiRequest(method, path, body = null, token = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const options = {
            method,
            headers
        };
        if (body) options.body = JSON.stringify(body);

        try {
            const res = await fetch(`${BASE_URL}${path}`, options);
            let responseText = await res.text();
            let data;
            try { data = JSON.parse(responseText); } catch { data = responseText; }
            return { status: res.status, ok: res.ok, data };
        } catch (e) {
            return { status: 'NetworkError', ok: false, error: e.message };
        }
    }

    // 1. Health Check
    console.log("1. Checking Health Endpoint...");
    const health = await apiRequest('GET', '/health');
    const healthPass = health.status === 200 && health.data?.status === 'healthy';
    testResults.push({ name: 'Health Check Endpoint', status: healthPass ? '✅ PASS' : '❌ FAIL', detail: `Status: ${health.status}, DB status: ${health.data?.database}` });
    if (!healthPass) overallPass = false;

    // 2. OTP Generation & Verification Lifecycle
    console.log("2. Testing OTP lifecycle...");
    const sendOtp = await apiRequest('POST', '/auth/send-otp', { phone: TEST_PHONE });
    let otpCode = null;
    let otpPass = false;
    let otpClearedPass = false;
    let invalidOtpPass = false;

    if (sendOtp.status === 200) {
        // Read OTP from database directly to verify
        const user = await prisma.user.findUnique({ where: { phone: TEST_PHONE } });
        if (user && user.otp) {
            otpCode = user.otp;
            otpPass = true;

            // Verify with correct OTP
            const verify = await apiRequest('POST', '/auth/verify-otp', { phone: TEST_PHONE, otp: otpCode });
            jwtToken = verify.data?.token;

            if (verify.status === 200 && jwtToken) {
                // Verify OTP was cleared
                const userAfter = await prisma.user.findUnique({ where: { phone: TEST_PHONE } });
                if (userAfter && userAfter.otp === null) {
                    otpClearedPass = true;
                }
            }

            // Verify with incorrect OTP
            const verifyBad = await apiRequest('POST', '/auth/verify-otp', { phone: TEST_PHONE, otp: '000000' });
            if (verifyBad.status === 400 || verifyBad.status === 401) {
                invalidOtpPass = true;
            }
        }
    }
    testResults.push({ name: 'OTP Lifecycle (Send/Verify)', status: otpPass && otpClearedPass ? '✅ PASS' : '❌ FAIL', detail: `OTP generated: ${otpCode !== null}, OTP cleared: ${otpClearedPass}, Invalid OTP rejected: ${invalidOtpPass}` });
    if (!otpPass || !otpClearedPass) overallPass = false;

    // 3. JWT and Protection Check
    console.log("3. Testing JWT & Protection...");
    const unprotectedRes = await apiRequest('GET', '/orders/my');
    const protectedRes = await apiRequest('GET', '/orders/my', null, jwtToken);
    const jwtPass = unprotectedRes.status === 401 && protectedRes.status === 200;
    testResults.push({ name: 'Route Protection (JWT)', status: jwtPass ? '✅ PASS' : '❌ FAIL', detail: `Protected route returns 401 without token: ${unprotectedRes.status === 401}, returns 200 with token: ${protectedRes.status === 200}` });
    if (!jwtPass) overallPass = false;

    // 4. Rate Limiting Check
    console.log("4. Testing Rate Limiting...");
    let limitReached = false;
    let rateLimitDetail = "No 429 response triggered";
    // Hit /auth/send-otp up to 25 times to trigger rate limit (max 20 requests per 15 minutes)
    for (let i = 0; i < 25; i++) {
        const res = await apiRequest('POST', '/auth/send-otp', { phone: TEST_PHONE });
        if (res.status === 429) {
            limitReached = true;
            rateLimitDetail = `Successfully triggered 429 after ${i + 1} requests. Response: ${JSON.stringify(res.data)}`;
            break;
        }
    }
    testResults.push({ name: 'Rate Limiting', status: limitReached ? '✅ PASS' : '❌ FAIL', detail: rateLimitDetail });
    if (!limitReached) overallPass = false;

    // 5. Check File Upload & S3 config
    console.log("5. Checking S3 upload config...");
    const hasS3Config = process.env.AWS_ACCESS_KEY && process.env.AWS_SECRET_KEY && process.env.AWS_REGION && process.env.AWS_BUCKET_NAME;
    testResults.push({
        name: 'File Upload & S3 config',
        status: hasS3Config ? '✅ PASS' : '⚠️ WARNING (Config Incomplete)',
        detail: `AWS Region: ${process.env.AWS_REGION || 'missing'}, Bucket: ${process.env.AWS_BUCKET_NAME || 'missing'}`
    });

    // 6. Check Razorpay Keys config
    console.log("6. Checking Razorpay payments config...");
    const hasRazorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;
    const isRazorpayTest = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_');
    testResults.push({
        name: 'Razorpay Payments integration',
        status: hasRazorpay ? '✅ PASS' : '❌ FAIL',
        detail: `Razorpay configured: ${Boolean(hasRazorpay)}, Mode: ${isRazorpayTest ? 'TEST MODE' : 'PRODUCTION MODE'}`
    });
    if (!hasRazorpay) overallPass = false;

    // 7. Check Scheduled Jobs (Cron)
    console.log("7. Checking Scheduled Jobs...");
    // Let's inspect server.js or see if the health monitor exists.
    const serverJsPath = path.join(__dirname, '../src/server.js');
    const serverJsContent = fs.existsSync(serverJsPath) ? fs.readFileSync(serverJsPath, 'utf8') : '';
    const hasCron = serverJsContent.includes('startSystemHealthMonitor') || serverJsContent.includes('cron') || serverJsContent.includes('setInterval');
    testResults.push({
        name: 'Scheduled Jobs (Health Check Monitor)',
        status: hasCron ? '✅ PASS' : '⚠️ WARNING',
        detail: `Health monitor interval/cron found in server.js: ${hasCron}`
    });

    // 8. Test Endpoints Verification Matrix
    console.log("8. Testing individual endpoint validation...");
    const endpointsToTest = [
        { method: 'GET', path: '/boutiques/public', expectedStatus: 200, name: 'GET /boutiques/public (Public Boutique Catalog)' },
        { method: 'GET', path: '/categories', expectedStatus: 200, name: 'GET /categories (Product Categories)' },
        { method: 'GET', path: '/subcategories', expectedStatus: 200, name: 'GET /subcategories (Product Subcategories)' },
        { method: 'GET', path: '/products/public/browse', expectedStatus: 200, name: 'GET /products/public/browse (Product Listings)' },
    ];

    const endpointResults = [];
    for (const ep of endpointsToTest) {
        const res = await apiRequest(ep.method, ep.path);
        const pass = res.status === ep.expectedStatus;
        endpointResults.push({
            name: ep.name,
            status: pass ? '✅ PASS' : '❌ FAIL',
            detail: `HTTP Status: ${res.status} (Expected ${ep.expectedStatus}), Response: ${res.data ? (typeof res.data === 'object' ? JSON.stringify(res.data) : String(res.data)).substring(0, 100) : 'No data'}`
        });
        if (!pass) overallPass = false;
    }

    // Compile into backend_report.md
    reportLines.push("## 1. Backend Verification Matrix");
    reportLines.push("| Verification Check | Status | Details |");
    reportLines.push("| --- | --- | --- |");
    for (const r of testResults) {
        reportLines.push(`| **${r.name}** | ${r.status} | ${r.detail} |`);
    }
    reportLines.push("");

    reportLines.push("## 2. API Endpoint Verification Matrix");
    reportLines.push("| Endpoint Check | Status | Response Detail |");
    reportLines.push("| --- | --- | --- |");
    for (const r of endpointResults) {
        reportLines.push(`| **${r.name}** | ${r.status} | ${r.detail} |`);
    }
    reportLines.push("");

    reportLines.push("## 3. Real Execution Logs");
    reportLines.push("```");
    reportLines.push(`=== VERIFYING BACKEND SERVER ===`);
    reportLines.push(`GET /health status: ${health.status}`);
    reportLines.push(JSON.stringify(health.data, null, 2));
    reportLines.push("");
    reportLines.push(`=== OTP FLOW ===`);
    reportLines.push(`POST /auth/send-otp: ${sendOtp.status}`);
    reportLines.push(`OTP directly fetched from Postgres user row: ${otpCode}`);
    reportLines.push(`POST /auth/verify-otp (correct OTP): ${otpClearedPass ? 'Cleared & JWT returned' : 'Failed'}`);
    reportLines.push(`POST /auth/verify-otp (incorrect OTP): ${invalidOtpPass ? 'Rejected (400/401)' : 'Failed'}`);
    reportLines.push("");
    reportLines.push(`=== RATE LIMITING ===`);
    reportLines.push(rateLimitDetail);
    reportLines.push("```");
    reportLines.push("");

    reportLines.push("## 4. Audit Summary");
    if (overallPass) {
        reportLines.push("### Status: 🎉 PASS");
        reportLines.push("All core backend systems, including health checks, database OTP verification, route protections, rate limitings, and payment config validations, are active and verified.");
    } else {
        reportLines.push("### Status: ❌ FAIL");
        reportLines.push("Critical backend issues were detected. Check the verification matrix above.");
    }

    const outputFilePath = path.join(__dirname, '../../reports/backend_report.md');
    fs.writeFileSync(outputFilePath, reportLines.join('\n'));
    console.log(`✅ Backend audit completed. Report written to ${outputFilePath}`);

    await prisma.$disconnect();
}

run().catch(console.error);
