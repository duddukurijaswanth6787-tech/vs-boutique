const { MongoClient } = require('mongodb');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: './.env' });

const prisma = new PrismaClient();

async function run() {
    console.log('Connecting to databases...');
    const mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Map to preserve relationships (MongoDB ObjectId -> PostgreSQL UUID)
    const idMap = new Map();

    const getUUID = (mongoId) => {
        if (!mongoId) return null;
        const key = mongoId.toString();
        if (!idMap.has(key)) {
            idMap.set(key, uuidv4());
        }
        return idMap.get(key);
    };

    const metrics = {
        users: { mongo: 0, pg: 0 },
        boutiques: { mongo: 0, pg: 0 },
        owners: { mongo: 0, pg: 0 },
        designs: { mongo: 0, pg: 0 },
        orders: { mongo: 0, pg: 0 },
        orderHistories: { mongo: 0, pg: 0 },
        bookings: { mongo: 0, pg: 0 },
        measurements: { mongo: 0, pg: 0 },
        notifications: { mongo: 0, pg: 0 },
        payments: { mongo: 0, pg: 0 },
        activities: { mongo: 0, pg: 0 },
        auditLogs: { mongo: 0, pg: 0 }
    };

    // Helper parsing/cleaning functions
    const parseExperienceYears = (val) => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') return Math.floor(val);
        const parsed = parseInt(val.toString().replace(/[^0-9]/g, ''), 10);
        return isNaN(parsed) ? 0 : parsed;
    };

    const parseStartingPrice = (val) => {
        if (val === null || val === undefined) return 0.00;
        if (typeof val === 'number') return val;
        const cleaned = val.toString().replace(/[^0-9.]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0.00 : parsed;
    };

    const parseIntVal = (val) => {
        if (val === null || val === undefined || val === '') return 0;
        if (typeof val === 'number') return Math.floor(val);
        const parsed = parseInt(val.toString().replace(/[^0-9]/g, ''), 10);
        return isNaN(parsed) ? 0 : parsed;
    };

    const parseDecimalVal = (val) => {
        if (val === null || val === undefined || val === '') return null;
        if (typeof val === 'number') return val;
        const parsed = parseFloat(val.toString().replace(/[^0-9.]/g, ''));
        return isNaN(parsed) ? null : parsed;
    };

    try {
        console.log('Cleaning up target database...');
        await prisma.auditLog.deleteMany({});
        await prisma.activity.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.notification.deleteMany({});
        await prisma.measurement.deleteMany({});
        await prisma.booking.deleteMany({});
        await prisma.orderHistory.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.design.deleteMany({});
        // Disconnect primary owners from boutiques to avoid foreign key circular ref delete blocks
        await prisma.boutique.updateMany({ data: { ownerId: null } });
        await prisma.owner.deleteMany({});
        await prisma.boutique.deleteMany({});
        await prisma.user.deleteMany({});
        console.log('Cleaned up target database successfully.');

        // 1. Migrate Users
        console.log('Migrating Users...');
        const mongoUsers = await db.collection('users').find({}).toArray();
        metrics.users.mongo = mongoUsers.length;
        for (const u of mongoUsers) {
            const pgId = getUUID(u._id);
            await prisma.user.upsert({
                where: { id: pgId },
                update: {},
                create: {
                    id: pgId,
                    phone: u.phone,
                    name: u.name || 'New User',
                    createdAt: u.createdAt || new Date()
                }
            });
            metrics.users.pg++;
        }

        // 2. Migrate Boutiques
        console.log('Migrating Boutiques...');
        const mongoBoutiques = await db.collection('boutiques').find({}).toArray();
        metrics.boutiques.mongo = mongoBoutiques.length;
        for (const b of mongoBoutiques) {
            const pgId = getUUID(b._id);
            await prisma.boutique.upsert({
                where: { id: pgId },
                update: {},
                create: {
                    id: pgId,
                    name: b.name,
                    ownerName: b.ownerName,
                    description: b.description || '',
                    experienceYears: parseExperienceYears(b.experienceYears),
                    status: b.status || 'Active',
                    featuredBoutique: b.featuredBoutique || false,
                    verified: b.verified || false,
                    happyClients: parseIntVal(b.happyClients),
                    totalDesigns: parseIntVal(b.totalDesigns),
                    mobileNumber: b.mobileNumber,
                    whatsappNumber: b.whatsappNumber || '',
                    email: b.email,
                    fullAddress: b.fullAddress,
                    area: b.area || '',
                    city: b.city,
                    state: b.state,
                    pincode: b.pincode || '',
                    googleMapsLink: b.googleMapsLink || '',
                    serviceRadius: b.serviceRadius || '',
                    openDays: b.openDays || '',
                    openingTime: b.openingTime || '',
                    closingTime: b.closingTime || '',
                    weeklyHoliday: b.weeklyHoliday || '',
                    servicesOffered: b.servicesOffered || [],
                    workTypeSpecialty: b.workTypeSpecialty || [],
                    pickupAvailable: b.pickupAvailable || false,
                    deliveryAvailable: b.deliveryAvailable || false,
                    homeVisitAvailable: b.homeVisitAvailable || false,
                    appointmentBookingAvailable: b.appointmentBookingAvailable || false,
                    rushOrderAvailable: b.rushOrderAvailable || false,
                    startingPrice: parseStartingPrice(b.startingPrice),
                    turnaroundTime: b.turnaroundTime || '',
                    logoUrl: b.media?.logo || '',
                    coverImageUrl: b.media?.coverImage || '',
                    galleryUrls: b.media?.gallery || [],
                    instagramHandle: b.instagramHandle || '',
                    facebookPage: b.facebookPage || '',
                    websiteLink: b.websiteLink || '',
                    verificationDocuments: b.verificationDocuments || [],
                    payoutDetails: b.payoutDetails || '',
                    payoutStatus: b.payoutStatus || 'Pending',
                    internalNotes: b.internalNotes || '',
                    isDeleted: b.isDeleted || false,
                    deletedAt: b.deletedAt,
                    rating: parseDecimalVal(b.rating) || 0.00,
                    reviewsCount: parseIntVal(b.reviewsCount)
                }
            });
            metrics.boutiques.pg++;
        }

        // 3. Migrate Owners
        console.log('Migrating Owners...');
        const mongoOwners = await db.collection('owners').find({}).toArray();
        metrics.owners.mongo = mongoOwners.length;
        for (const o of mongoOwners) {
            const pgId = getUUID(o._id);
            const pgBoutiqueId = o.assignedBoutiqueId ? getUUID(o.assignedBoutiqueId) : null;
            await prisma.owner.upsert({
                where: { id: pgId },
                update: {},
                create: {
                    id: pgId,
                    ownerName: o.ownerName,
                    username: o.username,
                    email: o.email,
                    mobileNumber: o.mobileNumber,
                    password: o.password,
                    role: o.role === 'super-admin' ? 'super_admin' : 'owner',
                    status: o.status || 'Pending',
                    assignedBoutiqueId: pgBoutiqueId,
                    inviteTokenHash: o.inviteTokenHash,
                    inviteExpiresAt: o.inviteExpiresAt,
                    resetPasswordToken: o.resetPasswordToken,
                    resetPasswordExpire: o.resetPasswordExpire,
                    mustResetPassword: o.mustResetPassword !== undefined ? o.mustResetPassword : true,
                    emailVerified: o.emailVerified || false,
                    lastLogin: o.lastLogin,
                    isDeleted: o.isDeleted || false,
                    canEditProfile: o.permissions?.canEditProfile !== undefined ? o.permissions.canEditProfile : true,
                    canEditServices: o.permissions?.canEditServices !== undefined ? o.permissions.canEditServices : true,
                    canEditGallery: o.permissions?.canEditGallery !== undefined ? o.permissions.canEditGallery : true,
                    canManageDesigns: o.permissions?.canManageDesigns !== undefined ? o.permissions.canManageDesigns : true,
                    canManageOrders: o.permissions?.canManageOrders !== undefined ? o.permissions.canManageOrders : true,
                    canManageBookings: o.permissions?.canManageBookings !== undefined ? o.permissions.canManageBookings : true,
                    canManageReviews: o.permissions?.canManageReviews !== undefined ? o.permissions.canManageReviews : true,
                    canManageMedia: o.permissions?.canManageMedia !== undefined ? o.permissions.canManageMedia : true,
                    canViewAnalytics: o.permissions?.canViewAnalytics !== undefined ? o.permissions.canViewAnalytics : true,
                    createdAt: o.createdAt || new Date()
                }
            });
            metrics.owners.pg++;
        }

        // Connect primary owners back to boutiques
        console.log('Linking primary owners...');
        for (const b of mongoBoutiques) {
            if (b.ownerId) {
                const pgBoutiqueId = getUUID(b._id);
                const pgOwnerId = getUUID(b.ownerId);
                
                // Verify owner exists in Postgres
                const ownerExists = await prisma.owner.findUnique({ where: { id: pgOwnerId } });
                if (ownerExists) {
                    await prisma.boutique.update({
                        where: { id: pgBoutiqueId },
                        data: { ownerId: pgOwnerId }
                    });
                }
            }
        }

        // 4. Migrate Designs
        console.log('Migrating Designs...');
        const mongoDesigns = await db.collection('designs').find({}).toArray();
        metrics.designs.mongo = mongoDesigns.length;
        for (const d of mongoDesigns) {
            const pgId = getUUID(d._id);
            const pgBoutiqueId = getUUID(d.boutiqueId);
            await prisma.design.upsert({
                where: { id: pgId },
                update: {},
                create: {
                    id: pgId,
                    boutiqueId: pgBoutiqueId,
                    name: d.name,
                    description: d.description || '',
                    category: d.category,
                    images: d.images || [],
                    price: parseStartingPrice(d.price),
                    tags: d.tags || [],
                    isFeatured: d.isFeatured || false,
                    isAvailable: d.isAvailable !== undefined ? d.isAvailable : true,
                    isDeleted: d.isDeleted || false,
                    createdAt: d.createdAt || new Date()
                }
            });
            metrics.designs.pg++;
        }

        // 5. Migrate Orders and nested Order History
        console.log('Migrating Orders...');
        const mongoOrders = await db.collection('orders').find({}).toArray();
        metrics.orders.mongo = mongoOrders.length;
        for (const o of mongoOrders) {
            const pgId = getUUID(o._id);
            const pgBoutiqueId = getUUID(o.boutiqueId);
            const pgOwnerId = getUUID(o.ownerId);
            const pgDesignId = o.designId ? getUUID(o.designId) : null;

            await prisma.order.upsert({
                where: { id: pgId },
                update: {},
                create: {
                    id: pgId,
                    orderId: o.orderId,
                    boutiqueId: pgBoutiqueId,
                    ownerId: pgOwnerId,
                    customerName: o.customerName,
                    customerPhone: o.customerPhone,
                    customerAddress: o.customerAddress || '',
                    designId: pgDesignId,
                    designName: o.designName || '',
                    category: o.category || 'Blouse',
                    measurementBust: parseDecimalVal(o.measurements?.bust),
                    measurementWaist: parseDecimalVal(o.measurements?.waist),
                    measurementHip: parseDecimalVal(o.measurements?.hip),
                    measurementShoulder: parseDecimalVal(o.measurements?.shoulder),
                    measurementSleeveLength: parseDecimalVal(o.measurements?.sleeveLength),
                    measurementBlouseLength: parseDecimalVal(o.measurements?.blouseLength),
                    measurementNotes: o.measurements?.notes || '',
                    price: parseDecimalVal(o.pricing?.price) || 0.00,
                    advancePaid: parseDecimalVal(o.pricing?.advancePaid) || 0.00,
                    remainingAmount: parseDecimalVal(o.pricing?.remainingAmount) || 0.00,
                    orderStatus: o.orderStatus || 'pending',
                    paymentStatus: o.paymentStatus || 'pending',
                    orderDate: o.orderDate || new Date(),
                    expectedDeliveryDate: o.expectedDeliveryDate,
                    actualDeliveryDate: o.actualDeliveryDate,
                    isDeleted: o.isDeleted || false,
                    createdAt: o.createdAt || new Date(),
                    updatedAt: o.updatedAt || new Date()
                }
            });
            metrics.orders.pg++;

            // Handle nested history logs
            if (Array.isArray(o.orderHistory)) {
                metrics.orderHistories.mongo += o.orderHistory.length;
                for (const h of o.orderHistory) {
                    await prisma.orderHistory.create({
                        data: {
                            orderId: pgId,
                            status: h.status || 'pending',
                            note: h.note || '',
                            timestamp: h.timestamp || new Date()
                        }
                    });
                    metrics.orderHistories.pg++;
                }
            }
        }

        // 6. Migrate Bookings
        console.log('Migrating Bookings...');
        const mongoBookings = await db.collection('bookings').find({}).toArray();
        metrics.bookings.mongo = mongoBookings.length;
        for (const bk of mongoBookings) {
            const pgId = getUUID(bk._id);
            const pgBoutiqueId = getUUID(bk.boutiqueId);
            await prisma.booking.upsert({
                where: { id: pgId },
                update: {},
                create: {
                    id: pgId,
                    boutiqueId: pgBoutiqueId,
                    customerName: bk.customerName,
                    customerEmail: bk.customerEmail || '',
                    customerMobile: bk.customerMobile,
                    bookingDate: bk.date || new Date(),
                    bookingTime: bk.time,
                    notes: bk.notes || '',
                    status: bk.status || 'Pending',
                    isDeleted: bk.isDeleted || false,
                    createdAt: bk.createdAt || new Date()
                }
            });
            metrics.bookings.pg++;
        }

        // 7. Migrate Measurements
        console.log('Migrating Measurements...');
        const mongoMeasurements = await db.collection('measurements').find({}).toArray();
        metrics.measurements.mongo = mongoMeasurements.length;
        for (const m of mongoMeasurements) {
            const pgId = getUUID(m._id);
            
            // Resolve userId (which might be phone or string) into a User UUID
            let pgUserId = null;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            
            if (uuidRegex.test(m.userId)) {
                // If it is a valid UUID, find or create the User
                const user = await prisma.user.findUnique({ where: { id: m.userId } });
                if (user) {
                    pgUserId = user.id;
                } else {
                    const newUser = await prisma.user.create({
                        data: {
                            id: m.userId,
                            phone: `dummy-${m.userId.substring(0, 10)}`,
                            name: 'Migrated User'
                        }
                    });
                    pgUserId = newUser.id;
                    metrics.users.pg++;
                }
            } else {
                // If it is a phone or string, find or create the User by phone
                // Ensure the string fits inside VarChar(20) phone column
                const truncatedPhone = m.userId.substring(0, 20);
                const user = await prisma.user.findUnique({ where: { phone: truncatedPhone } });
                if (user) {
                    pgUserId = user.id;
                } else {
                    const newUser = await prisma.user.create({
                        data: {
                            phone: truncatedPhone,
                            name: 'Migrated User'
                        }
                    });
                    pgUserId = newUser.id;
                    metrics.users.pg++;
                }
            }

            await prisma.measurement.upsert({
                where: { id: pgId },
                update: {},
                create: {
                    id: pgId,
                    userId: pgUserId,
                    chest: parseDecimalVal(m.measurements?.chest),
                    waist: parseDecimalVal(m.measurements?.waist),
                    length: parseDecimalVal(m.measurements?.length),
                    shoulder: parseDecimalVal(m.measurements?.shoulder),
                    sleeveLength: parseDecimalVal(m.measurements?.sleeveLength),
                    neck: parseDecimalVal(m.measurements?.neck),
                    notes: m.notes || '',
                    updatedAt: m.updatedAt || new Date()
                }
            });
            metrics.measurements.pg++;
        }

        // 8. Migrate Notifications
        console.log('Migrating Notifications...');
        const mongoNotifications = await db.collection('notifications').find({}).toArray();
        metrics.notifications.mongo = mongoNotifications.length;
        for (const n of mongoNotifications) {
            const pgId = getUUID(n._id);
            const pgRecipientId = n.recipientId ? getUUID(n.recipientId) : null;
            const pgBoutiqueId = n.boutiqueId ? getUUID(n.boutiqueId) : null;

            await prisma.notification.upsert({
                where: { id: pgId },
                update: {},
                create: {
                    id: pgId,
                    recipientRole: n.recipientRole === 'super-admin' ? 'super_admin' : 'owner',
                    recipientId: pgRecipientId,
                    boutiqueId: pgBoutiqueId,
                    title: n.title,
                    message: n.message,
                    type: n.type || 'SYSTEM',
                    isRead: n.isRead || false,
                    createdAt: n.createdAt || new Date()
                }
            });
            metrics.notifications.pg++;
        }

        // 9. Migrate Payments
        console.log('Migrating Payments...');
        const mongoPayments = await db.collection('payments').find({}).toArray();
        metrics.payments.mongo = mongoPayments.length;
        for (const p of mongoPayments) {
            const pgId = getUUID(p._id);
            const pgOrderId = getUUID(p.orderId);
            const pgBoutiqueId = getUUID(p.boutiqueId);
            const pgCustomerId = p.customerId ? getUUID(p.customerId) : null;

            await prisma.payment.upsert({
                where: { id: pgId },
                update: {},
                create: {
                    id: pgId,
                    orderId: pgOrderId,
                    boutiqueId: pgBoutiqueId,
                    customerId: pgCustomerId,
                    amount: parseDecimalVal(p.amount) || 0.00,
                    currency: p.currency || 'INR',
                    status: p.status || 'pending',
                    method: p.method || '',
                    commissionAmount: parseDecimalVal(p.commissionAmount) || 0.00,
                    netAmount: parseDecimalVal(p.netAmount) || 0.00,
                    payoutStatus: p.payoutStatus || 'pending',
                    payoutId: p.payoutId || '',
                    refundId: p.refundId || '',
                    refundReason: p.refundReason || '',
                    razorpay_order_id: p.razorpay_order_id || '',
                    razorpay_payment_id: p.razorpay_payment_id || '',
                    razorpay_signature: p.razorpay_signature || '',
                    receipt: p.receipt || '',
                    description: p.description || '',
                    metadata: p.metadata || {},
                    createdAt: p.createdAt || new Date()
                }
            });
            metrics.payments.pg++;
        }

        // 10. Migrate Activities
        console.log('Migrating Activities...');
        const mongoActivities = await db.collection('activities').find({}).toArray();
        metrics.activities.mongo = mongoActivities.length;
        for (const a of mongoActivities) {
            const pgId = getUUID(a._id);
            await prisma.activity.upsert({
                where: { id: pgId },
                update: {},
                create: {
                    id: pgId,
                    type: a.type,
                    title: a.title,
                    price: a.price || '',
                    createdAt: a.createdAt || new Date()
                }
            });
            metrics.activities.pg++;
        }

        // 11. Migrate Audit Logs
        console.log('Migrating Audit Logs...');
        const mongoAuditLogs = await db.collection('auditlogs').find({}).toArray();
        metrics.auditLogs.mongo = mongoAuditLogs.length;
        for (const al of mongoAuditLogs) {
            const pgId = getUUID(al._id);
            const pgPerformedBy = getUUID(al.performedBy);
            if (!pgPerformedBy) continue; // Safeguard if user is missing

            // Check if Owner exists
            const ownerExists = await prisma.owner.findUnique({ where: { id: pgPerformedBy } });
            if (!ownerExists) {
                console.log(`Skipping audit log ${al._id} because owner ${pgPerformedBy} does not exist.`);
                continue;
            }

            await prisma.auditLog.upsert({
                where: { id: pgId },
                update: {},
                create: {
                    id: pgId,
                    actionType: al.actionType || al.action || 'UNKNOWN',
                    entityType: al.entityType || 'UNKNOWN',
                    entityId: al.entityId || (al.metadata?.orderId ? al.metadata.orderId.toString() : 'UNKNOWN'),
                    performedBy: pgPerformedBy,
                    changesBefore: al.changes?.before || {},
                    changesAfter: al.changes?.after || {},
                    metadata: al.metadata || {},
                    ipAddress: al.ipAddress || '',
                    timestamp: al.timestamp || new Date()
                }
            });
            metrics.auditLogs.pg++;
        }

        console.log('\n=====================================');
        console.log('      DATA MIGRATION COMPLETION      ');
        console.log('=====================================');
        console.log(JSON.stringify(metrics, null, 2));
        console.log('=====================================');

    } catch (e) {
        console.error('❌ Data migration failed:', e);
    } finally {
        await mongoClient.close();
        await prisma.$disconnect();
    }
}

run();
