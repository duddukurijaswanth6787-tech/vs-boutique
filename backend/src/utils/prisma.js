const { PrismaClient } = require('@prisma/client');
const { registerPrismaLogger } = require('../middleware/logger');

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL.toLowerCase();
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
        throw new Error('CRITICAL CONFIGURATION ERROR: Database URL cannot be localhost or 127.0.0.1 in production mode.');
    }
}

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
