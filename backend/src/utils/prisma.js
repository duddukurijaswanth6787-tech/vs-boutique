const { PrismaClient } = require('@prisma/client');
const { registerPrismaLogger } = require('../middleware/logger');

const isProduction = process.env.NODE_ENV === 'production';

const prisma = new PrismaClient({
    log: isProduction
        ? [{ level: 'error' }]
        : [{ emit: 'event', level: 'query' }],
    ...(isProduction ? {} : { errorFormat: 'pretty' })
});

if (!isProduction) {
    registerPrismaLogger(prisma);
}

module.exports = prisma;
