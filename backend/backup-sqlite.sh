#!/bin/bash

# QB Pharma SQLite Database Backup Script
# Server: 209.38.78.122

set -e

BACKUP_DIR="/home/$(whoami)/qb-pharma-backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="qb-pharma-sqlite-backup-$DATE.db"

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

print_status "Starting SQLite database backup..."
print_status "Backup file: $BACKUP_FILE"

# Check if SQLite database exists
if [ ! -f "data/qb-pharma.db" ]; then
    print_error "SQLite database not found at data/qb-pharma.db"
    exit 1
fi

# Create database backup (SQLite is just a file, so we copy it)
if cp "data/qb-pharma.db" "$BACKUP_DIR/$BACKUP_FILE"; then
    print_success "Database backup created successfully!"
    
    # Compress the backup
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    print_success "Backup compressed: $BACKUP_FILE.gz"
    
    # Get file size
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE.gz" | cut -f1)
    print_status "Backup size: $BACKUP_SIZE"
    
    # Keep only last 14 days of backups (SQLite backups are small)
    find $BACKUP_DIR -name "qb-pharma-sqlite-backup-*.db.gz" -mtime +14 -delete
    print_status "Cleaned up old backups (keeping last 14 days)"
    
    # List current backups
    print_status "Current SQLite backups:"
    ls -lah $BACKUP_DIR/qb-pharma-sqlite-backup-*.db.gz 2>/dev/null | tail -5
    
    # Also create a JSON export for extra safety
    if docker-compose -f docker-compose.sqlite.yml ps | grep -q "qb-pharma-api-sqlite"; then
        print_status "Creating JSON export for extra safety..."
        
        # Create export script
        cat > /tmp/export-backup.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  try {
    const data = {
      pharmaUnits: await prisma.pharmaUnit.findMany(),
      users: await prisma.user.findMany(),
      userPermissions: await prisma.userPermission.findMany(),
      doctors: await prisma.doctor.findMany(),
      businessPartners: await prisma.businessPartner.findMany(),
      employees: await prisma.employee.findMany(),
      distributors: await prisma.distributor.findMany(),
      patients: await prisma.patient.findMany(),
      transactions: await prisma.transaction.findMany(),
      departments: await prisma.department.findMany()
    };
    
    fs.writeFileSync('./backup-export.json', JSON.stringify(data, null, 2));
    console.log('JSON export created');
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
EOF
        
        # Run export
        docker cp /tmp/export-backup.js $(docker-compose -f docker-compose.sqlite.yml ps -q api):/app/
        docker-compose -f docker-compose.sqlite.yml exec api node export-backup.js
        docker cp $(docker-compose -f docker-compose.sqlite.yml ps -q api):/app/backup-export.json "$BACKUP_DIR/qb-pharma-json-backup-$DATE.json"
        gzip "$BACKUP_DIR/qb-pharma-json-backup-$DATE.json"
        
        # Clean up
        rm -f /tmp/export-backup.js
        docker-compose -f docker-compose.sqlite.yml exec api rm -f export-backup.js backup-export.json
        
        print_success "JSON export backup also created"
    fi
    
else
    print_error "Database backup failed!"
    exit 1
fi

print_success "Backup completed successfully!"
print_status "SQLite backup location: $BACKUP_DIR/$BACKUP_FILE.gz"
print_status "💾 SQLite backups are fast and small (usually < 1MB)"
print_status "🔄 To restore: Stop container, replace data/qb-pharma.db, restart"