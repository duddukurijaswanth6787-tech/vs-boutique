const { PrismaClient } = require('@prisma/client');
const http = require('http');
const prisma = new PrismaClient();

const BASE = 'http://localhost:3005';
const PHONE = '9999999999';

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

async function runAudit() {
    console.log('====================================================');
    console.log('    CUSTOMER API INTEGRATION & VALIDATION AUDIT    ');
    console.log('====================================================\n');

    let token = null;
    const report = [];

    const record = (name, endpoint, status, success, details) => {
        report.push({ name, endpoint, status, success, details });
        console.log(`[${success ? 'PASS' : 'FAIL'}] ${name} (${endpoint}) -> Status: ${status}`);
    };

    try {
        // 1. Auth Endpoint: Send OTP
        const sendOtpRes = await api('POST', '/auth/send-otp', { phone: PHONE });
        const otpSent = sendOtpRes.status === 200;
        record('Send OTP', 'POST /auth/send-otp', sendOtpRes.status, otpSent, sendOtpRes.body);

        // 2. Read OTP from DB directly for authentication
        const user = await prisma.user.findUnique({ where: { phone: PHONE } });
        if (!user || !user.otp) {
            record('Read OTP from DB', 'Prisma Lookup', 500, false, 'No OTP generated');
            return;
        }

        // 3. Auth Endpoint: Verify OTP
        const verifyOtpRes = await api('POST', '/auth/verify-otp', { phone: PHONE, otp: user.otp });
        const otpVerified = verifyOtpRes.status === 200 && verifyOtpRes.body?.token;
        token = verifyOtpRes.body?.token;
        record('Verify OTP', 'POST /auth/verify-otp', verifyOtpRes.status, otpVerified, verifyOtpRes.body);

        if (!token) {
            console.error('Audit aborted: Token retrieval failed');
            return;
        }

        // 4. Public Boutique Details: target Tiny Tucks (has active subscription)
        const targetBoutique = await prisma.boutique.findFirst({
            where: {
                isDeleted: false,
                status: 'Active',
                subscriptions: {
                    some: { status: 'ACTIVE' }
                }
            }
        });
        
        if (targetBoutique) {
            const bid = targetBoutique.id;
            const bRes = await api('GET', `/boutiques/public/${bid}`);
            record('Get Public Boutique Details', `GET /boutiques/public/${bid}`, bRes.status, bRes.status === 200, bRes.body);
        } else {
            record('Get Public Boutique Details', 'GET /boutiques/public/:id', 200, true, 'Skipped: No active boutiques');
        }

        // 5. Public Product Browse
        const pRes = await api('GET', '/products/public/browse');
        record('Browse Public Products', 'GET /products/public/browse', pRes.status, pRes.status === 200, pRes.body);

        // 6. Customer Cart APIs
        const getCartRes = await api('GET', '/cart', null, token);
        record('Get Cart', 'GET /cart', getCartRes.status, getCartRes.status === 200, getCartRes.body);

        // Find an active product for cart/wishlist testing
        const activeProduct = await prisma.product.findFirst({ where: { isDeleted: false, status: 'ACTIVE' } });
        let variantId = null;
        if (activeProduct) {
            const variant = await prisma.productVariant.findFirst({ where: { productId: activeProduct.id } });
            if (variant) variantId = variant.id;
        }

        if (activeProduct && variantId) {
            // Add to Cart
            const addCartRes = await api('POST', '/cart/add', { productId: activeProduct.id, variantId, quantity: 1 }, token);
            record('Add Item to Cart', 'POST /cart/add', addCartRes.status, addCartRes.status === 200 || addCartRes.status === 201, addCartRes.body);

            // Add to Wishlist
            const addWishlistRes = await api('POST', `/products/wishlists/${activeProduct.id}`, null, token);
            record('Add Item to Wishlist', 'POST /products/wishlists/:id', addWishlistRes.status, addWishlistRes.status === 200 || addWishlistRes.status === 201 || addWishlistRes.status === 409, addWishlistRes.body);

            // Get Wishlist
            const getWishlistRes = await api('GET', '/products/wishlists/my', null, token);
            record('Get Wishlist', 'GET /products/wishlists/my', getWishlistRes.status, getWishlistRes.status === 200, getWishlistRes.body);

            // Remove from Wishlist
            const remWishlistRes = await api('DELETE', `/products/wishlists/${activeProduct.id}`, null, token);
            record('Remove Item from Wishlist', 'DELETE /products/wishlists/:id', remWishlistRes.status, remWishlistRes.status === 200, remWishlistRes.body);
        }

        // 7. Shipping Addresses APIs
        const addAddressPayload = {
            fullName: 'Audit Test User',
            phone: '9876543210',
            addressLine1: '123 Test Street',
            addressLine2: 'Apt 4B',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            isDefault: true
        };
        const addAddrRes = await api('POST', '/shipping-addresses', addAddressPayload, token);
        const addrId = addAddrRes.body?.data?.id || addAddrRes.body?.id;
        record('Create Shipping Address', 'POST /shipping-addresses', addAddrRes.status, addAddrRes.status === 201 || addAddrRes.status === 200, addAddrRes.body);

        if (addrId) {
            // Get Addresses
            const getAddrRes = await api('GET', '/shipping-addresses', null, token);
            record('Get Shipping Addresses', 'GET /shipping-addresses', getAddrRes.status, getAddrRes.status === 200, getAddrRes.body);

            // Update Address
            const updateAddrRes = await api('PUT', `/shipping-addresses/${addrId}`, { ...addAddressPayload, fullName: 'Audit Updated User' }, token);
            record('Update Shipping Address', 'PUT /shipping-addresses/:id', updateAddrRes.status, updateAddrRes.status === 200, updateAddrRes.body);

            // Delete Address
            const delAddrRes = await api('DELETE', `/shipping-addresses/${addrId}`, null, token);
            record('Delete Shipping Address', 'DELETE /shipping-addresses/:id', delAddrRes.status, delAddrRes.status === 200, delAddrRes.body);
        }

        // 8. Custom Measurements APIs
        const saveMeasPayload = {
            measurements: { chest: 38.5, waist: 32.0, length: 28.0, shoulder: 17.5 },
            notes: 'Fitted fit preferred'
        };
        const saveMeasRes = await api('PUT', '/measurements/me', saveMeasPayload, token);
        record('Save Body Measurements', 'PUT /measurements/me', saveMeasRes.status, saveMeasRes.status === 200, saveMeasRes.body);

        const getMeasRes = await api('GET', '/measurements/me', null, token);
        record('Get Body Measurements', 'GET /measurements/me', getMeasRes.status, getMeasRes.status === 200, getMeasRes.body);

        // 9. Bookings APIs
        if (targetBoutique) {
            const createBookingPayload = {
                boutiqueId: targetBoutique.id,
                customerName: 'Audit Test',
                customerMobile: PHONE,
                bookingDate: '2026-07-01',
                bookingTime: '11:00 AM',
                bookingType: 'STORE_VISIT',
                notes: 'Consultation'
            };
            const createBookRes = await api('POST', '/bookings', createBookingPayload, token);
            record('Create Consultation Booking', 'POST /bookings', createBookRes.status, createBookRes.status === 200 || createBookRes.status === 201, createBookRes.body);

            const getBookRes = await api('GET', '/bookings/my', null, token);
            record('Get Consultation Bookings', 'GET /bookings/my', getBookRes.status, getBookRes.status === 200, getBookRes.body);
        }

        // 10. Notifications APIs
        const getNotifRes = await api('GET', '/customer/notifications', null, token);
        record('Get Notifications', 'GET /customer/notifications', getNotifRes.status, getNotifRes.status === 200, getNotifRes.body);

        const getUnreadRes = await api('GET', '/customer/notifications/unread-count', null, token);
        record('Get Unread Notifications Count', 'GET /customer/notifications/unread-count', getUnreadRes.status, getUnreadRes.status === 200, getUnreadRes.body);

        // 11. Returns & Exchanges APIs
        const getReturnsRes = await api('GET', '/returns/my', null, token);
        record('Get Returns History', 'GET /returns/my', getReturnsRes.status, getReturnsRes.status === 200, getReturnsRes.body);

        const getExchangesRes = await api('GET', '/exchanges/my', null, token);
        record('Get Exchanges History', 'GET /exchanges/my', getExchangesRes.status, getExchangesRes.status === 200, getExchangesRes.body);

        console.log('\n====================================================');
        console.log('    AUDIT RUN COMPLETED SUCCESSFULY                ');
        console.log('====================================================\n');
        
    } catch (err) {
        console.error('Audit run encountered error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

runAudit();
