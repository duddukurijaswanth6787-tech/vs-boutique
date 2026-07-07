const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error(`CRITICAL ERROR: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

require('./services/notificationListener');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many uploads, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 1000,
  message: { success: false, message: 'Too many requests, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/api-docs'
});

const authRouter = require('./modules/auth/routes/auth.routes');
const boutiquesRouter = require('./modules/boutiques/routes/boutiques.routes');
const { dashboardRouter } = require('./modules/analytics/routes/analytics.routes');
const { superadminRouter: ownersRouter, ownerPortalRouter } = require('./modules/owners/routes/owners.routes');
const designRouter = require('./modules/designs/routes/designs.routes');
const { ordersRouter, customerOrdersRouter } = require('./modules/orders/routes/orders.routes');
const measurementRouter = require('./modules/measurements/routes/measurements.routes');
const { paymentsRouter, payoutsRouter } = require('./modules/payments/routes/payments.routes');
const { upload, resolveUploadType, hasAwsUploadConfig, validateFileType } = require('./utils/upload');
const { protect, authorize } = require('./middleware/authMiddleware');
const sharp = require('sharp');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3 } = require('./utils/s3');
const crypto = require('crypto');
const { swaggerUi, specs } = require('./swagger');

const app = express();

// Swagger Documentation (disabled in production)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

// Middleware
app.disable('x-powered-by');
const cspDirectives = process.env.NODE_ENV === 'production'
  ? {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.amazonaws.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  : {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.amazonaws.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    };
app.use(helmet({
  contentSecurityPolicy: { directives: cspDirectives },
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
const allowedOrigins = [
  'https://vsboutique.shop',
  'https://www.vsboutique.shop',
  'https://admin.vsboutique.shop',
  'https://owner.vsboutique.shop',
  'https://vs-boutique.vercel.app'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
      (process.env.NODE_ENV !== 'production' && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')));
      
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Disable caching for development to avoid 304 confusion
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        next();
    });
}

// Advanced Terminal Logging System
const { requestLogger, errorLogger, logServerStartup, startSystemHealthMonitor } = require('./middleware/logger');
app.use(requestLogger);

// Database Connection
const prisma = require('./utils/prisma');

prisma.$connect()
    .catch(err => {
        console.error('❌ PostgreSQL connection error:', err);
    });

// Start health checks monitor
startSystemHealthMonitor(prisma);

// Health endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const memoryMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: `${memoryMB}MB`,
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0'
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      error: err.message
    });
  }
});

app.get('/api/v1/health/live', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/v1/health/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (err) {
    res.status(503).json({
      status: 'unready',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err.message
    });
  }
});

// Start reservation cleanup job
const { startReservationCleanup } = require('./jobs/cleanupReservations');
startReservationCleanup();

// Routes
app.use('/auth', authLimiter, authRouter);
app.use(apiLimiter);
app.use('/boutiques', boutiquesRouter);
app.use('/dashboard', dashboardRouter);
app.use('/owners', ownersRouter);
app.use('/owner', ownerPortalRouter);
app.use('/owner/products', require('./modules/products/routes/products.routes').ownerProductsRouter);
app.use('/owner/products/:productId/images', require('./modules/products/routes/products.routes').ownerProductImagesRouter);
app.use('/designs', designRouter);
const ordersRouterCombined = require('express').Router();
ordersRouterCombined.use(customerOrdersRouter);
ordersRouterCombined.use(ordersRouter);
ordersRouterCombined.use(require('./modules/commerce/routes/commerce.routes').customerCommerceRouter);
app.use('/orders', ordersRouterCombined);
app.use('/notifications', require('./modules/notifications/routes/notifications.routes').notificationsRouter);
app.use('/measurements', measurementRouter);
app.use('/payments', paymentsRouter);
app.use('/payouts', payoutsRouter);
app.use('/admin/customers', require('./modules/customers/routes/customers.routes'));
app.use('/bookings', require('./modules/tailoring/routes/tailoring.routes'));
app.use('/reviews', require('./modules/reviews/routes/reviews.routes').reviewsRouter);
app.use('/admin/marketplace-insights', require('./modules/analytics/routes/analytics.routes').insightsRouter);
app.use('/subscriptions', require('./modules/subscriptions/routes/subscriptions.routes'));
app.use('/tickets', require('./modules/tickets/routes/tickets.routes'));
app.use('/categories', require('./modules/categories/routes/categories.routes').categoriesRouter);
app.use('/subcategories', require('./modules/categories/routes/categories.routes').subCategoriesRouter);
app.use('/products', require('./modules/products/routes/products.routes').productsRouter);
app.use('/customer/notifications', require('./modules/notifications/routes/notifications.routes').customerNotificationsRouter);
app.use('/cart', require('./modules/commerce/routes/cart.routes'));
app.use('/shipping-addresses', require('./modules/users/routes/users.routes'));
app.use('/admin/notifications', require('./modules/notifications/routes/notifications.routes').adminNotificationsRouter);
app.use('/admin', require('./modules/settings/routes/settings.routes'));
app.use('/checkout', require('./modules/checkout/routes/checkout.routes'));
app.use('/owner/orders', require('./modules/commerce/routes/commerce.routes').ownerCommerceRouter);
app.use('/coupons', require('./modules/coupons/routes/coupons.routes').customerRouter);
app.use('/admin/coupons', require('./modules/coupons/routes/coupons.routes').adminRouter);
app.use('/owner/coupons', require('./modules/coupons/routes/coupons.routes').ownerRouter);
app.use('/products/:productId/reviews', require('./modules/reviews/routes/reviews.routes').productReviewsCustomerRouter);
app.use('/owner/products/:productId/reviews', require('./modules/reviews/routes/reviews.routes').productReviewsOwnerRouter);
app.use('/admin/product-reviews', require('./modules/reviews/routes/reviews.routes').productReviewsGlobalAdminRouter);
app.use('/admin/products/:productId/reviews', require('./modules/reviews/routes/reviews.routes').productReviewsAdminRouter);
app.use('/owner/orders/:orderId/tracking', require('./modules/delivery/routes/delivery.routes').ownerTrackingRouter);
app.use('/orders', require('./modules/delivery/routes/delivery.routes').customerTrackingRouter);
app.use('/returns', require('./modules/delivery/routes/delivery.routes').customerReturnsRouter);
app.use('/owner/returns', require('./modules/delivery/routes/delivery.routes').ownerReturnsRouter);
app.use('/exchanges', require('./modules/delivery/routes/delivery.routes').customerExchangesRouter);
app.use('/owner/exchanges', require('./modules/delivery/routes/delivery.routes').ownerExchangesRouter);
app.use('/api/v1/cms/orchestrator', require('./modules/ai-core/routes/ai.routes'));
app.use('/api/v1/cms/generator', require('./modules/website-generator/routes/generator.routes'));
app.use('/api/v1/cms/certification', require('./modules/website-certification/routes/certification.routes'));
app.use('/api/v1/marketplace', require('./modules/marketplace/routes/marketplace.routes'));
// CMS system routes
app.use('/api/v1/cms/standards', require('./modules/cms-standards/routes/standards.routes'));
app.use('/api/v1/cms/requirements', require('./modules/cms-requirements/routes/requirements.routes'));
app.use('/api/v1/cms/blueprints', require('./modules/cms-blueprints/routes/blueprints.routes'));
app.use('/api/v1/cms/projects', require('./modules/cms-uploads/routes/uploads.routes'));
app.use('/api/v1/cms/projects', require('./modules/cms-verification/routes/verification.routes'));
app.use('/api/v1/cms/deployment', require('./modules/cms-deployment/routes/deployment.routes'));
app.use('/api/v1/cms/prompts', require('./modules/cms-prompts/routes/prompts.routes'));
app.use('/api/v1/cms/templates', require('./modules/cms-templates/routes/templates.routes'));
app.use('/api/v1/cms/reports', require('./modules/cms-reports/routes/reports.routes'));
app.use('/api/v1/cms/business-assignment', require('./modules/cms-business-assignment/routes/assignment.routes'));
app.use('/api/v1/cms/ai-center', require('./modules/cms-ai-center/routes/ai-center.routes'));
app.use('/api/v1/cms/settings', require('./modules/cms-settings/routes/settings.routes'));
app.use('/api/v1/cms/subscriptions', require('./modules/cms-subscriptions/routes/subscriptions.routes'));
app.use('/api/v1/cms/marketplace', require('./modules/cms-marketplace/routes/marketplace.routes'));
app.use('/api/v1/cms/monitoring', require('./modules/cms-monitoring/routes/monitoring.routes'));
app.use('/api/v1/cms/workflows', require('./modules/cms-workflow/routes/workflow.routes'));
app.use('/api/v1/cms/customer-success', require('./modules/cms-customer-success/routes/customer-success.routes'));
app.use('/api/v1/cms/developer', require('./modules/cms-developer-platform/routes/developer.routes'));
app.use('/api/v1/cms/compliance', require('./modules/cms-compliance/routes/compliance.routes'));
app.use('/api/v1/cms/disaster', require('./modules/cms-disaster-recovery/routes/disaster.routes'));
app.use('/api/v1/cms/infrastructure', require('./modules/cms-infrastructure/routes/infrastructure.routes'));
app.use('/api/v1/cms/analytics', require('./modules/cms-analytics/routes/analytics.routes'));
app.use('/api/v1/cms/partners', require('./modules/cms-partners/routes/partner.routes'));
app.use('/api/v1/cms/notifications', require('./modules/cms-notifications/routes/notification.routes'));
app.use('/api/v1/cms/devops', require('./modules/cms-devops/routes/devops.routes'));

// Initialize template integration service (certification + deployment + pipeline subscriptions)
require('./modules/cms-templates/services/template-integration.service');
// Initialize reports integration service (certification event subscriptions)
require('./modules/cms-reports/services/reports-integration.service').start();
// Initialize Business Assignment queue workers (Phase 13.5 enterprise optimization)
require('./modules/cms-business-assignment/services/assignment-queue');
// Initialize AI Agent Center (Phase 14 enterprise AI orchestration)
const aiCenterInit = require('./modules/cms-ai-center/services/settings.service');
aiCenterInit.initializeDefaults().catch(() => {});
// Initialize CMS Settings defaults (Phase 15)
const cmsSettingsInit = require('./modules/cms-settings/services/settings.service');
cmsSettingsInit.initializeDefaults().catch(() => {});
// Initialize CMS Subscription defaults (Phase 16)
const cmsSubsInit = require('./modules/cms-subscriptions/services/subscriptions.service');
cmsSubsInit.initializeDefaults().catch(() => {});
// Initialize CMS Marketplace defaults (Phase 17)
const cmsMpInit = require('./modules/cms-marketplace/services/marketplace.service');
cmsMpInit.initializeDefaults().catch(() => {});
// Initialize CMS Monitoring defaults (Phase 18)
const cmsMonInit = require('./modules/cms-monitoring/services/monitoring.service');
cmsMonInit.initializeDefaults().catch(() => {});
// Initialize CMS Workflow defaults (Phase 19)
const cmsWfTpl = require('./modules/cms-workflow/services/templates.service');
cmsWfTpl.initializeDefaults().catch(() => {});

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload an image to AWS S3
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 */
app.post('/upload', uploadLimiter, protect, authorize('owner', 'super-admin'), (req, res) => {
    if (!hasAwsUploadConfig) {
        return res.status(500).json({
            success: false,
            message: 'Upload failed: missing AWS S3 configuration in backend .env'
        });
    }

    const rawType = (req.query?.type || '').toLowerCase();
    if (rawType && !['logo', 'cover', 'gallery'].includes(rawType)) {
        return res.status(400).json({ success: false, message: 'Invalid file type' });
    }

    upload.single('image')(req, res, async (err) => {
        if (err) {
            console.log('[UPLOAD ERROR]', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ success: false, message: 'File too large. Max size is 15MB' });
            }
            const status = err.statusCode || 500;
            return res.status(status).json({ success: false, message: err.message || 'Upload failed' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Invalid file. "image" is required' });
        }

        try {
            const detectedType = validateFileType(req.file.buffer);

            const type = resolveUploadType(req.query?.type);
            let finalBuffer = req.file.buffer;
            let finalKey = '';
            let contentType = req.file.mimetype;

            if (req.file.mimetype === 'image/svg+xml') {
                // For SVGs, bypass sharp compression and upload directly as SVG
                const uniqueId = crypto.randomUUID();
                finalKey = `uploads/${type}/${Date.now()}-${uniqueId}.svg`;
            } else {
                // For JPEG, PNG, WebP: compress & convert to WebP using sharp
                const processed = sharp(req.file.buffer);
                
                // Inspect metadata to check if image is over 4K dimensions
                const metadata = await processed.metadata();
                const resizeOptions = {};
                if (metadata.width && metadata.width > 3840) {
                    resizeOptions.width = 3840;
                }
                if (metadata.height && metadata.height > 3840) {
                    resizeOptions.height = 3840;
                }

                if (Object.keys(resizeOptions).length > 0) {
                    processed.resize({
                        width: resizeOptions.width,
                        height: resizeOptions.height,
                        fit: 'inside',
                        withoutEnlargement: true
                    });
                }

                // Compress as WebP
                finalBuffer = await processed
                    .webp({ quality: 80 })
                    .toBuffer();

                const uniqueId = crypto.randomUUID();
                finalKey = `uploads/${type}/${Date.now()}-${uniqueId}.webp`;
                contentType = 'image/webp';
            }

            // Upload the optimized buffer to S3
            const s3Params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: finalKey,
                Body: finalBuffer,
                ContentType: contentType
            };

            await s3.send(new PutObjectCommand(s3Params));

            // Construct the final public S3 URL
            const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${finalKey}`;

            console.log('[UPLOAD SUCCESS] Optimized Image:', s3Url);
            return res.json({ success: true, url: s3Url });

        } catch (error) {
            console.error('[OPTIMIZATION / UPLOAD FAILING]', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to process and upload image: ' + error.message
            });
        }
    });
});

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'VS Boutique API is running...',
        timestamp: new Date().toISOString()
    });
});

// 404 handler — unmatched routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// Global Error Handler Middleware
app.use(errorLogger);

const PORT = process.env.PORT || 3005;
const server = app.listen(PORT, '0.0.0.0', () => {
    logServerStartup(app, PORT);
});

// Graceful shutdown
function shutdown(signal) {
    console.log(`\n${signal} received — starting graceful shutdown...`);
    server.close(() => {
        console.log('HTTP server closed.');
        prisma.$disconnect().then(() => {
            console.log('Database connections closed.');
            process.exit(0);
        }).catch((err) => {
            console.error('Error disconnecting Prisma:', err);
            process.exit(1);
        });
    });

    // Force exit after 15s if graceful shutdown hangs
    setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
    }, 15000);
}

// Process-level error monitoring (Phase 18)
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message, err.stack);
  const { eventBus, Events } = require('./services/eventBus');
  eventBus.emit(Events.MONITORING_ALERT, { type: 'uncaught_exception', message: err.message, stack: err.stack, timestamp: new Date() });
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason instanceof Error ? reason.message : reason);
  const { eventBus, Events } = require('./services/eventBus');
  eventBus.emit(Events.MONITORING_ALERT, { type: 'unhandled_rejection', message: reason instanceof Error ? reason.message : String(reason), timestamp: new Date() });
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

