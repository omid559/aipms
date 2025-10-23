#!/bin/bash

# AIPMS Restore Script
# This script restores MongoDB database and uploaded files from a backup
# Usage: ./scripts/restore.sh [backup_timestamp]
# Example: ./scripts/restore.sh 20250123_143000

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_ROOT="${BACKUP_ROOT:-$PROJECT_ROOT/backups}"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
fi

# MongoDB Configuration
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/aipms}"
MONGODB_NAME=$(echo "$MONGODB_URI" | sed 's/.*\/\([^?]*\).*/\1/')

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================================"
echo "AIPMS Restore Script"
echo "================================================"
echo ""

# ============================================
# Select backup to restore
# ============================================
if [ -z "$1" ]; then
    echo "Available backups:"
    echo ""
    find "$BACKUP_ROOT" -maxdepth 1 -type d -name "20*" | sort -r | while read -r backup_dir; do
        backup_name=$(basename "$backup_dir")
        backup_date=$(date -d "${backup_name:0:8}" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "Unknown date")
        backup_size=$(du -sh "$backup_dir" | cut -f1)
        echo "  $backup_name - $backup_date - $backup_size"
    done
    echo ""
    echo "Usage: $0 [backup_timestamp]"
    echo "Example: $0 20250123_143000"
    exit 1
fi

BACKUP_TIMESTAMP="$1"
BACKUP_DIR="$BACKUP_ROOT/$BACKUP_TIMESTAMP"

if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}✗ Backup not found: $BACKUP_DIR${NC}"
    exit 1
fi

echo "Backup to restore: $BACKUP_TIMESTAMP"
echo "Backup location: $BACKUP_DIR"
echo ""

# Show metadata if available
if [ -f "$BACKUP_DIR/metadata.json" ]; then
    echo "Backup metadata:"
    cat "$BACKUP_DIR/metadata.json" | grep -E '"(date|mongodb_name|backup_type)"' | sed 's/^/  /'
    echo ""
fi

# Confirmation
echo -e "${YELLOW}⚠ WARNING: This will overwrite existing data!${NC}"
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# ============================================
# 1. Restore MongoDB
# ============================================
echo -e "${YELLOW}[1/3] Restoring MongoDB...${NC}"

if [ -d "$BACKUP_DIR/mongodb" ]; then
    if command -v mongorestore &> /dev/null; then
        # Drop existing database (optional)
        read -p "Drop existing database before restore? (yes/no): " -r
        echo ""
        if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            echo "Dropping existing database..."
            mongosh "$MONGODB_URI" --eval "db.dropDatabase()" --quiet || true
        fi

        # Restore from backup
        mongorestore --uri="$MONGODB_URI" --gzip "$BACKUP_DIR/mongodb/$MONGODB_NAME" --drop

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ MongoDB restored successfully${NC}"
        else
            echo -e "${RED}✗ MongoDB restore failed${NC}"
            exit 1
        fi
    else
        echo -e "${RED}✗ mongorestore not found${NC}"
        echo "  Install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ MongoDB backup not found in this backup${NC}"
fi

# ============================================
# 2. Restore Files
# ============================================
echo ""
echo -e "${YELLOW}[2/3] Restoring uploaded files...${NC}"

# Restore uploads
if [ -f "$BACKUP_DIR/uploads.tar.gz" ]; then
    # Backup current uploads (just in case)
    if [ -d "$PROJECT_ROOT/uploads" ]; then
        echo "Backing up current uploads..."
        mv "$PROJECT_ROOT/uploads" "$PROJECT_ROOT/uploads.backup.$(date +%s)" || true
    fi

    # Extract backup
    tar -xzf "$BACKUP_DIR/uploads.tar.gz" -C "$PROJECT_ROOT"
    echo -e "${GREEN}✓ Uploads restored${NC}"
else
    echo -e "${YELLOW}⚠ Uploads backup not found${NC}"
fi

# Restore output
if [ -f "$BACKUP_DIR/output.tar.gz" ]; then
    # Backup current output (just in case)
    if [ -d "$PROJECT_ROOT/output" ]; then
        echo "Backing up current output..."
        mv "$PROJECT_ROOT/output" "$PROJECT_ROOT/output.backup.$(date +%s)" || true
    fi

    # Extract backup
    tar -xzf "$BACKUP_DIR/output.tar.gz" -C "$PROJECT_ROOT"
    echo -e "${GREEN}✓ Output restored${NC}"
else
    echo -e "${YELLOW}⚠ Output backup not found${NC}"
fi

# ============================================
# 3. Verify Restore
# ============================================
echo ""
echo -e "${YELLOW}[3/3] Verifying restore...${NC}"

# Check MongoDB connection
if command -v mongosh &> /dev/null; then
    COLLECTION_COUNT=$(mongosh "$MONGODB_URI" --quiet --eval "db.getCollectionNames().length")
    echo "  MongoDB collections: $COLLECTION_COUNT"
fi

# Check uploads
if [ -d "$PROJECT_ROOT/uploads" ]; then
    UPLOAD_COUNT=$(find "$PROJECT_ROOT/uploads" -type f | wc -l)
    echo "  Upload files: $UPLOAD_COUNT"
fi

# Check output
if [ -d "$PROJECT_ROOT/output" ]; then
    OUTPUT_COUNT=$(find "$PROJECT_ROOT/output" -type f | wc -l)
    echo "  Output files: $OUTPUT_COUNT"
fi

# ============================================
# Summary
# ============================================
echo ""
echo "================================================"
echo "Restore Summary"
echo "================================================"
echo "Restored from: $BACKUP_TIMESTAMP"
echo ""
echo -e "${GREEN}✓ Restore completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the restored data"
echo "  2. Restart the application: npm run dev"
echo "  3. Test functionality"
echo ""

exit 0
