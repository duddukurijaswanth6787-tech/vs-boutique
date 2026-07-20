#!/usr/bin/env bash
# ponytail: PostgreSQL restore script — verifies checksum before restoring
# Usage: ./scripts/restore-postgres.sh <backup_file.sql.gz>
# Requires: pg_restore, gunzip, DATABASE_URL env var

set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo "Available backups:"
  ls -lh ./backups/postgres/backup_*.sql.gz 2>/dev/null || echo "  No backups found"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

CHECKSUM_FILE="${BACKUP_FILE}.sha256"

# Validate DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

# Verify checksum if available
if [ -f "$CHECKSUM_FILE" ]; then
  echo "[$(date)] Verifying checksum..."
  if ! sha256sum -c "$CHECKSUM_FILE"; then
    echo "ERROR: Checksum verification failed" >&2
    exit 1
  fi
  echo "[$(date)] Checksum OK"
else
  echo "WARNING: No checksum file found, skipping verification"
fi

echo "[$(date)] Restoring from $BACKUP_FILE..."
echo "WARNING: This will overwrite the current database. Press Ctrl+C to abort, or wait 5 seconds..."
sleep 5

gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"

echo "[$(date)] Restore complete."
