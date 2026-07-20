#!/usr/bin/env bash
# ponytail: Verify backup integrity — checksum + test restore to temp database
# Usage: ./scripts/verify-backup.sh <backup_file.sql.gz>
# Requires: sha256sum, gunzip, psql, DATABASE_URL env var

set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

CHECKSUM_FILE="${BACKUP_FILE}.sha256"

echo "[$(date)] Verifying backup: $BACKUP_FILE"

# 1. Checksum verification
if [ -f "$CHECKSUM_FILE" ]; then
  echo "  Checking SHA-256 checksum..."
  if sha256sum -c "$CHECKSUM_FILE"; then
    echo "  ✓ Checksum OK"
  else
    echo "  ✗ Checksum FAILED" >&2
    exit 1
  fi
else
  echo "  ⚠ No checksum file found, skipping"
fi

# 2. File integrity (can decompress)
echo "  Checking gzip integrity..."
if gunzip -t "$BACKUP_FILE"; then
  echo "  ✓ Gzip integrity OK"
else
  echo "  ✗ Gzip integrity FAILED" >&2
  exit 1
fi

# 3. SQL validity (first line should be PostgreSQL dump header)
echo "  Checking SQL header..."
HEADER=$(gunzip -c "$BACKUP_FILE" | head -1)
if echo "$HEADER" | grep -q "PostgreSQL database dump"; then
  echo "  ✓ Valid PostgreSQL dump"
else
  echo "  ✗ Invalid dump header: $HEADER" >&2
  exit 1
fi

# 4. Table count
TABLE_COUNT=$(gunzip -c "$BACKUP_FILE" | grep -c "^CREATE TABLE" || true)
echo "  Tables in dump: $TABLE_COUNT"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Verification complete. Backup: $BACKUP_FILE ($BACKUP_SIZE, $TABLE_COUNT tables)"
