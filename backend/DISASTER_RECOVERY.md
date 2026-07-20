# Disaster Recovery Guide

## Recovery Objectives

| Metric | Target |
|---|---|
| **RTO** (Recovery Time Objective) | < 1 hour |
| **RPO** (Recovery Point Objective) | < 24 hours (last daily backup) |

## Scenario 1: Database Recovery

### Corrupted Database
```bash
# 1. Stop application
docker compose -f docker-compose.prod.yml stop app

# 2. Verify latest backup
./scripts/verify-backup.sh ./backups/postgres/backup_LATEST.sql.gz

# 3. Restore
./scripts/restore-postgres.sh ./backups/postgres/backup_LATEST.sql.gz

# 4. Run migrations if needed
npm run prisma:deploy

# 5. Restart
docker compose -f docker-compose.prod.yml start app

# 6. Verify
curl /health
```

### Lost Database Server
1. Provision new PostgreSQL instance
2. Update `DATABASE_URL` env var
3. Run `npm run prisma:deploy` to create schema
4. Restore from latest backup: `./scripts/restore-postgres.sh <backup>`
5. Restart application

## Scenario 2: Redis Recovery

Redis is used for caching only (not persistence). Application degrades gracefully when Redis is down.

```bash
# 1. Restart Redis
docker compose -f docker-compose.prod.yml restart redis

# 2. Verify
redis-cli -a $REDIS_PASSWORD ping

# 3. Cache rebuilds automatically on next requests
```

If Redis data is corrupted:
```bash
# Flush and let cache rebuild
redis-cli -a $REDIS_PASSWORD FLUSHALL
```

## Scenario 3: Storage Recovery (S3)

Files are stored in S3. Recovery = ensure S3 bucket exists and credentials are valid.

```bash
# Verify S3 access
aws s3 ls s3://$AWS_S3_BUCKET/

# If bucket was deleted, restore from S3 versioning (if enabled)
aws s3api list-object-versions --bucket $AWS_S3_BUCKET
```

If using local storage:
```bash
# Backup local storage
tar -czf storage-backup.tar.gz ./storage/

# Restore
tar -xzf storage-backup.tar.gz
```

## Scenario 4: Queue Recovery

Failed jobs are retained in BullMQ (`removeOnFail: false`).

```bash
# View failed jobs
curl -H "Authorization: Bearer <admin-token>" /admin/queues/failed

# Retry all failed jobs
curl -X POST -H "Authorization: Bearer <admin-token>" /admin/queues/retry

# Replay from DLQ (if DLQ implemented)
curl -X POST -H "Authorization: Bearer <admin-token>" /admin/queues/replay
```

## Scenario 5: Lost Server

### Full Recovery Steps
1. Provision new server with Docker
2. Clone repository
3. Set all environment variables (from secrets manager or `.env`)
4. Start database: `docker compose -f docker-compose.prod.yml up -d postgres redis`
5. Run migrations: `npm run prisma:deploy`
6. Restore database: `./scripts/restore-postgres.sh <latest-backup>`
7. Start application: `docker compose -f docker-compose.prod.yml up -d app`
8. Verify: `curl /health`

### Required Secrets
- `DATABASE_URL`
- `JWT_SECRET`
- `REDIS_PASSWORD`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`
- `CORS_ORIGIN`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (if payments enabled)

## Scenario 6: Corrupted Backup

If the latest backup is corrupted:
1. Try the previous backup: `ls -lt ./backups/postgres/`
2. Verify each: `./scripts/verify-backup.sh <backup>`
3. Restore the most recent valid backup
4. **Data loss**: up to 24 hours (time since last valid backup)

### Prevention
- Verify backups weekly: `./scripts/verify-backup.sh <latest>`
- Test restore quarterly to a staging database
- Monitor backup script exit codes

## Backup Verification Schedule

| Frequency | Action |
|---|---|
| Daily | Automated backup (2 AM) |
| Weekly | Verify latest backup checksum |
| Monthly | Test restore to staging database |
| Quarterly | Full disaster recovery drill |
