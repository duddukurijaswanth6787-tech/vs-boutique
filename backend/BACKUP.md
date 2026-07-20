# Backup & Restore Guide

## Overview

PostgreSQL backups using `pg_dump` with gzip compression, SHA-256 checksums, and automatic retention cleanup.

## Quick Reference

```bash
# Create backup
./scripts/backup-postgres.sh

# Verify backup
./scripts/verify-backup.sh ./backups/postgres/backup_20260718_120000.sql.gz

# Restore backup
./scripts/restore-postgres.sh ./backups/postgres/backup_20260718_120000.sql.gz
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | (required) | PostgreSQL connection string |
| `BACKUP_DIR` | `./backups/postgres` | Backup output directory |
| `BACKUP_RETENTION_DAYS` | `30` | Days to keep backups |

## Automatic Backup (Docker)

The `docker-compose.prod.yml` includes a backup service that runs daily at 2 AM:

```bash
docker compose -f docker-compose.prod.yml up backup
```

## Manual Backup

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/db"
./scripts/backup-postgres.sh
```

Output: `./backups/postgres/backup_YYYYMMDD_HHMMSS.sql.gz` + `.sha256`

## Verify Backup

```bash
./scripts/verify-backup.sh ./backups/postgres/backup_YYYYMMDD_HHMMSS.sql.gz
```

Checks: SHA-256 checksum, gzip integrity, PostgreSQL dump header, table count.

## Restore

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/db"
./scripts/restore-postgres.sh ./backups/postgres/backup_YYYYMMDD_HHMMSS.sql.gz
```

**Warning:** This overwrites the current database. The script waits 5 seconds before proceeding.

## Retention Policy

Backups older than `BACKUP_RETENTION_DAYS` (default 30) are automatically deleted during the next backup run.

## Disaster Recovery

See [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) for full recovery procedures.

### Quick Recovery Steps

1. Stop the application
2. Verify backup integrity: `./scripts/verify-backup.sh <backup>`
3. Restore: `./scripts/restore-postgres.sh <backup>`
4. Run migrations if schema changed: `npm run prisma:deploy`
5. Restart the application
6. Verify health: `curl /health`
