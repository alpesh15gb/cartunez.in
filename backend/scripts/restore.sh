#!/bin/bash
set -e

BACKUP_DIR="./backups"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "No backups directory found."
    exit 1
fi

echo "Available backups:"
ls -lh "$BACKUP_DIR"/cartunez_*.sql.gz 2>/dev/null || { echo "No backups found."; exit 1; }

if [ -n "$1" ]; then
    BACKUP_FILE="$BACKUP_DIR/$1"
else
    echo ""
    read -p "Enter backup filename (from list above): " BACKUP_FILE
    BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Restoring from: $BACKUP_FILE"
read -p "This will overwrite the current database. Continue? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Restore cancelled."
    exit 0
fi

gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U cartunez_admin -d cartunez

echo "Database restored successfully from $BACKUP_FILE"
