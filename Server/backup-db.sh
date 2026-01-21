#!/bin/bash

#############################################
# Database Backup Script
#############################################

BACKUP_DIR="/var/backups/keyauth"
DB_NAME="keyauth_db"
DB_USER="keyauth"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/keyauth_backup_$DATE.sql.gz"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Backup database
echo "Starting database backup..."
PGPASSWORD=your_password pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "keyauth_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"

# Upload to remote storage (optional)
# aws s3 cp $BACKUP_FILE s3://your-bucket/backups/
