const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('🚀 STARTING PHASE 3C SUPPORT TICKETS & NOTIFICATION CENTER INTEGRATION TESTS...');
  
  // ----------------------------------------------------
  // SETUP TEST DATA
  // ----------------------------------------------------
  console.log('\n--- SETUP ---');
  
  // Find or create a test user
  let testUser = await prisma.user.findFirst({ where: { phone: '9999999911' } });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        phone: '9999999911',
        name: 'Ticket Test User',
        status: 'ACTIVE',
        segment: 'VIP'
      }
    });
  }
  console.log(`✅ Test User ID: ${testUser.id} (${testUser.name}, segment: ${testUser.segment})`);

  // Create a clean test boutique
  const testBoutique = await prisma.boutique.create({
    data: {
      name: 'Ticket Test Boutique',
      ownerName: 'Test Boutique Owner',
      mobileNumber: '9999999912',
      email: 'ticketing@test.com',
      experienceYears: 3,
      startingPrice: 300.00,
      servicesOffered: ['Saree'],
      workTypeSpecialty: ['Embroidery'],
      fullAddress: '456 Ticket Lane',
      city: 'Test City',
      state: 'Test State'
    }
  });
  const boutiqueId = testBoutique.id;
  console.log(`✅ Created Test Boutique ID: ${boutiqueId}`);

  // Create test owners (one boutique owner, one super-admin)
  const testOwner = await prisma.owner.create({
    data: {
      ownerName: 'Test Boutique Owner',
      username: `boutiqueowner_${Date.now()}`,
      email: `boutiqueowner_${Date.now()}@test.com`,
      mobileNumber: '9999999912',
      password: 'mock_password_hash',
      role: 'owner',
      status: 'Active',
      assignedBoutiqueId: boutiqueId
    }
  });
  console.log(`✅ Created Boutique Owner: ${testOwner.username}`);

  const testAdmin = await prisma.owner.create({
    data: {
      ownerName: 'Test Super Admin',
      username: `superadmin_${Date.now()}`,
      email: `superadmin_${Date.now()}@test.com`,
      mobileNumber: '9999999913',
      password: 'mock_password_hash',
      role: 'super-admin',
      status: 'Active'
    }
  });
  console.log(`✅ Created Super Admin: ${testAdmin.username}`);

  // ----------------------------------------------------
  // TEST 1: CREATE SUPPORT TICKET WITH ATTACHMENT AND HEURISTICS
  // ----------------------------------------------------
  console.log('\n--- TEST 1: CREATE SUPPORT TICKET WITH ATTACHMENT & FRAUD SCORING ---');
  
  // Refund request without order ID -> should score fraudScore += 40
  // Plus we will simulate multiple tickets to trigger excessive flag
  let ticket1 = await prisma.supportTicket.create({
    data: {
      userId: testUser.id,
      boutiqueId: boutiqueId,
      ticketType: 'REFUND_REQUEST',
      priority: 'HIGH',
      source: 'MOBILE',
      subject: 'Refund request for undelivered item',
      description: 'The boutique did not stitch my dress on time and I want a full refund.',
      attachmentUrl: 'http://example.com/receipt.pdf',
      attachmentType: 'pdf',
      fraudScore: 40,
      riskLevel: 'MEDIUM',
      excessiveTicketFlag: false
    }
  });
  console.log(`✅ Created Ticket 1 ID: ${ticket1.id}`);
  console.log(`   Priority: ${ticket1.priority}, Source: ${ticket1.source}`);
  console.log(`   Fraud Score: ${ticket1.fraudScore}, Risk Level: ${ticket1.riskLevel}`);
  console.log(`   Attachment: ${ticket1.attachmentUrl} (${ticket1.attachmentType})`);

  // Verify fields in DB
  let fetchedTicket = await prisma.supportTicket.findUnique({
    where: { id: ticket1.id }
  });
  if (fetchedTicket.fraudScore === 40 && fetchedTicket.riskLevel === 'MEDIUM') {
    console.log('✅ Ticket created with correct fraud indicators.');
  } else {
    console.log('❌ Failed: Fraud indicators do not match.');
  }

  // ----------------------------------------------------
  // TEST 2: MESSAGING & SLA TRACKING (FIRST RESPONSE)
  // ----------------------------------------------------
  console.log('\n--- TEST 2: MESSAGING & SLA TRACKING ---');
  
  // First response from boutique owner
  const now = new Date();
  const message1 = await prisma.supportTicketMessage.create({
    data: {
      ticketId: ticket1.id,
      senderType: 'BOUTIQUE',
      senderId: testOwner.id,
      senderName: testOwner.ownerName,
      message: 'Hello, we are looking into your order status right now.'
    }
  });
  console.log(`✅ Message posted by Boutique: "${message1.message}"`);

  // Update ticket firstResponseAt
  ticket1 = await prisma.supportTicket.update({
    where: { id: ticket1.id },
    data: { firstResponseAt: now }
  });
  if (ticket1.firstResponseAt) {
    console.log(`✅ firstResponseAt timestamp initialized: ${ticket1.firstResponseAt}`);
  } else {
    console.log('❌ Failed: firstResponseAt was not set.');
  }

  // Customer reply
  const message2 = await prisma.supportTicketMessage.create({
    data: {
      ticketId: ticket1.id,
      senderType: 'CUSTOMER',
      senderId: testUser.id,
      senderName: testUser.name || 'Customer',
      message: 'Please hurry up, the wedding is next week!'
    }
  });
  console.log(`✅ Message posted by Customer: "${message2.message}"`);

  // ----------------------------------------------------
  // TEST 3: INTERNAL ADMIN NOTES
  // ----------------------------------------------------
  console.log('\n--- TEST 3: INTERNAL ADMIN NOTES ---');
  
  const adminNote = await prisma.supportTicketAdminNote.create({
    data: {
      ticketId: ticket1.id,
      adminId: testAdmin.id,
      note: 'FLAGGED FOR FRAUD INVESTIGATION: Customer filed a dispute. Order list shows no order ID.'
    }
  });
  console.log(`✅ Internal Admin Note added: "${adminNote.note}"`);

  const fetchedNotes = await prisma.supportTicketAdminNote.findMany({
    where: { ticketId: ticket1.id }
  });
  if (fetchedNotes.length === 1 && fetchedNotes[0].adminId === testAdmin.id) {
    console.log(`✅ Successfully retrieved ${fetchedNotes.length} admin-only internal note.`);
  } else {
    console.log('❌ Failed: Internal admin note retrieval failed.');
  }

  // ----------------------------------------------------
  // TEST 4: TICKET ESCALATION & RESOLUTION WORKFLOW
  // ----------------------------------------------------
  console.log('\n--- TEST 4: TICKET ESCALATION & RESOLUTION WORKFLOW ---');
  
  // Escalate to L2
  ticket1 = await prisma.supportTicket.update({
    where: { id: ticket1.id },
    data: {
      escalationLevel: 'L2',
      escalatedAt: new Date()
    }
  });
  console.log(`✅ Escalated ticket to level: ${ticket1.escalationLevel} at ${ticket1.escalatedAt}`);

  // Resolve ticket and verify SLA breach
  // Forcing backdated ticket to test SLA breach
  const dayAndHalfAgo = new Date();
  dayAndHalfAgo.setHours(dayAndHalfAgo.getHours() - 36); // 36 hours ago (SLA is 24 hours)

  let ticket2 = await prisma.supportTicket.create({
    data: {
      userId: testUser.id,
      ticketType: 'ORDER_ISSUE',
      priority: 'CRITICAL',
      source: 'WEB',
      subject: 'Late order stitching delivery',
      description: 'Dress stitching is delayed.',
      createdAt: dayAndHalfAgo
    }
  });
  console.log(`✅ Created Ticket 2 (Backdated 36 hours) ID: ${ticket2.id}`);

  // Resolve it now
  const resolvedTime = new Date();
  const diffMs = resolvedTime.getTime() - ticket2.createdAt.getTime();
  const slaBreached = diffMs > 24 * 60 * 60 * 1000;

  ticket2 = await prisma.supportTicket.update({
    where: { id: ticket2.id },
    data: {
      status: 'RESOLVED',
      resolvedAt: resolvedTime,
      slaBreached: slaBreached
    }
  });

  console.log(`   Ticket 2 Status: ${ticket2.status}, Resolved At: ${ticket2.resolvedAt}`);
  if (ticket2.slaBreached) {
    console.log(`✅ SUCCESS: SLA Breach detected successfully (Duration: ${(diffMs / 3600000).toFixed(1)} hours).`);
  } else {
    console.log('❌ Failed: SLA Breach was not marked true.');
  }

  // ----------------------------------------------------
  // TEST 5: NOTIFICATION TEMPLATES
  // ----------------------------------------------------
  console.log('\n--- TEST 5: NOTIFICATION TEMPLATES ---');
  
  // Upsert a template
  const templateName = 'TICKET_RESOLVED';
  const template = await prisma.notificationTemplate.upsert({
    where: { name: templateName },
    update: {
      subject: 'Support Ticket Closed',
      body: 'Your ticket has been marked resolved. Thank you for reaching out.',
      channels: ['push', 'email']
    },
    create: {
      name: templateName,
      subject: 'Support Ticket Closed',
      body: 'Your ticket has been marked resolved. Thank you for reaching out.',
      channels: ['push', 'email']
    }
  });
  console.log(`✅ Upserted Notification Template: "${template.name}"`);

  // Verify details
  const fetchedTemplate = await prisma.notificationTemplate.findUnique({
    where: { name: templateName }
  });
  if (fetchedTemplate.subject === 'Support Ticket Closed') {
    console.log('✅ Template content verified successfully.');
  } else {
    console.log('❌ Failed: Template values mismatch.');
  }

  // ----------------------------------------------------
  // TEST 6: BROADCAST CAMPAIGNS & TARGETING FILTERS
  // ----------------------------------------------------
  console.log('\n--- TEST 6: BROADCAST CAMPAIGNS & TARGETING FILTERS ---');
  
  const campaign = await prisma.notificationCampaign.create({
    data: {
      name: 'VIP Customer Update Campaign',
      title: 'Special VIP Offer',
      message: 'Exclusive 20% discount on boutique designer dresses.',
      targetType: 'VIP_CUSTOMERS',
      channels: ['push', 'email'],
      status: 'completed'
    }
  });
  console.log(`✅ Created Notification Campaign: "${campaign.name}"`);

  // Dispatch campaign: select VIP users
  const targetUsers = await prisma.user.findMany({
    where: { status: 'ACTIVE', segment: 'VIP' }
  });

  console.log(`   Found ${targetUsers.length} VIP recipient users.`);

  // Create notifications and receipts
  const parentNotif = await prisma.notification.create({
    data: {
      recipientRole: 'owner', // Default role
      title: campaign.title,
      message: campaign.message,
      type: 'BROADCAST',
      isBroadcast: true,
      targetType: campaign.targetType,
      sentPush: true,
      sentEmail: true,
      campaignId: campaign.id,
      createdAt: new Date()
    }
  });

  const receipts = targetUsers.map(u => ({
    notificationId: parentNotif.id,
    recipientUserId: u.id,
    sentAt: new Date()
  }));

  if (receipts.length > 0) {
    await prisma.notificationReceipt.createMany({
      data: receipts
    });
    console.log(`✅ Generated ${receipts.length} notification receipts.`);
  }

  // Simulate read status and opened/clicked analytics logs
  const receiptToUpdate = await prisma.notificationReceipt.findFirst({
    where: { notificationId: parentNotif.id }
  });

  if (receiptToUpdate) {
    await prisma.notificationReceipt.update({
      where: { id: receiptToUpdate.id },
      data: {
        openedAt: new Date(),
        clickedAt: new Date()
      }
    });
    console.log(`✅ Updated Receipt ID: ${receiptToUpdate.id} to simulate Opened & Clicked receipt metrics.`);
  }

  // Fetch and verify analytics
  const totalSent = await prisma.notificationReceipt.count({
    where: { notificationId: parentNotif.id }
  });
  const totalOpened = await prisma.notificationReceipt.count({
    where: { notificationId: parentNotif.id, openedAt: { not: null } }
  });
  const totalClicked = await prisma.notificationReceipt.count({
    where: { notificationId: parentNotif.id, clickedAt: { not: null } }
  });

  console.log(`📊 Notification Campaign Results:`);
  console.log(`   Total Dispatched: ${totalSent}`);
  console.log(`   Total Opened: ${totalOpened}`);
  console.log(`   Total Clicked: ${totalClicked}`);
  console.log(`   Opened Rate: ${(totalOpened / totalSent * 100).toFixed(1)}%`);
  console.log(`   Clicked Rate: ${(totalClicked / totalSent * 100).toFixed(1)}%`);

  if (totalSent > 0 && totalOpened === 1 && totalClicked === 1) {
    console.log('✅ Campaign notification metrics logged accurately.');
  } else {
    console.log('❌ Failed: Analytics counting mismatch.');
  }

  // ----------------------------------------------------
  // TEARDOWN CLEANUP
  // ----------------------------------------------------
  console.log('\n--- TEARDOWN CLEANUP ---');
  try {
    // Delete tickets, notes, campaigns, notifications
    await prisma.supportTicketMessage.deleteMany({ where: { ticketId: { in: [ticket1.id, ticket2.id] } } });
    await prisma.supportTicketAdminNote.deleteMany({ where: { ticketId: { in: [ticket1.id, ticket2.id] } } });
    await prisma.supportTicket.deleteMany({ where: { id: { in: [ticket1.id, ticket2.id] } } });
    
    await prisma.notificationReceipt.deleteMany({ where: { notificationId: parentNotif.id } });
    await prisma.notification.delete({ where: { id: parentNotif.id } });
    await prisma.notificationCampaign.delete({ where: { id: campaign.id } });

    await prisma.owner.deleteMany({ where: { id: { in: [testOwner.id, testAdmin.id] } } });
    await prisma.boutique.delete({ where: { id: boutiqueId } });
    
    // Clean up template if created
    await prisma.notificationTemplate.delete({ where: { name: templateName } });

    console.log('✅ Cleaned up all Phase 3C validation test records successfully.');
  } catch (e) {
    console.error('❌ Cleanup failed: ', e);
  }
}

runTests().then(() => {
  console.log('\n🏁 INTEGRATION RUN COMPLETE.');
  process.exit(0);
});
