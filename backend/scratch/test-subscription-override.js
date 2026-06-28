const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const baseUrl = 'http://localhost:3000';

async function runTests() {
    console.log('🚀 STARTING SUPER ADMIN SUBSCRIPTION & ACCESS CONTROL CENTER INTEGRATION TESTS...');

    let adminToken = null;
    let ownerToken = null;
    let testBoutique = null;
    let testOwner = null;
    let testUser = null;
    let planStarterId = null;

    try {
        // ----------------------------------------------------
        // SETUP TEST DATA
        // ----------------------------------------------------
        console.log('\n--- SETUP TEST DATA ---');

        // Resolve Starter Plan
        const starterPlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'STARTER' } });
        if (!starterPlan) {
            throw new Error('STARTER subscription plan not found in database. Run standard seed first.');
        }
        planStarterId = starterPlan.id;

        // Login as Super Admin to get token
        const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'superadmin', password: 'admin@123' })
        });
        const adminLoginData = await adminLoginRes.json();
        adminToken = adminLoginData.token;
        console.log('✅ Logged in as Super Admin.');

        // Create a unique test owner & boutique
        const uniqueSuffix = Date.now().toString().slice(-6);
        testBoutique = await prisma.boutique.create({
            data: {
                name: `Override Test Boutique ${uniqueSuffix}`,
                ownerName: 'Override Owner',
                mobileNumber: '9999900000',
                email: `override_boutique_${uniqueSuffix}@test.com`,
                experienceYears: 4,
                startingPrice: 500.00,
                servicesOffered: ['Saree'],
                workTypeSpecialty: ['Embroidery'],
                fullAddress: '123 Overrider St',
                city: 'Hyderabad',
                state: 'Telangana',
                subscriptionEnforcement: false // Default FALSE
            }
        });
        console.log(`✅ Test Boutique created: "${testBoutique.name}"`);

        testOwner = await prisma.owner.create({
            data: {
                ownerName: 'Override Owner',
                username: `override_owner_${uniqueSuffix}`,
                email: `override_owner_${uniqueSuffix}@test.com`,
                mobileNumber: '9999900000',
                password: await require('bcrypt').hash('Password@123', 10),
                role: 'owner',
                status: 'Active',
                assignedBoutiqueId: testBoutique.id,
                mustResetPassword: false
            }
        });
        console.log(`✅ Test Owner created: "${testOwner.username}"`);

        // Set up active subscription
        const sub = await prisma.boutiqueSubscription.create({
            data: {
                boutiqueId: testBoutique.id,
                planId: starterPlan.id,
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000)
            }
        });
        console.log(`✅ Subscription created: plan=${starterPlan.name}, status=${sub.status}`);

        // Login as Test Owner to get owner token
        const ownerLoginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: testOwner.username, password: 'Password@123' })
        });
        const ownerLoginData = await ownerLoginRes.json();
        ownerToken = ownerLoginData.token;
        console.log('✅ Logged in as Boutique Owner.');

        // Create a user for booking/reviews tests
        testUser = await prisma.user.create({
            data: {
                phone: `99000${uniqueSuffix}`,
                name: 'Override Customer',
                status: 'ACTIVE'
            }
        });

        // ----------------------------------------------------
        // TEST 1: SUBSCRIPTION ENFORCEMENT OFF (DEFAULT)
        // ----------------------------------------------------
        console.log('\n--- TEST 1: SUBSCRIPTION ENFORCEMENT OFF ---');
        
        // Force expire the subscription
        await prisma.boutiqueSubscription.update({
            where: { id: sub.id },
            data: { status: 'EXPIRED' }
        });
        console.log('Forced subscription status to: EXPIRED');

        // Verify write actions are allowed since enforcement is OFF
        const { validateSubscriptionLimit } = require('../src/services/subscriptionService');
        const allowed = await validateSubscriptionLimit(testBoutique.id, 'designs');
        if (allowed === true) {
            console.log('✅ SUCCESS: validateSubscriptionLimit bypassed expired checks successfully.');
        } else {
            console.log('❌ FAIL: validateSubscriptionLimit blocked expired boutique.');
        }

        // ----------------------------------------------------
        // TEST 2: SUBSCRIPTION ENFORCEMENT ON
        // ----------------------------------------------------
        console.log('\n--- TEST 2: SUBSCRIPTION ENFORCEMENT ON ---');
        
        // Turn enforcement ON via PUT /admin/subscriptions/update
        await fetch(`${baseUrl}/admin/subscriptions/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                ownerId: testOwner.id,
                boutiqueId: testBoutique.id,
                subscriptionEnforcement: true
            })
        });
        console.log('Subscription enforcement toggled: TRUE (via API)');

        try {
            await validateSubscriptionLimit(testBoutique.id, 'designs');
            console.log('❌ FAIL: validateSubscriptionLimit allowed expired plan with enforcement ON.');
        } catch (err) {
            if (err.message.includes('EXPIRED')) {
                console.log('✅ SUCCESS: validateSubscriptionLimit blocked expired plan with error:', err.message);
            } else {
                console.log('❌ FAIL: validateSubscriptionLimit threw incorrect error:', err.message);
            }
        }

        // Turn enforcement back OFF for remainder of tests via PUT /admin/subscriptions/update
        await fetch(`${baseUrl}/admin/subscriptions/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                ownerId: testOwner.id,
                boutiqueId: testBoutique.id,
                subscriptionEnforcement: false
            })
        });
        console.log('Subscription enforcement toggled: FALSE (via API)');

        // ----------------------------------------------------
        // TEST 3: FEATURE PERMISSION TOGGLE (canManageOrders)
        // ----------------------------------------------------
        console.log('\n--- TEST 3: FEATURE PERMISSION TOGGLE ---');

        // Try listing orders first (should succeed by default)
        let getOrdersRes = await fetch(`${baseUrl}/orders`, {
            headers: { 'Authorization': `Bearer ${ownerToken}` }
        });
        console.log(`Initial GET /orders status: ${getOrdersRes.status} (expected 200)`);

        // Disable orders feature via update endpoint
        let updatePermsRes = await fetch(`${baseUrl}/admin/subscriptions/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                ownerId: testOwner.id,
                boutiqueId: testBoutique.id,
                featurePermissions: {
                    canManageOrders: false
                }
            })
        });
        console.log(`Disabled canManageOrders module via PUT /admin/subscriptions/update: ${updatePermsRes.status}`);

        // Try listing orders again (should be blocked)
        getOrdersRes = await fetch(`${baseUrl}/orders`, {
            headers: { 'Authorization': `Bearer ${ownerToken}` }
        });
        const getOrdersBody = await getOrdersRes.json();
        if (getOrdersRes.status === 403 && getOrdersBody.message.includes('disabled')) {
            console.log('✅ SUCCESS: GET /orders blocked with 403:', getOrdersBody.message);
        } else {
            console.log(`❌ FAIL: GET /orders returned status: ${getOrdersRes.status}, body:`, getOrdersBody);
        }

        // Restore permissions
        await fetch(`${baseUrl}/admin/subscriptions/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                ownerId: testOwner.id,
                boutiqueId: testBoutique.id,
                featurePermissions: {
                    canManageOrders: true
                }
            })
        });

        // ----------------------------------------------------
        // TEST 4: EMERGENCY CONTROL: READ ONLY MODE
        // ----------------------------------------------------
        console.log('\n--- TEST 4: EMERGENCY CONTROL: READ ONLY MODE ---');

        // Turn read only mode ON
        await fetch(`${baseUrl}/admin/subscriptions/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                ownerId: testOwner.id,
                boutiqueId: testBoutique.id,
                readOnlyMode: true
            })
        });
        console.log('Read-Only Mode toggled: TRUE');

        // Try GET /orders (should succeed)
        const getOrdersRO = await fetch(`${baseUrl}/orders`, {
            headers: { 'Authorization': `Bearer ${ownerToken}` }
        });
        console.log(`GET /orders under Read-Only status: ${getOrdersRO.status} (expected 200)`);

        // Try POST /orders (should fail)
        const createOrderRO = await fetch(`${baseUrl}/orders`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({
                customerName: 'RO Client',
                customerMobile: '9999988888',
                category: 'Saree',
                pricing: { price: 1000 }
            })
        });
        const createROBody = await createOrderRO.json();
        if (createOrderRO.status === 403 && createROBody.message.includes('Read-Only')) {
            console.log('✅ SUCCESS: POST /orders blocked with 403:', createROBody.message);
        } else {
            console.log(`❌ FAIL: POST /orders returned status: ${createOrderRO.status}, body:`, createROBody);
        }

        // Restore read only mode
        await fetch(`${baseUrl}/admin/subscriptions/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                ownerId: testOwner.id,
                boutiqueId: testBoutique.id,
                readOnlyMode: false
            })
        });

        // ----------------------------------------------------
        // TEST 5: EMERGENCY CONTROL: FREEZE BOUTIQUE
        // ----------------------------------------------------
        console.log('\n--- TEST 5: EMERGENCY CONTROL: FREEZE BOUTIQUE ---');

        // Freeze boutique
        await fetch(`${baseUrl}/admin/subscriptions/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                ownerId: testOwner.id,
                boutiqueId: testBoutique.id,
                isFrozen: true
            })
        });
        console.log('Boutique Frozen status: TRUE');

        // Try booking appointment (should fail)
        const createBookingFz = await fetch(`${baseUrl}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                boutiqueId: testBoutique.id,
                customerName: 'FZ Guest',
                customerMobile: '9999977777',
                bookingDate: '2026-06-10',
                bookingTime: '10:00 AM'
            })
        });
        const createFzBody = await createBookingFz.json();
        if (createBookingFz.status === 403 && createFzBody.message.includes('frozen')) {
            console.log('✅ SUCCESS: Booking scheduler blocked with 403:', createFzBody.message);
        } else {
            console.log(`❌ FAIL: Booking scheduler returned status: ${createBookingFz.status}, body:`, createFzBody);
        }

        // Restore freeze status
        await fetch(`${baseUrl}/admin/subscriptions/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                ownerId: testOwner.id,
                boutiqueId: testBoutique.id,
                isFrozen: false
            })
        });

        // ----------------------------------------------------
        // TEST 6: EMERGENCY CONTROL: SUSPEND BOUTIQUE
        // ----------------------------------------------------
        console.log('\n--- TEST 6: EMERGENCY CONTROL: SUSPEND BOUTIQUE ---');

        // Suspend boutique
        await fetch(`${baseUrl}/admin/subscriptions/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                ownerId: testOwner.id,
                boutiqueId: testBoutique.id,
                isSuspended: true
            })
        });
        console.log('Boutique Suspended status: TRUE');

        // Try GET /orders (should be blocked)
        const getOrdersSusp = await fetch(`${baseUrl}/orders`, {
            headers: { 'Authorization': `Bearer ${ownerToken}` }
        });
        const getSuspBody = await getOrdersSusp.json();
        if (getOrdersSusp.status === 403 && getSuspBody.message.includes('suspended')) {
            console.log('✅ SUCCESS: GET /orders blocked with 403:', getSuspBody.message);
        } else {
            console.log(`❌ FAIL: GET /orders returned status: ${getOrdersSusp.status}, body:`, getSuspBody);
        }

        // Restore suspension
        await fetch(`${baseUrl}/admin/subscriptions/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                ownerId: testOwner.id,
                boutiqueId: testBoutique.id,
                isSuspended: false
            })
        });

        // ----------------------------------------------------
        // TEST 7: EMERGENCY CONTROL: LOCK OWNER LOGIN
        // ----------------------------------------------------
        console.log('\n--- TEST 7: EMERGENCY CONTROL: LOCK OWNER LOGIN ---');

        // Lock login
        await fetch(`${baseUrl}/admin/subscriptions/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                ownerId: testOwner.id,
                boutiqueId: testBoutique.id,
                loginEnabled: false
            })
        });
        console.log('Owner Login Access: FALSE');

        // Try to authenticate as owner (should fail)
        const ownerLoginLock = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: testOwner.username, password: 'Password@123' })
        });
        const loginLockBody = await ownerLoginLock.json();
        if (ownerLoginLock.status === 403 && loginLockBody.message.includes('disabled')) {
            console.log('✅ SUCCESS: Owner login blocked with 403:', loginLockBody.message);
        } else {
            console.log(`❌ FAIL: Owner login returned status: ${ownerLoginLock.status}, body:`, loginLockBody);
        }

        // Restore login enabled
        await fetch(`${baseUrl}/admin/subscriptions/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                ownerId: testOwner.id,
                boutiqueId: testBoutique.id,
                loginEnabled: true
            })
        });

        // ----------------------------------------------------
        // TEST 8: PLAN CHANGES, TRIAL EXTENSIONS, AND FREE ACCESS
        // ----------------------------------------------------
        console.log('\n--- TEST 8: PLAN CHANGES, TRIAL EXTENSIONS, & FREE ACCESS ---');

        // Update plan STARTER -> PRO
        const planChangeRes = await fetch(`${baseUrl}/admin/subscriptions/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                ownerId: testOwner.id,
                boutiqueId: testBoutique.id,
                planName: 'PRO',
                status: 'ACTIVE'
            })
        });
        console.log(`Plan changed to PRO: status=${planChangeRes.status}`);

        // Extend trial +15 Days
        const trialExtRes = await fetch(`${baseUrl}/admin/subscriptions/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                ownerId: testOwner.id,
                boutiqueId: testBoutique.id,
                extendTrialDays: 15
            })
        });
        console.log(`Trial Extended by 15 days: status=${trialExtRes.status}`);

        // Give Free Access 3 Months
        const freeMonthsRes = await fetch(`${baseUrl}/admin/subscriptions/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                ownerId: testOwner.id,
                boutiqueId: testBoutique.id,
                giveFreeAccessMonths: 3
            })
        });
        console.log(`Free access of 3 months granted: status=${freeMonthsRes.status}`);

        // ----------------------------------------------------
        // TEST 9: AUDIT LOGS GENERATION
        // ----------------------------------------------------
        console.log('\n--- TEST 9: AUDIT LOGS GENERATION ---');

        const auditLogs = await prisma.auditLog.findMany({
            where: { entityId: testBoutique.id },
            orderBy: { timestamp: 'desc' }
        });

        console.log(`Retrieved ${auditLogs.length} audit log items for boutique.`);
        const logTypes = auditLogs.map(l => l.actionType);
        console.log('Logged actions list:', logTypes);

        const requiredActions = [
            'PLAN_CHANGED', 'STATUS_CHANGED', 'TRIAL_EXTENDED', 'FREE_ACCESS_GRANTED',
            'FEATURE_PERMISSION_CHANGED', 'OWNER_LOGIN_DISABLED', 'OWNER_LOGIN_ENABLED',
            'READ_ONLY_ENABLED', 'READ_ONLY_DISABLED', 'BOUTIQUE_FROZEN', 'BOUTIQUE_UNFROZEN',
            'BOUTIQUE_SUSPENDED', 'BOUTIQUE_REACTIVATED', 'SUBSCRIPTION_CHANGED'
        ];

        let matchedCount = 0;
        requiredActions.forEach(action => {
            if (logTypes.includes(action)) {
                console.log(`✅ SUCCESS: Action "${action}" was successfully logged.`);
                matchedCount++;
            } else {
                console.log(`⚠️ Warning: Action "${action}" was not logged.`);
            }
        });

        console.log(`Audit log compliance: ${matchedCount} / ${requiredActions.length} actions logged.`);

        // Clean up test data
        console.log('\n--- CLEAN UP ---');
        await prisma.payment.deleteMany({ where: { boutiqueId: testBoutique.id } });
        await prisma.order.deleteMany({ where: { boutiqueId: testBoutique.id } });
        await prisma.booking.deleteMany({ where: { boutiqueId: testBoutique.id } });
        await prisma.boutiqueSubscription.deleteMany({ where: { boutiqueId: testBoutique.id } });
        await prisma.ownerFeaturePermission.deleteMany({ where: { ownerId: testOwner.id } });
        await prisma.auditLog.deleteMany({ where: { entityId: testBoutique.id } });
        await prisma.owner.delete({ where: { id: testOwner.id } });
        await prisma.boutique.delete({ where: { id: testBoutique.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
        console.log('✅ Cleaned up override test records.');

        console.log('\n🌟 ALL SUBSCRIPTION & ACCESS OVERRIDE INTEGRATION TESTS COMPLETED! 🌟');
        process.exit(0);
    } catch (error) {
        console.error('❌ Test suite crashed with error:', error);
        // Try cleanup
        try {
            if (testOwner) {
                await prisma.ownerFeaturePermission.deleteMany({ where: { ownerId: testOwner.id } });
                await prisma.owner.deleteMany({ where: { id: testOwner.id } });
            }
            if (testBoutique) {
                await prisma.boutiqueSubscription.deleteMany({ where: { boutiqueId: testBoutique.id } });
                await prisma.auditLog.deleteMany({ where: { entityId: testBoutique.id } });
                await prisma.boutique.deleteMany({ where: { id: testBoutique.id } });
            }
            if (testUser) {
                await prisma.user.deleteMany({ where: { id: testUser.id } });
            }
        } catch (cleanupErr) {
            console.error('Error during cleanup:', cleanupErr);
        }
        process.exit(1);
    }
}

runTests();
