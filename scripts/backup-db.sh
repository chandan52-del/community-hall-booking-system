#!/bin/bash
# ==============================================================================
# COMMUNITY HALL MANAGEMENT SYSTEM - AUTOMATED MYSQL BACKUP SCRIPT
# ==============================================================================
set -e

BACKUP_DIR="${BACKUP_DIR:-/var/backups/community-hall-db}"
DATE_TAG=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_community_hall_${DATE_TAG}.sql.gz"
CONTAINER_NAME="community_hall_mysql_prod"
DB_NAME="community_hall_management_v2"
DB_USER="hall_app_user"

# Source environment variables if .env file exists
ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

mkdir -p "$BACKUP_DIR"

echo "[Backup] Starting backup of ${DB_NAME} at $(date)..."
docker exec "$CONTAINER_NAME" mysqldump \
  -u "$DB_USER" \
  --password="$MYSQL_PASSWORD" \
  --single-transaction \
  --quick \
  --lock-tables=false \
  "$DB_NAME" | gzip -9 > "$BACKUP_FILE"

echo "[Backup] Successfully created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Retention: Delete backups older than 14 days
echo "[Backup] Cleaning up backups older than 14 days..."
find "$BACKUP_DIR" -type f -name "backup_community_hall_*.sql.gz" -mtime +14 -delete
echo "[Backup] Routine backup completed cleanly."
