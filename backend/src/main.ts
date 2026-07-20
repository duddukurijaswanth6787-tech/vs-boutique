import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { LoggerService } from '@common/logger/logger.service';
import { AppModule } from '@core/app.module';
import { StartupDashboardService } from '@common/logging/startup-dashboard.service';
import { setupSwagger } from '@core/swagger/swagger.config';
import { ValidationException } from '@common/exceptions';
import { SECURITY_CONSTANTS } from '@common/security';

/**
 * Bootstraps the NestJS web application, configuring filters, interceptors, and security middlewares.
 */
async function bootstrap() {
  // Buffer logs to ensure custom logger takes over early logging
  // ponytail: disable default body parser to mount manual size limits safely
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });

  // Use custom LoggerService
  const loggerService = app.get(LoggerService);
  app.useLogger(loggerService);

  const configService = app.get(ConfigService);
  const isProd = configService.get<string>('app.env') === 'production';
  const helmetCsp = configService.get<boolean>(
    'app.security.helmetCspEnabled',
    true,
  );
  const helmetCoep = configService.get<boolean>(
    'app.security.helmetCoepEnabled',
    true,
  );

  // Configure Helmet security headers (environment-aware)
  app.use(
    helmet({
      contentSecurityPolicy: isProd && helmetCsp ? undefined : false,
      crossOriginEmbedderPolicy: isProd && helmetCoep,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: isProd
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    }),
  );

  app.use((_req: any, res: any, next: any) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()',
    );
    next();
  });

  // Configure trusted proxy settings for Express (resolves client IPs behind load balancers)
  const expressInstance = app.getHttpAdapter().getInstance();
  const proxyCount = configService.get<number>(
    'app.security.trustProxyCount',
    1,
  );
  expressInstance.set('trust proxy', proxyCount);

  // Mount request body parser limits manually
  const jsonLimit = configService.get<string>(
    'app.security.bodyJsonLimit',
    SECURITY_CONSTANTS.MAX_JSON_SIZE,
  );
  const urlencodedLimit = configService.get<string>(
    'app.security.bodyUrlencodedLimit',
    SECURITY_CONSTANTS.MAX_URLENCODED_SIZE,
  );
  app.use(
    json({
      limit: jsonLimit,
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(urlencoded({ extended: true, limit: urlencodedLimit }));

  // Enable HTTP Compression
  app.use(compression());

  // Global route prefix
  // health checks and swagger docs are excluded from global route prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'api/docs'],
  });

  const corsOrigin = configService.get<string>('app.cors.origin', '*');
  const corsMethods = configService.get<string>(
    'app.cors.methods',
    'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  );
  const corsHeaders = configService.get<string>(
    'app.cors.allowedHeaders',
    'Content-Type,Accept,Authorization,x-correlation-id,x-request-id',
  );

  // Configure CORS policies (restrict wildcards in production)
  app.enableCors({
    origin: isProd && corsOrigin === '*' ? false : corsOrigin,
    methods: corsMethods,
    allowedHeaders: corsHeaders,
    credentials: true,
  });

  // Enable shutdown hooks for graceful termination (e.g. database, redis, queues)
  app.enableShutdownHooks();

  // Apply Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messages = errors.map(
          (err) =>
            `${err.property}: ${Object.values(err.constraints || {}).join(', ')}`,
        );
        return new ValidationException(messages.join('; '), 'INVALID_INPUT', {
          validationErrors: messages,
        });
      },
    }),
  );

  // Initialize Swagger Documentation
  setupSwagger(app, configService);

  // Retrieve port and start listening
  const port = configService.get<number>('app.port', 4000);

  await app.listen(port);

  // Print compact startup dashboard
  const startupDashboardService = app.get(StartupDashboardService);
  await startupDashboardService.printDashboard();
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrapping exception occurred:', err);
  process.exit(1);
});

// ponytail: catch uncaught exceptions/rejections so they appear in logs before process dies
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[FATAL] Unhandled promise rejection:', reason);
});
