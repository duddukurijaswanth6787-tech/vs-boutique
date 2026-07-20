# Vasanthi Designers - Enterprise E-commerce Workspace

An enterprise-grade Women's Fashion E-commerce Platform workspace. 

This repository contains the full monorepo layout, separated into clean, modular directory blocks.

---

## Workspace Layout

- **[backend/](file:///c:/Users/jashwanth/Downloads/demo_17-07/backend)**: NestJS TypeScript API service (configured with PostgreSQL, Redis, BullMQ, and Swagger).
- **[frontend/](file:///c:/Users/jashwanth/Downloads/demo_17-07/frontend)**: Next.js Client layout application.
- **[docs/](file:///c:/Users/jashwanth/Downloads/demo_17-07/docs)**: System architectural diagrams, API manuals, and business flow specifications.
- **[database/](file:///c:/Users/jashwanth/Downloads/demo_17-07/database)**: PostgreSQL schemas, SQL migrations, backups, and query optimization scripts.
- **[postman/](file:///c:/Users/jashwanth/Downloads/demo_17-07/postman)**: Exported Postman collections and environment files for rapid API testing.
- **[design/](file:///c:/Users/jashwanth/Downloads/demo_17-07/design)**: UX/UI mockups, design systems specifications, visual asset bundles, and layout designs.
- **[scripts/](file:///c:/Users/jashwanth/Downloads/demo_17-07/scripts)**: DevOps automation scripts, Docker management commands, and database backup schedulers.

---

## Guides & Documentation

- **[run.md](file:///c:/Users/jashwanth/Downloads/demo_17-07/run.md)**: Unified Project Execution and Setup Guide.
- **[data.md](file:///c:/Users/jashwanth/Downloads/demo_17-07/data.md)**: Comprehensive summary of all completed features, tasks, and database migrations.

---

## Getting Started

### Database & Containers
Launch the PostgreSQL and Redis containers:
```bash
cd backend
docker-compose up -d postgres redis
```

### Backend APIs
To run the backend server in development mode:
```bash
cd backend
npm run start:dev
```
Access the Swagger documentation at `http://localhost:5000/api/docs`.

### Frontend Application
To run the frontend Next.js server:
```bash
cd frontend
npm run dev
```
Access the application at `http://localhost:4000`.
