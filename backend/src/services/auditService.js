const prisma = require('../utils/prisma');

/**
 * Log an administrative action
 * @param {String} actionType - e.g., 'UPDATE_BOUTIQUE'
 * @param {String} entityType - e.g., 'boutique'
 * @param {String} entityId - The ID of the affected entity
 * @param {String} performedBy - The admin user UUID
 * @param {Object} changes - { before: {}, after: {} } or simple metadata
 * @param {String} ipAddress - Optional client IP
 */
const logAction = async (actionType, entityType, entityId, performedBy, changes = {}, ipAddress = null) => {
    try {
        const data = {
            actionType,
            entityType,
            entityId: entityId ? entityId.toString() : 'UNKNOWN',
            performedBy,
            ipAddress: ipAddress || null,
            timestamp: new Date()
        };

        if (changes.before || changes.after) {
            data.changesBefore = changes.before || {};
            data.changesAfter = changes.after || {};
        } else {
            data.metadata = changes;
        }

        await prisma.auditLog.create({
            data
        });
    } catch (err) {
        console.error('CRITICAL: Audit Logging Failed:', err);
        // Do not throw to prevent business logic interruption
    }
};

const getAuditLogs = async (entityType, entityId, options = {}) => {
    const { limit = 50, offset = 0, actionType } = options;
    const where = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (actionType) where.actionType = { startsWith: actionType };

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: limit,
            skip: offset,
            include: { owner: { select: { ownerName: true, email: true } } }
        }),
        prisma.auditLog.count({ where })
    ]);

    return { logs, total, limit, offset };
};

module.exports = { logAction, getAuditLogs };
