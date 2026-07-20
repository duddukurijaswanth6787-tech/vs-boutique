# Vasanthi Designers - E-commerce Platform Foundation (Phase 0.1)

An enterprise-grade Women's Fashion E-commerce Platform backend architecture built with NestJS, Prisma ORM, PostgreSQL, Redis, and BullMQ. This repository represents the completed **Phase 0.1: Project Foundation**.

## Technical Stack

- **Framework:** NestJS (v11)
- **Language:** TypeScript (Strict Mode)
- **Database ORM:** Prisma ORM (v7)
- **Primary Database:** PostgreSQL
- **Caching & Broker:** Redis
- **Background Queues:** BullMQ
- **Documentation:** Swagger (OpenAPI 3)
- **Logger:** Pino (nestjs-pino)
- **Validation:** class-validator & class-transformer
- **Environment Schema Validation:** Joi

---

## Directory Structure

To support a highly modular, enterprise-grade architecture, the project utilizes the following layout:

```text
src/
├── common/                  # Shared utilities, decorators, types, constants
├── config/                  # Strong env validation schemas, configuration service
├── database/                # Prisma client service, connection management
├── decorators/              # Custom decorators (e.g. metadata, user contexts)
├── filters/                 # Global unified error exception handling filters
├── guards/                  # Custom route security guards
├── interceptors/            # Success response formatting & request/response logs
├── interfaces/              # Shared TS interface definitions
├── logger/                  # Pino logging configurations
├── middlewares/             # Custom express/nest middlewares
├── modules/                 # System modules
│   ├── health/              # Diagnostic health endpoints (DB, Redis, Queues, App)
│   └── redis/               # Caching connection module
├── pipes/                   # Custom validation & formatting pipes
├── queues/                  # BullMQ message queue registrations and workers
├── storage/                 # Storage adapters (e.g. local, S3 filesystems)
├── swagger/                 # OpenAPI Swagger configs
├── types/                   # Custom type definitions
├── utils/                   # Helper utilities
├── main.ts                  # Bootstrapping and orchestration entry point
```

---

## Configured Subsystems & Architectural Features

1. **Strict TypeScript & Paths:** Explicit path aliases configured in [tsconfig.json](file:///C:/Users/jashwanth/Downloads/Demo_09/tsconfig.json) (e.g., `@config/*`, `@database/*`). Full strict mode enabled.
2. **Environment Validation:** Powered by [Joi](file:///C:/Users/jashwanth/Downloads/Demo_09/src/config/env.validation.ts). Checks that database, cache, and server configuration keys are present and correctly typed.
3. **Database Layer:** Configured [Prisma ORM](file:///C:/Users/jashwanth/Downloads/Demo_09/prisma/schema.prisma) with PostgreSQL. Features a system setting model, base seeding script ([prisma/seed.ts](file:///C:/Users/jashwanth/Downloads/Demo_09/prisma/seed.ts)), and automated schema mapping.
4. **Redis and BullMQ:** Global [Redis Module](file:///C:/Users/jashwanth/Downloads/Demo_09/src/modules/redis/redis.module.ts) and [Queues Module](file:///C:/Users/jashwanth/Downloads/Demo_09/src/queues/queues.module.ts) providing task processing logic and heartbeat workers.
5. **Swagger Documentation:** Automatically exposed on `/api/docs` with Bearer token authentication schema support.
6. **Robust Validation:** Global validation pipes set to auto-transform requests and forbid unknown properties.
7. **Unified Error Filtering:** The [GlobalExceptionFilter](file:///C:/Users/jashwanth/Downloads/Demo_09/src/filters/global-exception.filter.ts) normalizes all HTTP exceptions, system failures, and Prisma database failures to a consistent format.
8. **Standardized Responses:** The [GlobalResponseInterceptor](file:///C:/Users/jashwanth/Downloads/Demo_09/src/interceptors/global-response.interceptor.ts) wraps all successful controller responses in a standard metadata envelope and handles pagination.
9. **Logger (Pino):** Configured via [LoggerModule](file:///C:/Users/jashwanth/Downloads/Demo_09/src/logger/logger.module.ts) using `nestjs-pino` and `pino-pretty` to capture request methods, routes, status codes, and execution latency.
10. **Security & Compression:** Integrates `helmet` headers, standard CORS options, and Gzip gzip/deflate `compression`.

---

## Setup & Running Guide

### Prerequisites
- Node.js (v24+)
- Docker & Docker Compose
- Local PostgreSQL and Redis (if not running via Docker)

### Installation
```bash
# Install dependencies
npm install
```

### Local Development Setup
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Adjust variables in `.env` to point to your local PostgreSQL and Redis servers.
3. Generate the Prisma Client code:
   ```bash
   npx prisma generate
   ```
4. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Run the server in watch mode:
   ```bash
   npm run start:dev
   ```

### Running with Docker Compose
1. Ensure your `.env` contains the correct PostgreSQL and Redis connection parameters (e.g. hostnames matching services `postgres` and `redis`).
2. Build and launch all services:
   ```bash
   docker-compose up --build
   ```
3. The server will be accessible at `http://localhost:3000/api/v1` and Swagger UI at `http://localhost:3000/api/docs`.

---

## Testing & Audit

```bash
# Run unit tests
npm run test

# Run ESLint validation
npm run lint

# Build the production package
npm run build
```

---

## Phase 0.1 Exclusions

Per specifications, Phase 0.1 strictly implements foundation blocks. The following domains belong to subsequent phases and are **not** present in this codebase:
- Authentication, Authorization & OTPs
- Users, Customers & Roles
- Product Catalogs & Categories
- Cart, Orders & Payments
- Shipping Integrations (DTDC/S3)
