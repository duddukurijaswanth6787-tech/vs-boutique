#!/bin/bash
# Database backup script for Vasanthy Designers
# Usage: ./scripts/backup.sh

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    gzip "$BACKUP_FILE"
    echo "Backup completed: ${BACKUP_FILE}.gz"
    
    # Keep only last 7 backups
    ls -t "$BACKUP_DIR"/backup_*.sql.gz | tail -n +8 | xargs -r rm
    echo "Old backups cleaned up."
else
    echo "Backup failed!"
    exit 1
fi
