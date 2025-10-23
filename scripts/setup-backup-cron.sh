#!/bin/bash

# Setup automated backups with cron
# This script sets up a cron job to run backups automatically

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "================================================"
echo "AIPMS Automated Backup Setup"
echo "================================================"
echo ""
echo "This script will setup a cron job for automated backups."
echo ""

# Default schedule: Daily at 2 AM
DEFAULT_SCHEDULE="0 2 * * *"

echo "Choose backup schedule:"
echo "  1) Daily at 2:00 AM (recommended)"
echo "  2) Every 6 hours"
echo "  3) Every 12 hours"
echo "  4) Weekly (Sunday at 2:00 AM)"
echo "  5) Custom cron expression"
echo ""
read -p "Enter choice (1-5): " -r choice

case $choice in
    1)
        CRON_SCHEDULE="0 2 * * *"
        SCHEDULE_DESC="Daily at 2:00 AM"
        ;;
    2)
        CRON_SCHEDULE="0 */6 * * *"
        SCHEDULE_DESC="Every 6 hours"
        ;;
    3)
        CRON_SCHEDULE="0 */12 * * *"
        SCHEDULE_DESC="Every 12 hours"
        ;;
    4)
        CRON_SCHEDULE="0 2 * * 0"
        SCHEDULE_DESC="Weekly (Sunday at 2:00 AM)"
        ;;
    5)
        echo "Enter custom cron expression (e.g., '0 2 * * *'):"
        read -r CRON_SCHEDULE
        SCHEDULE_DESC="Custom: $CRON_SCHEDULE"
        ;;
    *)
        CRON_SCHEDULE="$DEFAULT_SCHEDULE"
        SCHEDULE_DESC="Daily at 2:00 AM (default)"
        ;;
esac

echo ""
echo "Selected schedule: $SCHEDULE_DESC"
echo ""

# Create backup log directory
mkdir -p "$PROJECT_ROOT/logs"

# Cron job command
CRON_COMMAND="$CRON_SCHEDULE cd $PROJECT_ROOT && $SCRIPT_DIR/backup.sh >> $PROJECT_ROOT/logs/backup.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "backup.sh"; then
    echo "Removing existing backup cron job..."
    crontab -l 2>/dev/null | grep -v "backup.sh" | crontab - || true
fi

# Add new cron job
echo "Installing cron job..."
(crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -

echo ""
echo "✓ Cron job installed successfully!"
echo ""
echo "Backup schedule: $SCHEDULE_DESC"
echo "Log file: $PROJECT_ROOT/logs/backup.log"
echo ""
echo "To view current cron jobs:"
echo "  crontab -l"
echo ""
echo "To remove the backup cron job:"
echo "  crontab -e"
echo "  (then delete the line containing 'backup.sh')"
echo ""
echo "To run a manual backup now:"
echo "  $SCRIPT_DIR/backup.sh"
echo ""

exit 0
