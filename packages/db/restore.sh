#!/bin/bash
# Restore database from backup with optional point-in-time recovery
#
# Usage:
#   ./restore.sh [BACKUP_NAME] [RECOVERY_TARGET_TIME]
#
# Examples:
#   ./restore.sh                              # Restore latest backup to latest point
#   ./restore.sh LATEST                       # Restore latest backup to latest point
#   ./restore.sh LATEST "2025-01-10 14:30:00" # Restore to specific timestamp
#   ./restore.sh base_00000002 "2025-01-09 10:00:00" # Restore specific backup to timestamp

set -e

BACKUP_NAME="${1:-LATEST}"
RECOVERY_TARGET_TIME="${2:-}"

echo "==================================="
echo "Database Restore Script"
echo "==================================="
echo ""
echo "Backup: $BACKUP_NAME"
if [ -n "$RECOVERY_TARGET_TIME" ]; then
    echo "Target time: $RECOVERY_TARGET_TIME"
else
    echo "Target: Latest available point"
fi
echo ""
echo "WARNING: This will DELETE all current data!"
echo ""
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 1
fi

echo "Stopping container..."
docker compose down

echo "Removing current data..."
sudo rm -rf /data/*

echo "Adding restore configuration to .env.db..."
echo "RESTORE_FROM_BACKUP=$BACKUP_NAME" >> .env.db
if [ -n "$RECOVERY_TARGET_TIME" ]; then
    echo "RECOVERY_TARGET_TIME=$RECOVERY_TARGET_TIME" >> .env.db
fi

echo "Starting container with restore..."
docker compose up -d

echo "Monitoring restore progress..."
echo ""

# Monitor logs for restore completion
while true; do
    if docker compose logs 2>&1 | grep -q "Restore completed successfully"; then
        echo "✓ Restore completed successfully"
        break
    elif docker compose logs 2>&1 | grep -q "ERROR: Cannot restore"; then
        echo "✗ Restore failed - check logs for details"
        docker compose logs | grep ERROR
        exit 1
    elif docker compose logs 2>&1 | grep -q "WARNING: Data directory is not empty"; then
        echo "✗ Data directory not empty - restore skipped"
        exit 1
    fi
    echo -n "."
    sleep 2
done

echo ""
echo "Waiting for PostgreSQL to be ready..."

# Wait for PostgreSQL to be ready
while ! docker exec ultra_db pg_isready -U buildcloud_user > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done

echo ""
echo "✓ PostgreSQL is ready"

echo "Removing restore configuration from .env.db..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' '/RESTORE_FROM_BACKUP/d' .env.db
    sed -i '' '/RECOVERY_TARGET_TIME/d' .env.db
    sed -i '' '/RECOVERY_TARGET_XID/d' .env.db
    sed -i '' '/RECOVERY_TARGET_NAME/d' .env.db
else
    sed -i '/RESTORE_FROM_BACKUP/d' .env.db
    sed -i '/RECOVERY_TARGET_TIME/d' .env.db
    sed -i '/RECOVERY_TARGET_XID/d' .env.db
    sed -i '/RECOVERY_TARGET_NAME/d' .env.db
fi

echo ""
echo "Restore complete! Database is ready to use."
