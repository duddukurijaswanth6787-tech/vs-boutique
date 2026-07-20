# Vasanthi Designers - Project Execution Guide 🚀

This file serves as the unified execution guide for starting, configuring, and testing the **Vasanthi Designers** platform. The application is organized as a monorepo containing a NestJS backend and a Next.js frontend.

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Database & Containers Setup](#2-database--containers-setup)
3. [Backend API Setup & Execution](#3-backend-api-setup--execution)
4. [Frontend App Setup & Execution](#4-frontend-app-setup--execution)
5. [Utility & Development Commands](#5-utility--development-commands)
6. [Troubleshooting Guide](#6-troubleshooting-guide)

---

## 1. Prerequisites

Make sure you have the following installed on your machine:
- **Node.js** (v20+ or v24+ recommended)
- **npm** (v10+ comes bundled with Node.js)
- **Docker & Docker Compose** (for running PostgreSQL and Redis services)

---

## 2. Database & Containers Setup

The NestJS backend requires a running PostgreSQL database and a Redis instance (used for caching and BullMQ task queues). You can boot these services instantly using Docker Compose.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Start the Docker containers in detached mode:
   ```bash
   docker-compose up -d postgres redis
   ```
   *This starts:*
   - **PostgreSQL** on port `5432`
   - **Redis** on port `6379`
3. Verify that the containers are healthy and running:
   ```bash
   docker-compose ps
   ```

To view configuration settings, see [backend/docker-compose.yml](file:///c:/Users/jashwanth/Downloads/demo_17-07/backend/docker-compose.yml).

---

## 3. Backend API Setup & Execution

The backend service is built using NestJS and Prisma ORM.

### Configuration
1. Ensure you have your environment variables defined in [backend/.env](file:///c:/Users/jashwanth/Downloads/demo_17-07/backend/.env). If you do not have it, copy the sample template:
   ```bash
   cp .env.example .env
   ```
2. Open [backend/.env](file:///c:/Users/jashwanth/Downloads/demo_17-07/backend/.env) and verify that the database credentials and ports match your Docker containers.

### Installation & Initialization
1. In the `backend` folder, install the packages:
   ```bash
   npm install
   ```
2. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```
3. Run the database migrations to set up the schema:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Seed the database with the initial system configurations and roles defined in [backend/prisma/seed.ts](file:///c:/Users/jashwanth/Downloads/demo_17-07/backend/prisma/seed.ts):
   ```bash
   npx prisma db seed
   ```

### Execution
1. Start the NestJS backend in development/watch mode:
   ```bash
   npm run start:dev
   ```
2. **Accessing the endpoints:**
   - **Swagger OpenAPI Docs:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
   - **API Version 1 Endpoint:** `http://localhost:5000/api/v1`
   - **Health Diagnosis Check:** [http://localhost:5000/health](http://localhost:5000/health) (reports database, Redis, and overall system status)

For more scripts, check [backend/package.json](file:///c:/Users/jashwanth/Downloads/demo_17-07/backend/package.json).

---

## 4. Frontend App Setup & Execution

The frontend is a modern Next.js client application.

### Configuration
1. Verify the API connection endpoints configured in [frontend/.env.local](file:///c:/Users/jashwanth/Downloads/demo_17-07/frontend/.env.local). It should point to your running backend:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
   NEXT_PUBLIC_HEALTH_URL=http://localhost:5000/health
   ```

### Installation & Execution
1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Boot the Next.js development server:
   ```bash
   npm run dev
   ```
4. **Access the application:**
   - Open your browser and navigate to [http://localhost:4000](http://localhost:4000)

For more scripts, check [frontend/package.json](file:///c:/Users/jashwanth/Downloads/demo_17-07/frontend/package.json).

---

## 5. Utility & Development Commands

Here is a quick reference table of essential scripts for both modules:

| Action / Scope | Backend Command (run in `backend/`) | Frontend Command (run in `frontend/`) |
| :--- | :--- | :--- |
| **Install Deps** | `npm install` | `npm install` |
| **Run Dev Server** | `npm run start:dev` | `npm run dev` |
| **Build Project** | `npm run build` | `npm run build` |
| **Run Unit Tests** | `npm run test` | `npm run test` |
| **Run Lint Checks** | `npm run lint` | `npm run lint` |
| **Format Code** | `npm run format` | *Auto-linted during build* |
| **Prisma Studio** | `npx prisma studio` | — |

---

## 6. Troubleshooting Guide

### ⚠️ Port Conflicts
* **Backend Port (5000):** If port `5000` is already in use, you can update the `PORT` key inside [backend/.env](file:///c:/Users/jashwanth/Downloads/demo_17-07/backend/.env) and match the frontend's env endpoints in [frontend/.env.local](file:///c:/Users/jashwanth/Downloads/demo_17-07/frontend/.env.local).
* **Database/Redis Ports:** If standard ports (`5432`, `6379`) are taken on your host machine, modify the port mappings in [backend/docker-compose.yml](file:///c:/Users/jashwanth/Downloads/demo_17-07/backend/docker-compose.yml) (e.g. change `"5432:5432"` to `"5433:5432"`).

### 🔄 Resetting the Database
If you want to clear and re-migrate the database from scratch:
```bash
cd backend
npx prisma migrate reset --force
npx prisma db seed
```

### 📦 Docker Compose Clean Up
To stop all containers and remove the volumes associated with the database and cache:
```bash
cd backend
docker-compose down -v
```
