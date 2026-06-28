const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log('Starting custom production-grade database seed...');

    try {
        // 1. Fetch existing boutiques & owners
        const boutiques = await prisma.boutique.findMany();
        const owners = await prisma.owner.findMany();
        const designs = await prisma.design.findMany();

        if (boutiques.length === 0 || owners.length === 0 || designs.length === 0) {
            console.log('⚠️ Error: Need at least one boutique, owner, and design in DB before running this seed.');
            console.log('Please run standard prisma seed first.');
            process.exit(1);
        }

        const boutique = boutiques[0];
        const owner = owners.find(o => o.role === 'owner') || owners[0];
        const admin = owners.find(o => o.role === 'super_admin') || owners[0];
        const design = designs[0];

        console.log(`Using Boutique: "${boutique.name}" (${boutique.id})`);
        console.log(`Using Owner: "${owner.ownerName}" (${owner.id})`);
        console.log(`Using Admin: "${admin.ownerName}" (${admin.id})`);
        console.log(`Using Design: "${design.name}" (${design.id})`);

        // 2. Clean up transient transaction data to ensure clean stats
        console.log('Cleaning transient tables...');
        await prisma.wishlist.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.payout.deleteMany({});
        await prisma.review.deleteMany({});
        await prisma.supportTicketMessage.deleteMany({});
        await prisma.supportTicketAdminNote.deleteMany({});
        await prisma.supportTicket.deleteMany({});
        await prisma.bookingHistory.deleteMany({});
        await prisma.booking.deleteMany({});
        await prisma.orderHistory.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.user.deleteMany({});
        console.log('Transient tables cleaned.');

        // 3. Create active users
        console.log('Seeding users...');
        const userNames = [
            'Aranya Sen', 'Bhavya Rao', 'Deepika Padukone', 'Esha Deol', 
            'Gauri Khan', 'Ishita Sharma', 'Kriti Sanon', 'Meera Rajput', 
            'Neha Dhupia', 'Priyanka Chopra', 'Rhea Chakraborty', 'Shraddha Kapoor',
            'Taapsee Pannu', 'Vidya Balan', 'Yami Gautam'
        ];

        const users = [];
        for (let i = 0; i < userNames.length; i++) {
            const user = await prisma.user.create({
                data: {
                    name: userNames[i],
                    phone: `98765432${i.toString().padStart(2, '0')}`,
                    status: 'ACTIVE',
                    segment: i < 3 ? 'VIP' : (i < 8 ? 'ACTIVE' : 'NEW'),
                    createdAt: new Date(Date.now() - i * 2 * 24 * 3600 * 1000) // spread over last 30 days
                }
            });
            users.push(user);
        }
        console.log(`✅ Seeded ${users.length} Users.`);

        // 4. Create orders and payments
        console.log('Seeding orders and payments...');
        const now = new Date();
        
        // Let's create payments today, yesterday, and spread across the last 30 days
        const paymentData = [
            // Today successful (captured)
            { dayOffset: 0, amount: 12000, commission: 1200, status: 'captured', isCompleted: true },
            { dayOffset: 0, amount: 8000, commission: 800, status: 'captured', isCompleted: false },
            { dayOffset: 0, amount: 5000, commission: 500, status: 'captured', isCompleted: true },
            // Today failed
            { dayOffset: 0, amount: 15000, commission: 1500, status: 'failed', isCompleted: false },
            
            // Yesterday successful
            { dayOffset: 1, amount: 10000, commission: 1000, status: 'captured', isCompleted: true },
            { dayOffset: 1, amount: 12000, commission: 1200, status: 'captured', isCompleted: true },
            
            // Monthly trends spread
            { dayOffset: 3, amount: 15000, commission: 1500, status: 'captured', isCompleted: true },
            { dayOffset: 5, amount: 9000, commission: 900, status: 'captured', isCompleted: true },
            { dayOffset: 8, amount: 22000, commission: 2200, status: 'captured', isCompleted: true },
            { dayOffset: 10, amount: 18000, commission: 1800, status: 'captured', isCompleted: true },
            { dayOffset: 12, amount: 14000, commission: 1400, status: 'captured', isCompleted: false },
            { dayOffset: 15, amount: 30000, commission: 3000, status: 'captured', isCompleted: true },
            { dayOffset: 18, amount: 25000, commission: 2500, status: 'captured', isCompleted: true },
            { dayOffset: 20, amount: 8500, commission: 850, status: 'captured', isCompleted: true },
            { dayOffset: 22, amount: 11000, commission: 1100, status: 'captured', isCompleted: true },
            { dayOffset: 25, amount: 16000, commission: 1600, status: 'captured', isCompleted: true },
            { dayOffset: 28, amount: 45000, commission: 4500, status: 'captured', isCompleted: true },
            
            // Failed older
            { dayOffset: 14, amount: 7500, commission: 750, status: 'failed', isCompleted: false },
            { dayOffset: 21, amount: 9800, commission: 980, status: 'failed', isCompleted: false }
        ];

        for (let i = 0; i < paymentData.length; i++) {
            const p = paymentData[i];
            const timestamp = new Date(now.getTime() - p.dayOffset * 24 * 3600 * 1000);
            const userIndex = i % users.length;
            const user = users[userIndex];

            // Create Order
            const order = await prisma.order.create({
                data: {
                    orderId: `ORD-${timestamp.getTime()}-${i}`,
                    boutiqueId: boutique.id,
                    ownerId: owner.id,
                    customerName: user.name,
                    customerPhone: user.phone,
                    designId: design.id,
                    designName: design.name,
                    category: design.category,
                    price: p.amount,
                    advancePaid: p.status === 'captured' ? p.amount : 0,
                    remainingAmount: p.status === 'captured' ? 0 : p.amount,
                    orderStatus: p.isCompleted ? 'delivered' : 'pending',
                    paymentStatus: p.status,
                    orderDate: timestamp,
                    createdAt: timestamp,
                    updatedAt: timestamp
                }
            });

            // Create Payment
            await prisma.payment.create({
                data: {
                    orderId: order.id,
                    boutiqueId: boutique.id,
                    customerId: user.id,
                    amount: p.amount,
                    status: p.status,
                    method: 'Razorpay',
                    commissionAmount: p.commission,
                    netAmount: p.amount - p.commission,
                    payoutStatus: p.status === 'captured' ? 'pending' : 'failed',
                    createdAt: timestamp
                }
            });
        }
        console.log(`✅ Seeded ${paymentData.length} Orders and Payments.`);

        // 5. Create bookings
        console.log('Seeding bookings...');
        const bookingsList = [
            { dayOffset: 0, status: 'Accepted', type: 'STORE_VISIT', time: '11:00 AM' },
            { dayOffset: 0, status: 'Pending', type: 'VIDEO_CONSULTATION', time: '02:00 PM' },
            { dayOffset: 0, status: 'Completed', type: 'HOME_MEASUREMENT', time: '04:00 PM' },
            { dayOffset: 1, status: 'Accepted', type: 'DESIGN_DISCUSSION', time: '12:00 PM' },
            { dayOffset: 2, status: 'Completed', type: 'TRIAL_FITTING', time: '03:00 PM' },
            { dayOffset: 5, status: 'Accepted', type: 'STORE_VISIT', time: '10:00 AM' },
            { dayOffset: 10, status: 'Completed', type: 'FINAL_DELIVERY', time: '05:30 PM' },
            { dayOffset: 15, status: 'Rejected', type: 'STORE_VISIT', time: '01:00 PM' },
            { dayOffset: 20, status: 'Completed', type: 'VIDEO_CONSULTATION', time: '04:30 PM' },
            { dayOffset: 25, status: 'Accepted', type: 'HOME_MEASUREMENT', time: '11:30 AM' }
        ];

        for (let i = 0; i < bookingsList.length; i++) {
            const b = bookingsList[i];
            const timestamp = new Date(now.getTime() - b.dayOffset * 24 * 3600 * 1000);
            const user = users[i % users.length];

            await prisma.booking.create({
                data: {
                    boutiqueId: boutique.id,
                    bookingType: b.type,
                    customerName: user.name,
                    customerMobile: user.phone,
                    bookingDate: timestamp,
                    bookingTime: b.time,
                    notes: `Session notes for ${user.name}`,
                    status: b.status,
                    assignedOwnerId: owner.id,
                    createdAt: timestamp
                }
            });
        }
        console.log(`✅ Seeded ${bookingsList.length} Bookings.`);

        // 6. Create payouts
        console.log('Seeding payouts...');
        const payoutsList = [
            // Pending payouts
            { amount: 15000, status: 'PENDING', ageDays: 1 },
            { amount: 25000, status: 'APPROVED', ageDays: 3 },
            // 7+ days old pending payout (SLA alert)
            { amount: 45000, status: 'PENDING', ageDays: 10 },
            // Released payouts
            { amount: 35000, status: 'RELEASED', ageDays: 12 },
            { amount: 20000, status: 'RELEASED', ageDays: 20 }
        ];

        for (const po of payoutsList) {
            const timestamp = new Date(now.getTime() - po.ageDays * 24 * 3600 * 1000);
            await prisma.payout.create({
                data: {
                    boutiqueId: boutique.id,
                    amount: po.amount,
                    status: po.status,
                    payoutId: po.status === 'RELEASED' ? `PAY-${timestamp.getTime()}` : null,
                    referenceCode: po.status === 'RELEASED' ? `REF-${timestamp.getTime()}` : null,
                    payoutDate: po.status === 'RELEASED' ? timestamp : null,
                    createdAt: timestamp,
                    updatedAt: timestamp
                }
            });
        }
        console.log(`✅ Seeded ${payoutsList.length} Payouts.`);

        // 7. Create reviews
        console.log('Seeding reviews...');
        const reviewsList = [
            { rating: 5, status: 'APPROVED', comment: 'Absolutely beautiful stitching! Perfect fit.', isSuspicious: false },
            { rating: 5, status: 'APPROVED', comment: 'Amazing designer Blouse. Loved it.', isSuspicious: false },
            { rating: 1, status: 'PENDING', comment: 'SCAM BOUTIQUE! THEY TOOK MY MONEY AND STOLE MY DRESS!', isSuspicious: true, reason: 'High NLP negative intensity' },
            { rating: 2, status: 'PENDING', comment: 'Not satisfied, delayed delivery', isSuspicious: false },
            { rating: 5, status: 'FLAGGED', comment: 'This is the best boutique ever, very fast delivery check out discount code: GET50!', isSuspicious: true, reason: 'Contains promotional links/codes' }
        ];

        for (let i = 0; i < reviewsList.length; i++) {
            const r = reviewsList[i];
            const timestamp = new Date(now.getTime() - i * 3 * 24 * 3600 * 1000);
            const user = users[i % users.length];

            await prisma.review.create({
                data: {
                    boutiqueId: boutique.id,
                    userId: user.id,
                    rating: r.rating,
                    comment: r.comment,
                    moderationStatus: r.status,
                    isSuspicious: r.isSuspicious,
                    suspiciousReason: r.reason || null,
                    verifiedPurchase: i % 2 === 0,
                    createdAt: timestamp
                }
            });
        }
        console.log(`✅ Seeded ${reviewsList.length} Reviews.`);

        // 8. Create support tickets
        console.log('Seeding support tickets...');
        const ticketsList = [
            // Open, normal
            { type: 'ORDER_ISSUE', priority: 'MEDIUM', subject: 'Expected delivery date query', desc: 'When will order ORD-123 be delivered?', status: 'OPEN', ageHours: 2 },
            // High priority, open
            { type: 'PAYMENT_ISSUE', priority: 'HIGH', subject: 'Double charge on my credit card', desc: 'I was charged twice for booking.', status: 'OPEN', ageHours: 5 },
            // Critical SLA breached
            { type: 'REFUND_REQUEST', priority: 'CRITICAL', subject: 'Refund delay', desc: 'Refund not received yet.', status: 'IN_PROGRESS', ageHours: 36, fraudScore: 60, riskLevel: 'HIGH' },
            // Excessive tickets
            { type: 'CUSTOMER_COMPLAINT', priority: 'MEDIUM', subject: 'Bad communication', desc: 'Boutique owner is not responsive.', status: 'OPEN', ageHours: 48, excessiveTicketFlag: true },
            // Resolved
            { type: 'ORDER_ISSUE', priority: 'LOW', subject: 'Address change request', desc: 'Update my address please.', status: 'RESOLVED', ageHours: 72 }
        ];

        for (let i = 0; i < ticketsList.length; i++) {
            const t = ticketsList[i];
            const timestamp = new Date(now.getTime() - t.ageHours * 3600 * 1000);
            const user = users[i % users.length];

            await prisma.supportTicket.create({
                data: {
                    userId: user.id,
                    boutiqueId: boutique.id,
                    ticketType: t.type,
                    priority: t.priority,
                    source: 'WEB',
                    subject: t.subject,
                    description: t.desc,
                    status: t.status,
                    riskLevel: t.riskLevel || 'LOW',
                    fraudScore: t.fraudScore || 10,
                    excessiveTicketFlag: t.excessiveTicketFlag || false,
                    slaBreached: t.ageHours > 24 && t.status !== 'RESOLVED',
                    createdAt: timestamp
                }
            });
        }
        console.log(`✅ Seeded ${ticketsList.length} Support Tickets.`);

        // 9. Create wishlists
        console.log('Seeding wishlists...');
        // Link multiple users to our design to generate demand metrics
        for (let i = 0; i < Math.min(users.length, 8); i++) {
            await prisma.wishlist.create({
                data: {
                    userId: users[i].id,
                    designId: design.id,
                    createdAt: new Date(now.getTime() - i * 2 * 24 * 3600 * 1000)
                }
            });
        }
        console.log('✅ Seeded Wishlist items.');

        console.log('\n🌟 DATABASE SEEDING COMPLETED SUCCESSFULLY! 🌟');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during seeding:', err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

run();
