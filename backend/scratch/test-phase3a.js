const prisma = require('../src/utils/prisma');

async function run() {
  console.log('==================================================');
  console.log('     PHASE 3A INTEGRATION VERIFICATION SUITE      ');
  console.log('==================================================');

  const baseUrl = 'http://localhost:3000';
  let adminToken = null;
  let boutiqueIdDefault = null;
  let boutiqueIdOverride = null;
  let ownerId = null;
  let customerId = null;

  const report = {
    auth: false,
    commissionSettings: false,
    boutiqueCommissionOverride: false,
    commissionGlobalDefaultCalculation: false,
    commissionCategoryOverrideCalculation: false,
    commissionBoutiqueOverrideCalculation: false,
    payoutGenerationAndWalletTransfer: false,
    payoutFailureRollback: false,
    payoutReleaseCompletion: false,
    paymentRefundDecrementWallet: false
  };

  try {
    // Step 1: Admin Auth
    console.log('\nStep 1: Authenticating as Superadmin...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'superadmin', password: 'admin@123' })
    });
    const loginData = await loginRes.json();
    if (loginRes.ok && loginData.token) {
      adminToken = loginData.token;
      report.auth = true;
      console.log('✅ Superadmin Authenticated.');
    } else {
      console.error('❌ Superadmin auth failed:', loginData);
      return;
    }

    const authHeader = { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    // Get or create users & boutiques needed for verification
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length > 0) {
      customerId = users[0].id;
    } else {
      const newUser = await prisma.user.create({
        data: { name: 'Wallet Tester', phone: '9999999999', status: 'ACTIVE' }
      });
      customerId = newUser.id;
    }

    // Get an owner
    const owner = await prisma.owner.findFirst({ where: { role: 'owner' } });
    if (!owner) {
      console.error('❌ Pre-requisite error: No boutique owner found.');
      return;
    }
    ownerId = owner.id;

    // Create two test boutiques
    const testBoutiqueDefault = await prisma.boutique.create({
      data: {
        name: 'Test Boutique Default Rate',
        ownerName: 'Test Owner A',
        mobileNumber: '8888888881',
        email: 'default@boutique.com',
        fullAddress: '123 Default Street',
        city: 'Hyderabad',
        state: 'Telangana',
        commissionRate: 10.00 // Default schema value
      }
    });
    boutiqueIdDefault = testBoutiqueDefault.id;

    const testBoutiqueOverride = await prisma.boutique.create({
      data: {
        name: 'Test Boutique Override Rate',
        ownerName: 'Test Owner B',
        mobileNumber: '8888888882',
        email: 'override@boutique.com',
        fullAddress: '123 Override Street',
        city: 'Hyderabad',
        state: 'Telangana',
        commissionRate: 18.00 // Override rate
      }
    });
    boutiqueIdOverride = testBoutiqueOverride.id;

    console.log(`Created Default Boutique: ID ${boutiqueIdDefault}`);
    console.log(`Created Override Boutique: ID ${boutiqueIdOverride}`);

    // Step 2: Test Commission Settings
    console.log('\nStep 2: Testing Platform Commission Settings API...');
    const setCommissionRes = await fetch(`${baseUrl}/payouts/commission-settings`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({
        globalCommissionRate: 12.00,
        categoryCommissions: {
          Saree: 15.00,
          Lehenga: 20.00
        }
      })
    });
    const setCommissionData = await setCommissionRes.json();
    if (setCommissionRes.ok && setCommissionData.success) {
      const getCommissionRes = await fetch(`${baseUrl}/payouts/commission-settings`, { headers: authHeader });
      const getCommissionData = await getCommissionRes.json();
      if (getCommissionRes.ok && Number(getCommissionData.data.globalCommissionRate) === 12.00 && getCommissionData.data.categoryCommissions.Saree === 15.00) {
        report.commissionSettings = true;
        console.log('✅ Commission Settings APIs updated & verified.');
      }
    } else {
      console.error('❌ Commission setting update failed:', setCommissionData);
    }

    // Step 3: Test Boutique Commission Override API
    console.log('\nStep 3: Setting Boutique specific Commission Override...');
    const setBoutiqueCommissionRes = await fetch(`${baseUrl}/payouts/boutiques/${boutiqueIdOverride}/commission`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({ commissionRate: 18.00 })
    });
    const setBoutiqueCommissionData = await setBoutiqueCommissionRes.json();
    if (setBoutiqueCommissionRes.ok && Number(setBoutiqueCommissionData.data.commissionRate) === 18.00) {
      report.boutiqueCommissionOverride = true;
      console.log('✅ Boutique-specific commission rate set.');
    } else {
      console.error('❌ Boutique commission rate set failed:', setBoutiqueCommissionData);
    }

    // Prepare mock Orders for verification
    const orderGlobal = await prisma.order.create({
      data: {
        orderId: 'ORD-TEST-GLOBAL',
        boutiqueId: boutiqueIdDefault,
        ownerId,
        customerName: 'Wallet Tester',
        customerPhone: '9999999999',
        price: 1000.00,
        category: 'Blouse' // has no category override
      }
    });

    const orderCategory = await prisma.order.create({
      data: {
        orderId: 'ORD-TEST-CATEGORY',
        boutiqueId: boutiqueIdDefault,
        ownerId,
        customerName: 'Wallet Tester',
        customerPhone: '9999999999',
        price: 1000.00,
        category: 'Saree' // Saree override is 15.00
      }
    });

    const orderBoutique = await prisma.order.create({
      data: {
        orderId: 'ORD-TEST-BOUTIQUE',
        boutiqueId: boutiqueIdOverride,
        ownerId,
        customerName: 'Wallet Tester',
        customerPhone: '9999999999',
        price: 1000.00,
        category: 'Lehenga' // Lehenga category override is 20.00, but boutique override is 18.00
      }
    });

    // Create Payments
    const payGlobal = await prisma.payment.create({
      data: {
        orderId: orderGlobal.id,
        boutiqueId: boutiqueIdDefault,
        customerId,
        amount: 1000.00,
        razorpay_order_id: 'rzp_order_global_test',
        status: 'pending'
      }
    });

    const payCategory = await prisma.payment.create({
      data: {
        orderId: orderCategory.id,
        boutiqueId: boutiqueIdDefault,
        customerId,
        amount: 1000.00,
        razorpay_order_id: 'rzp_order_category_test',
        status: 'pending'
      }
    });

    const payBoutique = await prisma.payment.create({
      data: {
        orderId: orderBoutique.id,
        boutiqueId: boutiqueIdOverride,
        customerId,
        amount: 1000.00,
        razorpay_order_id: 'rzp_order_boutique_test',
        status: 'pending'
      }
    });

    // Step 4: Verify Global Commission (12% of 1000 = 120 commission, 880 netAmount)
    console.log('\nStep 4: Verifying Global Default Commission capture...');
    const verifyGlobalRes = await fetch(`${baseUrl}/payments/verify`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        razorpay_order_id: 'rzp_order_global_test',
        razorpay_payment_id: 'pay_global_123',
        razorpay_signature: cryptoSignature('rzp_order_global_test', 'pay_global_123'),
        orderId: orderGlobal.id
      })
    });
    if (verifyGlobalRes.ok) {
      const payRecord = await prisma.payment.findUnique({ where: { id: payGlobal.id } });
      const btRecord = await prisma.boutique.findUnique({ where: { id: boutiqueIdDefault } });
      console.log(`Global payRecord net: ${payRecord.netAmount} | commission: ${payRecord.commissionAmount}`);
      console.log(`Boutique wallet: ${btRecord.walletBalance}`);
      if (Number(payRecord.commissionAmount) === 120.00 && Number(payRecord.netAmount) === 880.00 && Number(btRecord.walletBalance) === 880.00) {
        report.commissionGlobalDefaultCalculation = true;
        console.log('✅ Global default commission rate applied and wallet incremented correctly.');
      }
    }

    // Step 5: Verify Category Override Commission (15% of 1000 = 150 commission, 850 netAmount)
    console.log('\nStep 5: Verifying Category Commission Override capture...');
    const verifyCategoryRes = await fetch(`${baseUrl}/payments/verify`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        razorpay_order_id: 'rzp_order_category_test',
        razorpay_payment_id: 'pay_category_123',
        razorpay_signature: cryptoSignature('rzp_order_category_test', 'pay_category_123'),
        orderId: orderCategory.id
      })
    });
    if (verifyCategoryRes.ok) {
      const payRecord = await prisma.payment.findUnique({ where: { id: payCategory.id } });
      const btRecord = await prisma.boutique.findUnique({ where: { id: boutiqueIdDefault } });
      console.log(`Category payRecord net: ${payRecord.netAmount} | commission: ${payRecord.commissionAmount}`);
      console.log(`Boutique wallet: ${btRecord.walletBalance}`);
      if (Number(payRecord.commissionAmount) === 150.00 && Number(payRecord.netAmount) === 850.00 && Number(btRecord.walletBalance) === 1730.00) { // 880 + 850 = 1730
        report.commissionCategoryOverrideCalculation = true;
        console.log('✅ Category commission override rate applied and wallet incremented correctly.');
      }
    }

    // Step 6: Verify Boutique Override Priority (Boutique 18% override > Category 20% override of Lehenga)
    console.log('\nStep 6: Verifying Boutique Commission Override priority capture...');
    const verifyBoutiqueRes = await fetch(`${baseUrl}/payments/verify`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        razorpay_order_id: 'rzp_order_boutique_test',
        razorpay_payment_id: 'pay_boutique_123',
        razorpay_signature: cryptoSignature('rzp_order_boutique_test', 'pay_boutique_123'),
        orderId: orderBoutique.id
      })
    });
    if (verifyBoutiqueRes.ok) {
      const payRecord = await prisma.payment.findUnique({ where: { id: payBoutique.id } });
      const btRecord = await prisma.boutique.findUnique({ where: { id: boutiqueIdOverride } });
      console.log(`Boutique payRecord net: ${payRecord.netAmount} | commission: ${payRecord.commissionAmount}`);
      console.log(`Boutique wallet: ${btRecord.walletBalance}`);
      if (Number(payRecord.commissionAmount) === 180.00 && Number(payRecord.netAmount) === 820.00 && Number(btRecord.walletBalance) === 820.00) {
        report.commissionBoutiqueOverrideCalculation = true;
        console.log('✅ Boutique override takes priority over category override, wallet updated.');
      }
    }

    // Step 7: Generate Payout & Wallet Balance Transfer (Transfer 500 from Wallet to Pending Payout)
    console.log('\nStep 7: Generating Pending Payout...');
    const genPayoutRes = await fetch(`${baseUrl}/payouts/admin/generate`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        boutiqueId: boutiqueIdOverride,
        amount: 500.00
      })
    });
    const genPayoutData = await genPayoutRes.json();
    let testPayoutId = null;
    if (genPayoutRes.ok && genPayoutData.success) {
      testPayoutId = genPayoutData.data.id;
      const btRecord = await prisma.boutique.findUnique({ where: { id: boutiqueIdOverride } });
      const payRecord = await prisma.payment.findUnique({ where: { id: payBoutique.id } });
      console.log(`Boutique wallet balance: ${btRecord.walletBalance} | pending payout: ${btRecord.pendingPayout}`);
      console.log(`Payment payout status: ${payRecord.payoutStatus}`);
      if (Number(btRecord.walletBalance) === 320.00 && Number(btRecord.pendingPayout) === 500.00 && payRecord.payoutStatus === 'scheduled') {
        report.payoutGenerationAndWalletTransfer = true;
        console.log('✅ Payout generated. Wallet balances transferred and payments scheduled.');
      }
    } else {
      console.error('❌ Payout generation failed:', genPayoutData);
    }

    // Step 8: Transition Payout Status to FAILED (Rollback wallet)
    console.log('\nStep 8: Testing Payout failure rollback...');
    const failPayoutRes = await fetch(`${baseUrl}/payouts/admin/${testPayoutId}/status`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({
        status: 'FAILED',
        note: 'Bank account connection issues'
      })
    });
    const failPayoutData = await failPayoutRes.json();
    if (failPayoutRes.ok && failPayoutData.success) {
      const btRecord = await prisma.boutique.findUnique({ where: { id: boutiqueIdOverride } });
      const payRecord = await prisma.payment.findUnique({ where: { id: payBoutique.id } });
      console.log(`Boutique wallet balance: ${btRecord.walletBalance} | pending payout: ${btRecord.pendingPayout}`);
      console.log(`Payment payout status: ${payRecord.payoutStatus}`);
      if (Number(btRecord.walletBalance) === 820.00 && Number(btRecord.pendingPayout) === 0.00 && payRecord.payoutStatus === 'pending') {
        report.payoutFailureRollback = true;
        console.log('✅ Payout failed successfully. Balances rolled back.');
      }
    } else {
      console.error('❌ Failed payout transition failed:', failPayoutData);
    }

    // Step 9: Re-generate and transition payout to RELEASED
    console.log('\nStep 9: Regenerating and releasing payout...');
    const genPayout2Res = await fetch(`${baseUrl}/payouts/admin/generate`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        boutiqueId: boutiqueIdOverride,
        amount: 500.00
      })
    });
    const genPayout2Data = await genPayout2Res.json();
    if (genPayout2Res.ok && genPayout2Data.success) {
      const pId = genPayout2Data.data.id;
      const releaseRes = await fetch(`${baseUrl}/payouts/admin/${pId}/status`, {
        method: 'PUT',
        headers: authHeader,
        body: JSON.stringify({
          status: 'RELEASED',
          referenceCode: 'TXN-REF-123456'
        })
      });
      const releaseData = await releaseRes.json();
      if (releaseRes.ok && releaseData.success) {
        const btRecord = await prisma.boutique.findUnique({ where: { id: boutiqueIdOverride } });
        const payRecord = await prisma.payment.findUnique({ where: { id: payBoutique.id } });
        console.log(`Boutique wallet: balance ${btRecord.walletBalance} | pending ${btRecord.pendingPayout} | paidout ${btRecord.totalPaidOut}`);
        console.log(`Payment payout status: ${payRecord.payoutStatus}`);
        if (Number(btRecord.walletBalance) === 320.00 && Number(btRecord.pendingPayout) === 0.00 && Number(btRecord.totalPaidOut) === 500.00 && payRecord.payoutStatus === 'completed') {
          report.payoutReleaseCompletion = true;
          console.log('✅ Payout released successfully. Paidout tracking recorded.');
        }
      } else {
        console.error('❌ Payout release failed:', releaseData);
      }
    }

    // Step 10: Refund Payment (Deduct from wallet balance)
    console.log('\nStep 10: Refunding captured payment...');
    const refundRes = await fetch(`${baseUrl}/payments/refund`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        paymentId: payGlobal.id,
        amount: 1000.00,
        reason: 'Customer cancelled design request'
      })
    });
    const refundData = await refundRes.json();
    if (refundRes.ok && refundData.payment.status === 'refunded') {
      const btRecord = await prisma.boutique.findUnique({ where: { id: boutiqueIdDefault } });
      console.log(`Boutique wallet balance after refund: ${btRecord.walletBalance}`);
      if (Number(btRecord.walletBalance) === 850.00) { // 1730 - 880 = 850
        report.paymentRefundDecrementWallet = true;
        console.log('✅ Payment refunded. Boutique wallet decremented by the netAmount.');
      }
    } else {
      console.error('❌ Refund failed:', refundData);
    }

    // Cleanup mock data
    console.log('\nCleaning up verification records...');
    await prisma.payment.deleteMany({ where: { id: { in: [payGlobal.id, payCategory.id, payBoutique.id] } } });
    await prisma.payout.deleteMany({ where: { boutiqueId: { in: [boutiqueIdDefault, boutiqueIdOverride] } } });
    await prisma.order.deleteMany({ where: { orderId: { in: ['ORD-TEST-GLOBAL', 'ORD-TEST-CATEGORY', 'ORD-TEST-BOUTIQUE'] } } });
    await prisma.boutique.deleteMany({ where: { id: { in: [boutiqueIdDefault, boutiqueIdOverride] } } });
    console.log('✅ Cleanup completed.');

    console.log('\n==================================================');
    console.log('           VERIFICATION RUN COMPLETE              ');
    console.log('==================================================');
    console.log(JSON.stringify(report, null, 2));

  } catch (err) {
    console.error('Suite crashed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

function cryptoSignature(orderId, paymentId) {
  const sign = orderId + "|" + paymentId;
  return require('crypto')
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
    .update(sign.toString())
    .digest("hex");
}

run();
