#!/bin/bash

# QB Pharma Database Backup Script
# Server: 209.38.78.122

set -e

BACKUP_DIR="/home/$(whoami)/qb-pharma-backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="qb-pharma-backup-$DATE.sql"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
mkdir -p $BACKUP_DIR

print_status "Starting database backup..."
print_status "Backup file: $BACKUP_FILE"

# Create database backup
if docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U qb_pharma_user -d qb_pharma_prod > "$BACKUP_DIR/$BACKUP_FILE"; then
    print_success "Database backup created successfully!"
    
    # Compress the backup
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    print_success "Backup compressed: $BACKUP_FILE.gz"
    
    # Get file size
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE.gz" | cut -f1)
    print_status "Backup size: $BACKUP_SIZE"
    
    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "qb-pharma-backup-*.sql.gz" -mtime +7 -delete
    print_status "Cleaned up old backups (keeping last 7 days)"
    
    # List current backups
    print_status "Current backups:"
    ls -lah $BACKUP_DIR/qb-pharma-backup-*.sql.gz 2>/dev/null | tail -5
    
else
    print_error "Database backup failed!"
    exit 1
fi

print_success "Backup completed successfully!"
print_status "Backup location: $BACKUP_DIR/$BACKUP_FILE.gz"