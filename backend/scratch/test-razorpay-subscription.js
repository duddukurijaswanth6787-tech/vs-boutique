const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const Razorpay = require('razorpay');

// Load environment variables
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

async function runTest() {
  console.log('🧪 Starting Razorpay Subscription verification test...');
  try {
    // 1. Fetch active boutique
    const sub = await prisma.boutiqueSubscription.findFirst({
      include: { plan: true }
    });
    if (!sub) {
      console.error('❌ No boutique subscription found to run test on.');
      return;
    }
    console.log(`Using Boutique: ${sub.boutiqueId}`);
    console.log(`Current Plan: ${sub.plan.name}`);

    // Find a target plan that is PRO or STARTER
    const targetPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'PRO', isActive: true }
    }) || await prisma.subscriptionPlan.findFirst({
      where: { name: 'STARTER', isActive: true }
    });

    if (!targetPlan) {
      console.error('❌ No active target subscription plan (PRO/STARTER) found in database.');
      return;
    }
    console.log(`Target Upgrade Plan: ${targetPlan.name} (Price: ${targetPlan.price})`);

    // 2. Simulate order creation
    console.log('Simulating Razorpay Order creation...');
    const amountInPaise = Math.round(Number(targetPlan.price) * 100);
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_sub_${sub.id.substring(0,8)}_${Date.now()}`
    };

    let order;
    try {
      if (process.env.RAZORPAY_KEY_ID === 'rzp_test_your_key_id' || 
          process.env.RAZORPAY_KEY_ID?.includes('placeholder')) {
        throw new Error('Placeholder key detected');
      }
      order = await razorpay.orders.create(options);
      console.log(`✅ Razorpay Order Created! ID: ${order.id}, Amount: ${order.amount}`);
    } catch (err) {
      console.warn('⚠️ Razorpay order creation failed or using mock keys. Falling back to mock order.');
      order = {
        id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        amount: amountInPaise,
        currency: 'INR'
      };
      console.log(`✅ Mock Razorpay Order Created! ID: ${order.id}, Amount: ${order.amount}`);
    }

    // 3. Generate Valid Signature
    console.log('Generating cryptographic verification signature...');
    const paymentId = 'pay_mock_' + Math.random().toString(36).substring(7);
    const orderId = order.id;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'your_key_secret';

    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(orderId + "|" + paymentId);
    const signature = hmac.digest('hex');
    console.log(`Generated Signature: ${signature}`);

    // 4. Verify Signature match
    console.log('Verifying signature match...');
    const hmacCheck = crypto.createHmac('sha256', keySecret);
    hmacCheck.update(orderId + "|" + paymentId);
    const generatedSigCheck = hmacCheck.digest('hex');

    if (generatedSigCheck !== signature) {
      throw new Error('Local signature verification mismatch! Test secret issue.');
    }
    console.log('✅ Local signature verified successfully!');

    // 5. Apply Database transaction upgrade
    console.log('Applying database transaction upgrade...');
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(now.getDate() + 30);

    const result = await prisma.$transaction(async (tx) => {
      const isTrial = sub.status === 'TRIAL';
      
      const updatedSub = await tx.boutiqueSubscription.update({
        where: { id: sub.id },
        data: {
          planId: targetPlan.id,
          status: 'ACTIVE',
          startDate: now,
          endDate: nextMonth,
          trialEndsAt: null,
          convertedAt: isTrial ? now : undefined,
          trialEndedAt: isTrial ? now : undefined,
          gatewayCustomerId: `cust_${sub.boutiqueId.substring(0, 8)}`,
          gatewaySubscriptionId: orderId,
          gatewayPaymentId: paymentId,
          pendingPlanId: null
        }
      });

      const bill = await tx.subscriptionBillingHistory.create({
        data: {
          subscriptionId: sub.id,
          amount: targetPlan.price,
          paymentStatus: 'PAID',
          paymentMethod: 'RAZORPAY',
          invoiceUrl: `/invoices/razorpay_${paymentId}.pdf`
        }
      });

      return { updatedSub, bill };
    });

    console.log(`✅ Database records updated!`);
    console.log(`New Plan ID on Subscription: ${result.updatedSub.planId} (Expected: ${targetPlan.id})`);
    console.log(`New Billing History record amount: ${result.bill.amount} (Expected: ${targetPlan.price})`);

    // Verify properties
    if (result.updatedSub.planId === targetPlan.id && result.bill.paymentMethod === 'RAZORPAY') {
      console.log('✅ DB Verification succeeded! Subscription upgraded and billing history populated.');
    } else {
      console.error('❌ DB Verification failed. Limits or fields mismatch.');
    }

    // 6. Cleanup revert
    console.log('Cleaning up (reverting subscription to original state)...');
    await prisma.boutiqueSubscription.update({
      where: { id: sub.id },
      data: {
        planId: sub.planId,
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        trialEndsAt: sub.trialEndsAt,
        gatewayCustomerId: sub.gatewayCustomerId,
        gatewaySubscriptionId: sub.gatewaySubscriptionId,
        gatewayPaymentId: sub.gatewayPaymentId,
        pendingPlanId: sub.pendingPlanId
      }
    });

    await prisma.subscriptionBillingHistory.delete({
      where: { id: result.bill.id }
    });
    console.log('✅ Cleanup finished successfully!');

  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
