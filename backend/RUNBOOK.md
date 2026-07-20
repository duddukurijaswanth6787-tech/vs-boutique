# Operations Runbook

## Deployment

### Backend
```bash
# Build
npm run build

# Run migrations
npm run prisma:deploy

# Start
npm run start:prod
```

### Docker
```bash
# Development
docker compose up -d

# Production
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f app
```

### Frontend
```bash
npm run build
npm run start
```

## Rollback

1. Stop the current version
2. Checkout the previous version: `git checkout <previous-tag>`
3. Build: `npm run build`
4. Restore database if migrations were applied: `./scripts/restore-postgres.sh <backup>`
5. Start: `npm run start:prod`
6. Verify: `curl /health`

## Restart

```bash
# Docker
docker compose -f docker-compose.prod.yml restart app

# Direct
kill -SIGTERM $(pgrep -f "node dist/src/main")
npm run start:prod
```

## Scaling

- **Horizontal**: Run multiple app instances behind a load balancer. Ensure `JWT_SECRET` is identical across instances.
- **Vertical**: Adjust Docker resource limits in `docker-compose.prod.yml`.
- **Database**: Increase `max` connections in `PrismaService` (currently 20).

## Queue Recovery

### View failed jobs
```bash
curl -H "Authorization: Bearer <admin-token>" /admin/queues/failed
```

### Retry failed jobs
```bash
curl -X POST -H "Authorization: Bearer <admin-token>" /admin/queues/retry
```

### Replay from DLQ
```bash
curl -X POST -H "Authorization: Bearer <admin-token>" /admin/queues/replay
```

## Backup

```bash
./scripts/backup-postgres.sh
```

See [BACKUP.md](./BACKUP.md) for full procedures.

## Restore

```bash
./scripts/restore-postgres.sh ./backups/postgres/backup_YYYYMMDD_HHMMSS.sql.gz
```

## Incident Response

### Application Down
1. Check logs: `docker compose logs app --tail=100`
2. Check health: `curl /health`
3. Check database: `psql $DATABASE_URL -c "SELECT 1"`
4. Check Redis: `redis-cli -a $REDIS_PASSWORD ping`
5. Restart if needed: `docker compose restart app`

### Database Down
1. Check PostgreSQL status: `docker compose ps postgres`
2. Check logs: `docker compose logs postgres --tail=50`
3. Check disk space: `df -h`
4. Restart: `docker compose restart postgres`
5. If corrupted: restore from backup (see [BACKUP.md](./BACKUP.md))

### Redis Down
1. Check Redis status: `docker compose ps redis`
2. Check logs: `docker compose logs redis --tail=50`
3. Restart: `docker compose restart redis`
4. Application continues without cache (graceful degradation)

### High Memory
1. Check metrics: `curl -H "Authorization: Bearer <token>" /health/metrics`
2. Check queue depth: `curl -H "Authorization: Bearer <token>" /admin/queues`
3. Restart if memory leak suspected

## Monitoring

### Health Endpoints
- `GET /health` — comprehensive (DB, Redis, queue, storage, RAG)
- `GET /health/live` — liveness (Kubernetes)
- `GET /health/ready` — readiness (DB + Redis)
- `GET /health/metrics` — application metrics (admin only)

### Key Metrics
- Response time (avg, p95, p99)
- Error rate
- Queue depth and failure rate
- Cache hit ratio
- Database connection pool usage

## Secret Rotation

### JWT Secret
1. Generate new secret: `openssl rand -base64 48`
2. Update `JWT_SECRET` env var
3. Restart application
4. **All existing tokens become invalid** — users must re-login

### Redis Password
1. Update Redis config with new password
2. Update `REDIS_PASSWORD` env var
3. Restart application and Redis

### Database Password
1. Update PostgreSQL password
2. Update `DATABASE_URL` env var
3. Restart application
