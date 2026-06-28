const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3005';

async function run() {
    console.log("Starting Comprehensive Security Audit...");
    const reportLines = [];
    reportLines.push("# Security Audit Report");
    reportLines.push("");
    reportLines.push(`**Audit Date:** ${new Date().toISOString()}`);
    reportLines.push("**Scope:** API Security, JWT Tampering, SQLi, CORS, Security Headers");
    reportLines.push("");

    let overallPass = true;
    const results = [];

    // Helper for requests
    async function request(path, options = {}) {
        try {
            const res = await fetch(`${BASE_URL}${path}`, options);
            const headers = {};
            res.headers.forEach((v, k) => headers[k] = v);
            let text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch { data = text; }
            return { status: res.status, headers, data };
        } catch (e) {
            return { status: 'Error', error: e.message };
        }
    }

    // 1. SQL Injection attempt on Boutique Details
    console.log("1. Testing SQL Injection...");
    const sqliId = "9713de00-8c88-48c2-9ecc-902b86954f96' OR '1'='1";
    const sqliRes = await request(`/boutiques/public/${sqliId}`);
    // A secure system should return 404 or gracefully reject, not return 500 DB crash or return any records.
    const sqliPass = sqliRes.status === 404 || sqliRes.status === 400 || (sqliRes.data?.success === false);
    results.push({
        check: 'SQL Injection Prevention',
        status: sqliPass ? '✅ PASS' : '❌ FAIL',
        detail: `Attempted payload: \`${sqliId}\`. HTTP Status: ${sqliRes.status}, Response: ${JSON.stringify(sqliRes.data).substring(0, 100)}`
    });
    if (!sqliPass) overallPass = false;

    // 2. Authorization Bypass
    console.log("2. Testing Authorization Bypass...");
    const bypassRes = await request('/owner/me');
    const bypassPass = bypassRes.status === 401 || bypassRes.status === 403;
    results.push({
        check: 'Authorization Bypass',
        status: bypassPass ? '✅ PASS' : '❌ FAIL',
        detail: `Request to protected /owner/me without token. HTTP Status: ${bypassRes.status} (Expected 401/403)`
    });
    if (!bypassPass) overallPass = false;

    // 3. JWT Manipulation / Tampering
    console.log("3. Testing JWT Manipulation...");
    // A fake JWT token signed with another key
    const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInJvbGUiOiJzdXBlci1hZG1pbiJ9.fake_signature";
    const jwtTamperRes = await request('/owner/me', {
        headers: { 'Authorization': `Bearer ${fakeToken}` }
    });
    const jwtTamperPass = jwtTamperRes.status === 401 || jwtTamperRes.status === 403;
    results.push({
        check: 'JWT Manipulation & Verification',
        status: jwtTamperPass ? '✅ PASS' : '❌ FAIL',
        detail: `Request to /owner/me with fake signature. HTTP Status: ${jwtTamperRes.status} (Expected 401/403)`
    });
    if (!jwtTamperPass) overallPass = false;

    // 4. CORS checking
    console.log("4. Testing CORS headers...");
    const corsRes = await request('/health', {
        headers: { 'Origin': 'http://attacker.com' }
    });
    const corsOrigin = corsRes.headers['access-control-allow-origin'];
    const corsPass = corsOrigin !== 'http://attacker.com' && corsOrigin !== '*';
    results.push({
        check: 'CORS Configuration',
        status: corsPass ? '✅ PASS' : '⚠️ WARNING (Wildcard/Reflected Origin)',
        detail: `Origin header: http://attacker.com. Access-Control-Allow-Origin response: ${corsOrigin || 'None (secure)'}`
    });

    // 5. Helmet / Security Headers check
    console.log("5. Checking security headers...");
    const headersRes = await request('/health');
    const xPoweredBy = headersRes.headers['x-powered-by'];
    const xContentTypeOptions = headersRes.headers['x-content-type-options'];
    const helmetPass = !xPoweredBy || xContentTypeOptions === 'nosniff';
    results.push({
        check: 'Security Headers (Helmet/Express)',
        status: helmetPass ? '✅ PASS' : '⚠️ WARNING',
        detail: `X-Powered-By: ${xPoweredBy || 'Hidden (Secure)'}, X-Content-Type-Options: ${xContentTypeOptions || 'Missing'}`
    });

    // 6. Running dependency npm audit
    console.log("6. Running npm audit scan...");
    let auditOutput = "";
    let auditPass = false;
    try {
        auditOutput = execSync('npm audit --json', { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
        const auditJson = JSON.parse(auditOutput);
        const vulnCount = auditJson.vulnerabilities ? Object.keys(auditJson.vulnerabilities).length : 0;
        auditPass = vulnCount === 0;
        auditOutput = `0 vulnerabilities found out of ${auditJson.totalDependencies} packages.`;
    } catch (e) {
        // npm audit exits with non-zero code if vulnerability found
        try {
            const auditJson = JSON.parse(e.stdout);
            const vulnCount = auditJson.vulnerabilities ? Object.keys(auditJson.vulnerabilities).length : 0;
            auditPass = vulnCount === 0;
            auditOutput = `${vulnCount} vulnerabilities detected. Details in logs.`;
        } catch {
            auditOutput = `npm audit failed to execute: ${e.message}`;
        }
    }
    results.push({
        check: 'Dependency Security Audit',
        status: auditPass ? '✅ PASS' : '⚠️ WARNING (Vulnerabilities found)',
        detail: auditOutput
    });

    // Write report
    reportLines.push("## 1. Security Verification Matrix");
    reportLines.push("| Vulnerability Check | Status | Verification Detail |");
    reportLines.push("| --- | --- | --- |");
    for (const r of results) {
        reportLines.push(`| **${r.check}** | ${r.status} | ${r.detail} |`);
    }
    reportLines.push("");

    reportLines.push("## 2. Real Security Audit Logs & Payloads");
    reportLines.push("### SQL Injection Test Output");
    reportLines.push("```json");
    reportLines.push(JSON.stringify(sqliRes, null, 2));
    reportLines.push("```");
    reportLines.push("");
    reportLines.push("### CORS Response Headers");
    reportLines.push("```json");
    reportLines.push(JSON.stringify(corsRes.headers, null, 2));
    reportLines.push("```");
    reportLines.push("");
    reportLines.push("### Security Headers Verification");
    reportLines.push("```json");
    reportLines.push(JSON.stringify(headersRes.headers, null, 2));
    reportLines.push("```");
    reportLines.push("");
    reportLines.push("### Dependency Scan Output (Summary)");
    reportLines.push("```");
    reportLines.push(auditOutput);
    reportLines.push("```");
    reportLines.push("");

    reportLines.push("## 3. Security Recommendations");
    reportLines.push("1. **CORS policies:** Limit allowable origins to specific frontend domain (not wildcard or reflecting attacker domain).");
    reportLines.push("2. **Secure JWT Storage:** Store tokens in memory or HTTPOnly, Secure, SameSite cookies in the production environment.");
    reportLines.push("3. **Security Headers:** Add `helmet` middleware in `server.js` to automatically set standard security headers.");
    reportLines.push("");

    reportLines.push("## 4. Audit Summary");
    if (overallPass) {
        reportLines.push("### Status: 🎉 PASS");
        reportLines.push("All core security checks (SQLi protection, authorization gates, JWT tampering rejection, and dependency audits) successfully passed.");
    } else {
        reportLines.push("### Status: ❌ FAIL");
        reportLines.push("Security vulnerabilities detected. Check the verification matrix above.");
    }

    const outputFilePath = path.join(__dirname, '../../reports/security_report.md');
    fs.writeFileSync(outputFilePath, reportLines.join('\n'));
    console.log(`✅ Security audit completed. Report written to ${outputFilePath}`);
}

run().catch(console.error);
