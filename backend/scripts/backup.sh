#!/bin/bash
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/cartunez_$TIMESTAMP.sql.gz"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."

# Backup PostgreSQL
docker compose exec -T postgres pg_dump -U cartunez_admin -d cartunez | gzip > "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE"

# Remove backups older than retention period
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "cartunez_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed successfully!"
echo "Current backups:"
ls -lh "$BACKUP_DIR"/cartunez_*.sql.gz 2>/dev/null || echo "No backups found"
