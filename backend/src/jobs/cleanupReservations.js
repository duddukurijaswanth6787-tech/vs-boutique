const prisma = require('../utils/prisma');
const { releaseInventory, createOrderHistory } = require('../modules/commerce/services/commerce.service');

const RELEASE_DELAY_MS = 30 * 60 * 1000;

async function cleanupExpiredReservations() {
    try {
        const cutoff = new Date(Date.now() - RELEASE_DELAY_MS);

        const expiredOrders = await prisma.commerceOrder.findMany({
            where: {
                reservationExpiresAt: { lte: cutoff },
                status: 'PENDING',
                paymentStatus: 'PENDING'
            },
            include: { items: true }
        });

        for (const order of expiredOrders) {
            await prisma.$transaction(async (tx) => {
                await tx.commerceOrder.update({
                    where: { id: order.id },
                    data: {
                        status: 'CANCELLED',
                        cancellationReason: 'Reservation expired',
                        cancelledAt: new Date()
                    }
                });

                for (const item of order.items) {
                    if (item.variantId) {
                        await releaseInventory(tx, item.variantId, item.quantity);
                    }
                }

                await createOrderHistory(tx, order.id, 'PENDING', 'CANCELLED', 'Reservation expired', 'system');
            });
        }

        if (expiredOrders.length > 0) {
            console.log(`[Cleanup] Released inventory for ${expiredOrders.length} expired reservations`);
        }
    } catch (err) {
        console.error('[Cleanup] Error cleaning up reservations:', err.message);
    }
}

function startReservationCleanup() {
    cleanupExpiredReservations();
    setInterval(cleanupExpiredReservations, 5 * 60 * 1000);
}

module.exports = { startReservationCleanup, cleanupExpiredReservations };
