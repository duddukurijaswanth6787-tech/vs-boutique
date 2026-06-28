const prisma = require('../src/utils/prisma');

async function run() {
    console.log('--------------------------------------------------');
    console.log('       CUSTOMER MANAGEMENT VERIFICATION TEST      ');
    console.log('--------------------------------------------------');

    const baseUrl = 'http://localhost:3000';
    let adminToken = null;
    let testUserId = null;
    let testAddressId = null;

    const report = {
        login: false,
        listCustomers: false,
        getCustomerProfile: false,
        addAddress: false,
        listAddresses: false,
        updateAddress: false,
        deleteAddress: false,
        exportData: false,
        blockCustomer: false,
        unblockCustomer: false,
        segmentationStats: false,
        segmentationCounts: null
    };

    try {
        // 1. Superadmin Login
        console.log('Step 1: Authenticating as Superadmin...');
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'superadmin', password: 'admin@123' })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData.token) {
            adminToken = loginData.token;
            report.login = true;
            console.log('✅ Superadmin Authenticated.');
        } else {
            console.error('❌ Authentication failed:', loginData);
            return;
        }

        const authHeader = { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

        // 2. List Customers
        console.log('\nStep 2: Listing customers...');
        const listRes = await fetch(`${baseUrl}/admin/customers`, { headers: authHeader });
        const listData = await listRes.json();
        if (listRes.ok && listData.data) {
            report.listCustomers = true;
            console.log(`✅ Customers List retrieved. Count: ${listData.data.length}`);
            if (listData.data.length > 0) {
                testUserId = listData.data[0].id;
                console.log(`Target customer ID selected: ${testUserId}`);
            }
        } else {
            console.error('❌ Listing customers failed:', listData);
        }

        // If no user exists, let's create a quick user to test
        if (!testUserId) {
            console.log('\nStep 2b: Creating a test user profile...');
            const newUser = await prisma.user.create({
                data: {
                    phone: '9876543210',
                    name: 'Test Customer',
                    status: 'ACTIVE',
                    segment: 'NEW'
                }
            });
            testUserId = newUser.id;
            console.log(`✅ Test User created. ID: ${testUserId}`);
        }

        // 3. Get Customer Profile Details
        console.log('\nStep 3: Fetching customer profile details...');
        const profileRes = await fetch(`${baseUrl}/admin/customers/${testUserId}`, { headers: authHeader });
        const profileData = await profileRes.json();
        if (profileRes.ok && profileData.data) {
            report.getCustomerProfile = true;
            console.log('✅ Customer profile retrieved successfully.');
            console.log(`Segment: ${profileData.data.segment} | Spend: ₹${profileData.data.stats.totalSpent} | Orders: ${profileData.data.stats.ordersCount}`);
        } else {
            console.error('❌ Fetching profile failed:', profileData);
        }

        // 4. Add Customer Address
        console.log('\nStep 4: Adding customer address...');
        const addAddressRes = await fetch(`${baseUrl}/admin/customers/${testUserId}/addresses`, {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify({
                addressLine1: 'Flat 402, Royal Residency',
                addressLine2: 'Jubilee Hills',
                city: 'Hyderabad',
                state: 'Telangana',
                pincode: '500033',
                isDefault: true
            })
        });
        const addAddressData = await addAddressRes.json();
        if (addAddressRes.ok && addAddressData.data) {
            report.addAddress = true;
            testAddressId = addAddressData.data.id;
            console.log(`✅ Customer Address added. ID: ${testAddressId}`);
        } else {
            console.error('❌ Adding address failed:', addAddressData);
        }

        // 5. List Customer Addresses
        console.log('\nStep 5: Listing customer addresses...');
        const listAddressRes = await fetch(`${baseUrl}/admin/customers/${testUserId}/addresses`, { headers: authHeader });
        const listAddressData = await listAddressRes.json();
        if (listAddressRes.ok && listAddressData.data) {
            report.listAddresses = true;
            console.log(`✅ Customer Addresses retrieved. Count: ${listAddressData.data.length}`);
        } else {
            console.error('❌ Listing addresses failed:', listAddressData);
        }

        // 6. Update Customer Address
        console.log('\nStep 6: Updating customer address...');
        const updateAddressRes = await fetch(`${baseUrl}/admin/customers/${testUserId}/addresses/${testAddressId}`, {
            method: 'PUT',
            headers: authHeader,
            body: JSON.stringify({
                addressLine2: 'Road No 36, Jubilee Hills',
                isDefault: true
            })
        });
        const updateAddressData = await updateAddressRes.json();
        if (updateAddressRes.ok && updateAddressData.data) {
            report.updateAddress = true;
            console.log('✅ Customer Address updated successfully.');
        } else {
            console.error('❌ Updating address failed:', updateAddressData);
        }

        // 7. Export Customer Data
        console.log('\nStep 7: Requesting customer data export...');
        const exportRes = await fetch(`${baseUrl}/admin/customers/${testUserId}/export`, { headers: authHeader });
        const exportData = await exportRes.json();
        if (exportRes.ok && exportData.profile) {
            report.exportData = true;
            console.log('✅ Customer data exported successfully.');
            console.log(`Export payload keys: [${Object.keys(exportData).join(', ')}]`);
        } else {
            console.error('❌ Exporting customer data failed:', exportData);
        }

        // 8. Block Customer Account
        console.log('\nStep 8: Blocking customer...');
        const blockRes = await fetch(`${baseUrl}/admin/customers/${testUserId}/status`, {
            method: 'PUT',
            headers: authHeader,
            body: JSON.stringify({ status: 'BLOCKED', reason: 'Spamming payment requests' })
        });
        const blockData = await blockRes.json();
        if (blockRes.ok) {
            report.blockCustomer = true;
            console.log('✅ Customer blocked successfully.');
        } else {
            console.error('❌ Blocking customer failed:', blockData);
        }

        // Verify blocked user profile shows BLOCKED segment
        const verifyBlockRes = await fetch(`${baseUrl}/admin/customers/${testUserId}`, { headers: authHeader });
        const verifyBlockData = await verifyBlockRes.json();
        console.log(`Verify block: status is ${verifyBlockData.data.status}, segment is ${verifyBlockData.data.segment}`);

        // 9. Unblock Customer Account
        console.log('\nStep 9: Unblocking customer...');
        const unblockRes = await fetch(`${baseUrl}/admin/customers/${testUserId}/status`, {
            method: 'PUT',
            headers: authHeader,
            body: JSON.stringify({ status: 'ACTIVE', reason: 'Verified profile' })
        });
        const unblockData = await unblockRes.json();
        if (unblockRes.ok) {
            report.unblockCustomer = true;
            console.log('✅ Customer unblocked successfully.');
        } else {
            console.error('❌ Unblocking customer failed:', unblockData);
        }

        // 10. Delete Customer Address (Cleanup)
        console.log('\nStep 10: Cleaning up address records...');
        const deleteAddressRes = await fetch(`${baseUrl}/admin/customers/${testUserId}/addresses/${testAddressId}`, {
            method: 'DELETE',
            headers: authHeader
        });
        if (deleteAddressRes.ok) {
            report.deleteAddress = true;
            console.log('✅ Address records cleaned successfully.');
        } else {
            console.error('❌ Deleting address failed.');
        }

        // 11. Retrieve Segmentation Stats on Dashboard
        console.log('\nStep 11: Retrieving dashboard segmentation metrics...');
        const statsRes = await fetch(`${baseUrl}/dashboard/stats`, { headers: authHeader });
        const statsData = await statsRes.json();
        if (statsRes.ok && statsData.customerSegmentation) {
            report.segmentationStats = true;
            report.segmentationCounts = statsData.customerSegmentation;
            console.log('✅ Dashboard segmentation metrics parsed:', statsData.customerSegmentation);
        } else {
            console.error('❌ Fetching dashboard statistics failed:', statsData);
        }

        console.log('\n==================================================');
        console.log('           VERIFICATION RUN COMPLETE              ');
        console.log('==================================================');
        console.log(JSON.stringify(report, null, 2));

    } catch (e) {
        console.error('Test runner crashed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
