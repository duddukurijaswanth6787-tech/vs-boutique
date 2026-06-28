const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyCustomRequestHistory() {
  console.log('🧪 Starting Custom Plan Request History tests...');
  try {
    // 1. Fetch first boutique & owner
    const boutique = await prisma.boutique.findFirst({
      where: { isDeleted: false }
    });
    if (!boutique) {
      console.error('❌ No active boutique found to run tests.');
      return;
    }
    const owner = await prisma.owner.findFirst({
      where: { assignedBoutiqueId: boutique.id, role: 'owner', isDeleted: false }
    });
    if (!owner) {
      console.error('❌ No active boutique owner found.');
      return;
    }

    console.log(`Boutique: ${boutique.name}`);
    console.log(`Owner: ${owner.ownerName} (${owner.id})`);

    // 2. Create a pending request
    console.log('Creating a custom limit request...');
    const request = await prisma.customPlanRequest.create({
      data: {
        boutiqueId: boutique.id,
        ownerId: owner.id,
        requestedDesigns: 150,
        requestedOrders: 800,
        requestedGallery: 300,
        requestedStaff: 10,
        reason: 'Verification test for request history ledger',
        status: 'PENDING'
      }
    });
    console.log(`✅ Request created: ID: ${request.id}, Status: ${request.status}`);

    // 3. Fetch owner requests history (Simulate GET /subscriptions/owner/requests)
    console.log('Fetching custom plan requests history for owner...');
    const history = await prisma.customPlanRequest.findMany({
      where: { boutiqueId: boutique.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${history.length} custom request entries in history.`);
    const verifiedEntry = history.find(req => req.id === request.id);
    if (verifiedEntry) {
      console.log(`✅ History retrieval works! Verified entry matches created request ID.`);
      console.log(`- Requested Designs: ${verifiedEntry.requestedDesigns} (Expected: 150)`);
      console.log(`- Status: ${verifiedEntry.status} (Expected: PENDING)`);
    } else {
      throw new Error('Created custom request not found in history.');
    }

    // 4. Reject request to test final status update
    console.log('Simulating super admin rejection...');
    const updatedRequest = await prisma.customPlanRequest.update({
      where: { id: request.id },
      data: { status: 'REJECTED' }
    });
    console.log(`✅ Request status updated: ${updatedRequest.status} (Expected: REJECTED)`);

    // Re-fetch and check
    const updatedHistory = await prisma.customPlanRequest.findMany({
      where: { boutiqueId: boutique.id },
      orderBy: { createdAt: 'desc' }
    });
    const rejectedEntry = updatedHistory.find(req => req.id === request.id);
    if (rejectedEntry && rejectedEntry.status === 'REJECTED') {
      console.log('✅ History correctly reflects the REJECTED state!');
    } else {
      throw new Error('Rejection state did not propagate to history.');
    }

    // 5. Cleanup
    console.log('Cleaning up custom request...');
    await prisma.customPlanRequest.delete({
      where: { id: request.id }
    });
    console.log('✅ Custom request history verification tests passed successfully!');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCustomRequestHistory();
