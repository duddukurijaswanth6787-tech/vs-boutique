const http = require('http');
function api(method, path, body, token) {
    return new Promise(resolve => {
        const opts = { method, hostname: 'localhost', port: 3005, path, headers: { 'Content-Type': 'application/json' } };
        if (token) opts.headers['Authorization'] = 'Bearer ' + token;
        const req = http.request(opts, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
        });
        req.setTimeout(10000);
        req.on('error', e => resolve({ status: 0, body: e.message }));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function main() {
    console.log('=== Send OTP ===');
    const otpRes = await api('POST', '/auth/send-otp', { phone: '9999999999' });
    console.log(JSON.stringify(otpRes.body, null, 2));
    const otpCode = otpRes.body?.otp || '000000';
    console.log('OTP:', otpCode);

    console.log('\n=== Verify OTP ===');
    const verify = await api('POST', '/auth/verify-otp', { phone: '9999999999', otp: otpCode });
    console.log(JSON.stringify(verify.body, null, 2));
    const token = verify.body?.token;
    if (!token) { console.log('NO TOKEN'); return; }
    console.log('TOKEN OK');

    console.log('\n=== Get Wishlist (empty) ===');
    console.log(JSON.stringify((await api('GET', '/products/wishlists/my', null, token)).body, null, 2));

    const pid = 'dcd60b0d-54f7-4e92-8a22-99e4eb5edea3';
    console.log('\n=== Add to Wishlist ===');
    console.log(JSON.stringify((await api('POST', '/products/wishlists/' + pid, null, token)).body, null, 2));

    console.log('\n=== Get Wishlist (full) ===');
    const wl = (await api('GET', '/products/wishlists/my', null, token)).body;
    console.log('Items:', wl.data?.length);
    console.log('First item product:', wl.data?.[0]?.product?.name);
    console.log('\nFull first item:');
    console.log(JSON.stringify(wl.data?.[0], null, 2).substring(0, 800));

    console.log('\n=== Add Duplicate ===');
    console.log(JSON.stringify((await api('POST', '/products/wishlists/' + pid, null, token)).body, null, 2));

    console.log('\n=== Delete from Wishlist ===');
    console.log(JSON.stringify((await api('DELETE', '/products/wishlists/' + pid, null, token)).body, null, 2));

    console.log('\n=== Verify Empty ===');
    const wl2 = await api('GET', '/products/wishlists/my', null, token);
    console.log('Items:', wl2.body?.data?.length);

    console.log('\n=== Unauthenticated ===');
    console.log(JSON.stringify((await api('GET', '/products/wishlists/my', null, null)).body, null, 2));
}
main();
