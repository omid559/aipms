#!/bin/bash

# AIPMS Backup Script
# This script backs up MongoDB database and uploaded files
# Usage: ./scripts/backup.sh

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_ROOT="${BACKUP_ROOT:-$PROJECT_ROOT/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
fi

# MongoDB Configuration
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/aipms}"
MONGODB_NAME=$(echo "$MONGODB_URI" | sed 's/.*\/\([^?]*\).*/\1/')

# Retention policy (keep backups for N days)
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "AIPMS Backup Script"
echo "================================================"
echo "Timestamp: $TIMESTAMP"
echo "Backup Directory: $BACKUP_DIR"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

# ============================================
# 1. MongoDB Backup
# ============================================
echo -e "${YELLOW}[1/3] Backing up MongoDB...${NC}"

if command -v mongodump &> /dev/null; then
    # Use mongodump if available
    mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongodb" --gzip

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ MongoDB backup completed${NC}"

        # Get backup size
        MONGO_SIZE=$(du -sh "$BACKUP_DIR/mongodb" | cut -f1)
        echo "  Size: $MONGO_SIZE"
    else
        echo -e "${RED}✗ MongoDB backup failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ mongodump not found. Skipping MongoDB backup.${NC}"
    echo "  Install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools"
fi

# ============================================
# 2. Files Backup
# ============================================
echo ""
echo -e "${YELLOW}[2/3] Backing up uploaded files...${NC}"

# Backup uploads directory
if [ -d "$PROJECT_ROOT/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads.tar.gz" -C "$PROJECT_ROOT" uploads
    UPLOADS_SIZE=$(du -sh "$BACKUP_DIR/uploads.tar.gz" | cut -f1)
    echo -e "${GREEN}✓ Uploads backup completed${NC}"
    echo "  Size: $UPLOADS_SIZE"
else
    echo -e "${YELLOW}⚠ Uploads directory not found${NC}"
fi

# Backup output directory
if [ -d "$PROJECT_ROOT/output" ]; then
    tar -czf "$BACKUP_DIR/output.tar.gz" -C "$PROJECT_ROOT" output
    OUTPUT_SIZE=$(du -sh "$BACKUP_DIR/output.tar.gz" | cut -f1)
    echo -e "${GREEN}✓ Output backup completed${NC}"
    echo "  Size: $OUTPUT_SIZE"
else
    echo -e "${YELLOW}⚠ Output directory not found${NC}"
fi

# ============================================
# 3. Metadata
# ============================================
echo ""
echo -e "${YELLOW}[3/3] Creating backup metadata...${NC}"

# Create metadata file
cat > "$BACKUP_DIR/metadata.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$(date -Iseconds)",
  "mongodb_uri": "$MONGODB_URI",
  "mongodb_name": "$MONGODB_NAME",
  "project_version": "1.0.0",
  "backup_type": "full",
  "retention_days": $RETENTION_DAYS
}
EOF

echo -e "${GREEN}✓ Metadata created${NC}"

# ============================================
# 4. Cleanup Old Backups
# ============================================
echo ""
echo -e "${YELLOW}Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"

find "$BACKUP_ROOT" -maxdepth 1 -type d -name "20*" -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true

REMAINING_BACKUPS=$(find "$BACKUP_ROOT" -maxdepth 1 -type d -name "20*" | wc -l)
echo -e "${GREEN}✓ Cleanup completed${NC}"
echo "  Remaining backups: $REMAINING_BACKUPS"

# ============================================
# Summary
# ============================================
echo ""
echo "================================================"
echo "Backup Summary"
echo "================================================"
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "Total backup size: $TOTAL_SIZE"
echo "Backup location: $BACKUP_DIR"
echo ""
echo -e "${GREEN}✓ Backup completed successfully!${NC}"
echo ""

# Optional: Upload to cloud storage
if [ -n "$BACKUP_CLOUD_ENABLE" ] && [ "$BACKUP_CLOUD_ENABLE" = "true" ]; then
    echo -e "${YELLOW}Uploading to cloud storage...${NC}"

    # AWS S3
    if [ "$BACKUP_CLOUD_PROVIDER" = "s3" ] && command -v aws &> /dev/null; then
        aws s3 sync "$BACKUP_DIR" "s3://$BACKUP_S3_BUCKET/aipms-backups/$TIMESTAMP" --quiet
        echo -e "${GREEN}✓ Uploaded to S3${NC}"
    fi

    # Google Cloud Storage
    if [ "$BACKUP_CLOUD_PROVIDER" = "gcs" ] && command -v gsutil &> /dev/null; then
        gsutil -m rsync -r "$BACKUP_DIR" "gs://$BACKUP_GCS_BUCKET/aipms-backups/$TIMESTAMP"
        echo -e "${GREEN}✓ Uploaded to GCS${NC}"
    fi

    # Azure Blob Storage
    if [ "$BACKUP_CLOUD_PROVIDER" = "azure" ] && command -v az &> /dev/null; then
        az storage blob upload-batch --destination "$BACKUP_AZURE_CONTAINER" --source "$BACKUP_DIR" --pattern "*" --account-name "$BACKUP_AZURE_ACCOUNT"
        echo -e "${GREEN}✓ Uploaded to Azure${NC}"
    fi
fi

exit 0
