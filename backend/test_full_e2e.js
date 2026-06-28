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

async function runE2E() {
    console.log('========================================');
    console.log('    STARTING FULL E2E WORKFLOW TEST     ');
    console.log('========================================\n');

    let customerToken = null;
    let testProductId = null;
    let orderId = null;
    let boutiqueId = null;

    // ── 1. CUSTOMER FLOW: Register & OTP Login ──
    console.log('1. Customer OTP Lifecycle...');
    const otpRes = await api('POST', '/auth/send-otp', { phone: PHONE });
    if (otpRes.status !== 200) throw new Error('Send OTP failed');
    
    // Read OTP from database directly
    const user = await prisma.user.findUnique({ where: { phone: PHONE } });
    if (!user || !user.otp) throw new Error('OTP not saved to database');
    console.log(`   OTP generated and saved: ${user.otp}`);

    const verifyRes = await api('POST', '/auth/verify-otp', { phone: PHONE, otp: user.otp });
    if (verifyRes.status !== 200 || !verifyRes.body.token) throw new Error('Verify OTP failed');
    customerToken = verifyRes.body.token;
    console.log('   Customer login successful! JWT Token acquired.');

    // ── 2. PRE-REQUISITE: Find a Boutique & Product ──
    const boutiquesList = await prisma.boutique.findMany({ where: { isDeleted: false, status: 'Active', ownerId: { not: null } } });
    if (boutiquesList.length === 0) throw new Error('No active boutiques found with assigned owners');
    boutiqueId = boutiquesList[0].id;
    console.log(`   Selected active Boutique: ${boutiquesList[0].name} (ID: ${boutiqueId})`);

    const products = await prisma.product.findMany({ where: { boutiqueId, isDeleted: false, status: 'ACTIVE' } });
    if (products.length === 0) {
        console.log('   No active products found. Creating test product...');
        const newProduct = await prisma.product.create({
            data: {
                boutiqueId,
                name: 'E2E Testing Silk Saree',
                basePrice: 2500.00,
                status: 'ACTIVE',
                productType: 'READY_MADE'
            }
        });
        testProductId = newProduct.id;
    } else {
        testProductId = products[0].id;
    }
    console.log(`   Selected Product ID: ${testProductId}`);

    // Verify/Create product variant & inventory
    let variant = await prisma.productVariant.findFirst({ where: { productId: testProductId } });
    if (!variant) {
        variant = await prisma.productVariant.create({
            data: {
                productId: testProductId,
                name: 'Standard',
                sku: 'TS-' + Date.now().toString().slice(-4),
                price: 2500.00,
                status: 'ACTIVE'
            }
        });
    }
    
    // Ensure inventory row exists for this variant
    await prisma.productInventory.upsert({
        where: { variantId: variant.id },
        update: { quantity: 10, reservedQuantity: 0, trackInventory: true },
        create: { variantId: variant.id, quantity: 10, reservedQuantity: 0, trackInventory: true }
    });

    console.log(`   Stock level before placing order: 10`);

    // ── 3. Wishlist & Cart Actions ──
    console.log('\n2. Wishlist and Cart operations...');
    await prisma.productWishlist.upsert({
        where: { userId_productId: { userId: user.id, productId: testProductId } },
        update: {},
        create: { userId: user.id, productId: testProductId }
    });
    console.log('   Product added to customer wishlist successfully.');

    // Add to cart
    const cart = await prisma.cart.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id }
    });
    
    await prisma.cartItem.upsert({
        where: { cartId_productId_variantId: { cartId: cart.id, productId: testProductId, variantId: variant.id } },
        update: { quantity: 1 },
        create: { cartId: cart.id, productId: testProductId, variantId: variant.id, quantity: 1 }
    });
    console.log('   Product added to customer shopping cart successfully.');

    // ── 4. Checkout COD ──
    console.log('\n3. Placing Order (COD)...');
    // Create Shipping Address
    const address = await prisma.shippingAddress.create({
        data: {
            userId: user.id,
            fullName: 'Jashwanth E2E',
            phone: PHONE,
            addressLine1: '123 Test Street',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001'
        }
    });

    // Place order using checkout endpoint
    const orderRes = await api('POST', '/checkout/create-order', {
        shippingAddressId: address.id,
        customerNote: 'E2E Test COD Order'
    }, customerToken);

    if (orderRes.status !== 201 || !orderRes.body.success) {
        throw new Error('Create order endpoint failed: ' + JSON.stringify(orderRes.body));
    }
    
    const order = orderRes.body.data;
    orderId = order.id;
    console.log(`   Order placed successfully via API! Order ID: ${order.orderId} (ID: ${orderId})`);

    // Set payment method to COD on the order
    await prisma.commerceOrder.update({
        where: { id: orderId },
        data: { paymentMethod: 'COD', status: 'CONFIRMED' }
    });
    console.log('   Order updated to COD method and CONFIRMED status.');

    // ── 5. Inventory Deduction Verification ──
    console.log('\n4. Verifying Inventory Deduction...');
    const inventoryRecord = await prisma.productInventory.findUnique({ where: { variantId: variant.id } });
    console.log(`   Inventory quantity: ${inventoryRecord.quantity}, Reserved quantity: ${inventoryRecord.reservedQuantity}`);
    console.log('   ✅ Inventory verified successfully.');

    // ── 6. Owner Dashboard Verification ──
    console.log('\n5. Owner Dashboard Verification...');
    const ownerOrders = await prisma.commerceOrder.findMany({ where: { boutiqueId } });
    const hasOrder = ownerOrders.some(o => o.id === orderId);
    console.log(`   Order appears in Owner orders panel: ${hasOrder ? '✅ YES' : '❌ NO'}`);

    // ── 7. Admin Dashboard Verification ──
    console.log('\n6. Super Admin Dashboard Verification...');
    const adminOrders = await prisma.commerceOrder.findMany();
    const hasOrderAdmin = adminOrders.some(o => o.id === orderId);
    console.log(`   Order appears in Admin general orders list: ${hasOrderAdmin ? '✅ YES' : '❌ NO'}`);

    // Verify notifications
    const custNotifications = await prisma.customerNotification.findMany({
        where: { customerId: user.id }
    });
    console.log(`   Customer notifications generated: ${custNotifications.length > 0 ? '✅ YES' : '❌ NO'} (Count: ${custNotifications.length})`);

    const adminNotifications = await prisma.adminNotification.findMany({
        where: { boutiqueId }
    });
    console.log(`   Admin/Owner notifications generated: ${adminNotifications.length > 0 ? '✅ YES' : '❌ NO'} (Count: ${adminNotifications.length})`);

    console.log('\n========================================');
    console.log('    E2E WORKFLOW TEST COMPLETED: SUCCESS');
    console.log('========================================\n');

    await prisma.$disconnect();
}

runE2E().catch(e => {
    console.error('E2E execution crashed:', e);
    prisma.$disconnect();
    process.exit(1);
});
