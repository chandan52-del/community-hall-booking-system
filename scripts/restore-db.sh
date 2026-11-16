#!/bin/bash
# ==============================================================================
# COMMUNITY HALL MANAGEMENT SYSTEM - DATABASE RESTORATION SCRIPT
# ==============================================================================
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <path_to_backup_file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="community_hall_mysql_prod"
DB_NAME="community_hall_management_v2"
DB_USER="hall_app_user"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file $BACKUP_FILE does not exist."
  exit 1
fi

ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

echo "================================================================="
echo "WARNING: This will restore database state from: $BACKUP_FILE"
echo "Target Container: $CONTAINER_NAME | Database: $DB_NAME"
echo "================================================================="
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Restoration aborted."
  exit 0
fi

echo "[Restore] Restoring database..."
gunzip < "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" mysql -u "$DB_USER" --password="$MYSQL_PASSWORD" "$DB_NAME"

echo "[Restore] Database restoration completed successfully at $(date)."
