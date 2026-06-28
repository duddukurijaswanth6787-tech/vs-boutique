const prisma = require('../src/utils/prisma');

async function run() {
  console.log('==================================================');
  console.log('     PHASE 2 INTEGRATION VERIFICATION SUITE       ');
  console.log('==================================================');

  const baseUrl = 'http://localhost:3000';
  let adminToken = null;
  let boutiqueId = null;
  let testOrderId = null;
  let testUserId = null;
  let testBookingId = null;
  let testReviewId = null;

  const report = {
    auth: false,
    createBooking: false,
    rescheduleBooking: false,
    approveBooking: false,
    submitReview: false,
    duplicateReviewBlocked: false,
    moderateReview: false,
    recalculateBoutiqueRating: false,
    suspiciousReviewFlagged: false,
    marketplaceInsights: false
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

    // Get a test boutique
    const boutiques = await prisma.boutique.findMany({ where: { isDeleted: false }, take: 1 });
    if (boutiques.length === 0) {
      console.error('❌ Pre-requisite error: No boutique found in database.');
      return;
    }
    boutiqueId = boutiques[0].id;
    console.log(`Using target Boutique: ${boutiques[0].name} (ID: ${boutiqueId})`);

    // Get or create a test customer user
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length > 0) {
      testUserId = users[0].id;
    } else {
      const newUser = await prisma.user.create({
        data: { name: 'Insights Tester', phone: '9000100020', status: 'ACTIVE' }
      });
      testUserId = newUser.id;
    }

    // Cleanup any legacy remnants before test run
    await prisma.review.deleteMany({ where: { comment: 'Absolutely stunning stitching and fittings!' } });
    await prisma.order.deleteMany({ where: { orderId: { in: ['ORD-TEST-INSIGHTS', 'ORD-TEST-SUSPICIOUS'] } } });

    // Create a mock order to test verified purchase and conversion
    const owners = await prisma.owner.findMany({ where: { assignedBoutiqueId: boutiqueId }, take: 1 });
    const ownerId = owners.length > 0 ? owners[0].id : (await prisma.owner.findFirst({ select: { id: true } })).id;

    const mockOrder = await prisma.order.create({
      data: {
        orderId: 'ORD-TEST-INSIGHTS',
        boutiqueId,
        ownerId,
        customerName: 'Insights Tester',
        customerPhone: '9000100020',
        price: 4500.00,
        orderStatus: 'delivered', // delivered status to pass verified purchase check
        paymentStatus: 'captured'
      }
    });
    testOrderId = mockOrder.id;
    console.log(`Created Mock Converted Order: ${mockOrder.orderId} (ID: ${testOrderId})`);

    // Step 2: Create Booking
    console.log('\nStep 2: Scheduling new consultation booking...');
    const bookingRes = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boutiqueId,
        customerName: 'Insights Tester',
        customerMobile: '9000100020',
        bookingDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days later
        bookingTime: '11:00 AM',
        notes: 'Stitching request details discussion',
        bookingType: 'DESIGN_DISCUSSION'
      })
    });
    const bookingData = await bookingRes.json();
    if (bookingRes.ok && bookingData.success) {
      testBookingId = bookingData.data.id;
      report.createBooking = true;
      console.log(`✅ Booking created. ID: ${testBookingId} | Type: ${bookingData.data.bookingType}`);
    } else {
      console.error('❌ Booking creation failed:', bookingData);
    }

    // Step 3: Reschedule Booking
    console.log('\nStep 3: Rescheduling consultation slot...');
    const rescheduleRes = await fetch(`${baseUrl}/bookings/${testBookingId}/reschedule`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({
        bookingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days later
        bookingTime: '03:00 PM',
        note: 'Customer requested afternoon slot'
      })
    });
    const rescheduleData = await rescheduleRes.json();
    if (rescheduleRes.ok && rescheduleData.success) {
      report.rescheduleBooking = true;
      console.log(`✅ Booking rescheduled. New Date: ${rescheduleData.data.bookingDate} | Time: ${rescheduleData.data.bookingTime}`);
    } else {
      console.error('❌ Reschedule failed:', rescheduleData);
    }

    // Step 4: Approve Booking and Link Converted Order
    console.log('\nStep 4: Approving booking and marking complete with converted order...');
    const approveRes = await fetch(`${baseUrl}/bookings/${testBookingId}/status`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({
        status: 'Completed',
        orderId: testOrderId,
        note: 'Design consultation finished and order converted successfully'
      })
    });
    const approveData = await approveRes.json();
    if (approveRes.ok && approveData.success) {
      report.approveBooking = true;
      console.log(`✅ Booking completed. Converted Order ID linked: ${approveData.data.orderId}`);
    } else {
      console.error('❌ Completing booking failed:', approveData);
    }

    // Step 5: Submit Review (Verified Purchase)
    console.log('\nStep 5: Submitting review comments with rating dimensions...');
    const reviewRes = await fetch(`${baseUrl}/reviews`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        boutiqueId,
        userId: testUserId,
        orderId: testOrderId,
        rating: 5,
        ratingStitching: 5,
        ratingMeasurement: 5,
        ratingDelivery: 4,
        ratingCommunication: 5,
        ratingValue: 5,
        comment: 'Absolutely stunning stitching and fittings!',
        reviewImages: ['https://vs-boutique-web-images.s3.amazonaws.com/uploads/reviews/test.webp']
      })
    });
    const reviewData = await reviewRes.json();
    if (reviewRes.ok && reviewData.success) {
      testReviewId = reviewData.data.id;
      report.submitReview = true;
      console.log(`✅ Review submitted. ID: ${testReviewId} | Verified Purchase: ${reviewData.data.verifiedPurchase}`);
    } else {
      console.error('❌ Review submission failed:', reviewData);
    }

    // Step 6: Test Duplicate Review Prevention
    console.log('\nStep 6: Testing duplicate review block rules...');
    const dupRes = await fetch(`${baseUrl}/reviews`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        boutiqueId,
        userId: testUserId,
        orderId: testOrderId,
        rating: 4,
        comment: 'Submitting duplicate review'
      })
    });
    const dupData = await dupRes.json();
    if (!dupRes.ok && dupRes.status === 400) {
      report.duplicateReviewBlocked = true;
      console.log(`✅ Duplicate review blocked successfully. Message: ${dupData.message}`);
    } else {
      console.error('❌ Error: Duplicate review was not blocked!', dupData);
    }

    // Step 7: Moderate Review to APPROVED
    console.log('\nStep 7: Moderating review to APPROVED status...');
    const modRes = await fetch(`${baseUrl}/reviews/${testReviewId}/moderation`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({ moderationStatus: 'APPROVED' })
    });
    const modData = await modRes.json();
    if (modRes.ok && modData.success) {
      report.moderateReview = true;
      console.log(`✅ Review moderation status set to: ${modData.data.moderationStatus}`);
    } else {
      console.error('❌ Review moderation failed:', modData);
    }

    // Step 8: Recalculate Rating Verification
    console.log('\nStep 8: Verifying Boutique Rating recalculations...');
    const verifyBoutique = await prisma.boutique.findUnique({ where: { id: boutiqueId } });
    console.log(`Boutique new Average Rating: ${verifyBoutique.rating} | Review Count: ${verifyBoutique.reviewsCount}`);
    if (verifyBoutique.reviewsCount > 0 && Number(verifyBoutique.rating) > 0) {
      report.recalculateBoutiqueRating = true;
      console.log('✅ Rating aggregation completed successfully.');
    } else {
      console.error('❌ Rating calculation failed.');
    }

    // Step 9: Test Suspicious Review Flagging (IP rate limits)
    console.log('\nStep 9: Testing suspicious review detection...');
    // We submit another review from same IP (already has 2 submissions in last 5 minutes)
    // Create another mock order first to bypass duplicate check
    const mockOrder2 = await prisma.order.create({
      data: {
        orderId: 'ORD-TEST-SUSPICIOUS',
        boutiqueId,
        ownerId,
        customerName: 'Spam Tester',
        customerPhone: '9000100021',
        price: 2000.00
      }
    });

    const suspRes = await fetch(`${baseUrl}/reviews`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        boutiqueId,
        userId: testUserId,
        orderId: mockOrder2.id,
        rating: 1,
        comment: 'Absolutely stunning stitching and fittings!' // duplicates first review comment
      })
    });
    const suspData = await suspRes.json();
    if (suspRes.ok && suspData.data.isSuspicious) {
      report.suspiciousReviewFlagged = true;
      console.log(`✅ Suspicious review flagged. Reason: ${suspData.data.suspiciousReason}`);
      
      // Clean up mock2 order
      await prisma.order.delete({ where: { id: mockOrder2.id } });
      await prisma.review.delete({ where: { id: suspData.data.id } });
    } else {
      console.warn('⚠️ Warning: Suspicious review was not flagged. IP frequency threshold might require additional runs.');
    }

    // Step 10: Retrieve Marketplace Insights
    console.log('\nStep 10: Compiling marketplace leaderboards...');
    const insightsRes = await fetch(`${baseUrl}/admin/marketplace-insights`, { headers: authHeader });
    const insightsData = await insightsRes.json();
    if (insightsRes.ok && insightsData.success) {
      report.marketplaceInsights = true;
      console.log('✅ Marketplace Insights retrieved successfully.');
      console.log(`Metrics: Top Performing Count: ${insightsData.topPerforming.length}`);
      if (insightsData.topPerforming.length > 0) {
        const topB = insightsData.topPerforming[0];
        console.log(`Top Boutique: ${topB.name} | Boutique Score: ${topB.boutiqueScore} | CSAT Score: ${topB.csatScore}`);
      }
    } else {
      console.error('❌ Failed to retrieve marketplace insights:', insightsData);
    }

    // Cleanup mock data
    console.log('\nCleaning up verification records...');
    await prisma.review.delete({ where: { id: testReviewId } });
    await prisma.bookingHistory.deleteMany({ where: { bookingId: testBookingId } });
    await prisma.booking.delete({ where: { id: testBookingId } });
    await prisma.order.delete({ where: { id: testOrderId } });
    // Recalculate boutique rating to clean state
    const resultRating = await prisma.review.aggregate({
      where: { boutiqueId, moderationStatus: 'APPROVED' },
      _avg: { rating: true },
      _count: { id: true }
    });
    await prisma.boutique.update({
      where: { id: boutiqueId },
      data: {
        rating: resultRating._avg.rating || 0.00,
        reviewsCount: resultRating._count.id
      }
    });
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

run();
