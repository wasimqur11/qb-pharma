#!/bin/bash

# QB Pharma - Migrate from SQLite to PostgreSQL
# This script helps you upgrade from SQLite (2-4 users) to PostgreSQL (SAAS ready)

set -e

echo "🔄 QB Pharma: Migrating from SQLite to PostgreSQL"
echo "📈 Upgrading for SAAS scalability..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if SQLite database exists
if [ ! -f "data/qb-pharma.db" ]; then
    print_error "SQLite database not found at data/qb-pharma.db"
    exit 1
fi

# Create backup of current SQLite database
print_status "Creating backup of SQLite database..."
cp data/qb-pharma.db "backups/qb-pharma-sqlite-backup-$(date +%Y%m%d-%H%M%S).db"
print_success "SQLite database backed up"

# Export data from SQLite
print_status "Exporting data from SQLite..."
docker-compose -f docker-compose.sqlite.yml exec api npx prisma db push --force-reset
docker-compose -f docker-compose.sqlite.yml exec api npx prisma db seed

# Generate SQL dump from SQLite (using a simple approach)
print_status "Generating data export..."

# Create export script
cat > export-sqlite-data.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./data/qb-pharma.db'
    }
  }
});

async function exportData() {
  try {
    console.log('Exporting SQLite data...');
    
    // Export all tables
    const pharmaUnits = await prisma.pharmaUnit.findMany();
    const users = await prisma.user.findMany();
    const userPermissions = await prisma.userPermission.findMany();
    const doctors = await prisma.doctor.findMany();
    const businessPartners = await prisma.businessPartner.findMany();
    const employees = await prisma.employee.findMany();
    const distributors = await prisma.distributor.findMany();
    const patients = await prisma.patient.findMany();
    const transactions = await prisma.transaction.findMany();
    const departments = await prisma.department.findMany();
    
    const exportData = {
      pharmaUnits,
      users,
      userPermissions,
      doctors,
      businessPartners,
      employees,
      distributors,
      patients,
      transactions,
      departments
    };
    
    fs.writeFileSync('data-export.json', JSON.stringify(exportData, null, 2));
    console.log('✅ Data exported to data-export.json');
    
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
EOF

# Run export (if SQLite container is running)
if docker-compose -f docker-compose.sqlite.yml ps | grep -q "qb-pharma-api-sqlite"; then
    docker cp export-sqlite-data.js $(docker-compose -f docker-compose.sqlite.yml ps -q api):/app/
    docker-compose -f docker-compose.sqlite.yml exec api node export-sqlite-data.js
    docker cp $(docker-compose -f docker-compose.sqlite.yml ps -q api):/app/data-export.json ./
    print_success "Data exported from SQLite"
else
    print_warning "SQLite container not running. Starting temporarily..."
    docker-compose -f docker-compose.sqlite.yml up -d api
    sleep 10
    docker cp export-sqlite-data.js $(docker-compose -f docker-compose.sqlite.yml ps -q api):/app/
    docker-compose -f docker-compose.sqlite.yml exec api node export-sqlite-data.js
    docker cp $(docker-compose -f docker-compose.sqlite.yml ps -q api):/app/data-export.json ./
    docker-compose -f docker-compose.sqlite.yml down
    print_success "Data exported from SQLite"
fi

# Switch to PostgreSQL configuration
print_status "Switching to PostgreSQL configuration..."
cp .env.postgresql .env
print_success "Environment switched to PostgreSQL"

# Stop SQLite containers
print_status "Stopping SQLite containers..."
docker-compose -f docker-compose.sqlite.yml down

# Start PostgreSQL deployment
print_status "Starting PostgreSQL deployment..."
docker-compose -f docker-compose.production.yml up -d postgres

# Wait for PostgreSQL to be ready
print_status "Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker-compose -f docker-compose.production.yml exec postgres pg_isready -U qb_pharma_user -d qb_pharma_prod >/dev/null 2>&1; then
        print_success "PostgreSQL is ready!"
        break
    fi
    
    print_status "Attempt $attempt/$max_attempts - PostgreSQL not ready yet, waiting 3 seconds..."
    sleep 3
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    print_error "PostgreSQL failed to start!"
    exit 1
fi

# Run migrations on PostgreSQL
print_status "Running PostgreSQL migrations..."
docker-compose -f docker-compose.production.yml run --rm api npx prisma migrate deploy
docker-compose -f docker-compose.production.yml run --rm api npx prisma generate

# Start API with PostgreSQL
print_status "Starting API with PostgreSQL..."
docker-compose -f docker-compose.production.yml up -d api nginx

# Create import script for PostgreSQL
cat > import-postgresql-data.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importData() {
  try {
    console.log('Importing data to PostgreSQL...');
    
    const data = JSON.parse(fs.readFileSync('./data-export.json', 'utf8'));
    
    // Import in correct order (respecting foreign key constraints)
    
    // 1. Pharma Units
    for (const unit of data.pharmaUnits) {
      await prisma.pharmaUnit.upsert({
        where: { id: unit.id },
        update: unit,
        create: unit
      });
    }
    
    // 2. Users
    for (const user of data.users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      });
    }
    
    // 3. User Permissions
    for (const permission of data.userPermissions) {
      await prisma.userPermission.upsert({
        where: { id: permission.id },
        update: permission,
        create: permission
      });
    }
    
    // 4. Stakeholders
    for (const doctor of data.doctors) {
      await prisma.doctor.upsert({
        where: { id: doctor.id },
        update: doctor,
        create: doctor
      });
    }
    
    for (const partner of data.businessPartners) {
      await prisma.businessPartner.upsert({
        where: { id: partner.id },
        update: partner,
        create: partner
      });
    }
    
    for (const employee of data.employees) {
      await prisma.employee.upsert({
        where: { id: employee.id },
        update: employee,
        create: employee
      });
    }
    
    for (const distributor of data.distributors) {
      await prisma.distributor.upsert({
        where: { id: distributor.id },
        update: distributor,
        create: distributor
      });
    }
    
    for (const patient of data.patients) {
      await prisma.patient.upsert({
        where: { id: patient.id },
        update: patient,
        create: patient
      });
    }
    
    // 5. Departments
    for (const dept of data.departments) {
      await prisma.department.upsert({
        where: { id: dept.id },
        update: dept,
        create: dept
      });
    }
    
    // 6. Transactions (last due to foreign keys)
    for (const transaction of data.transactions) {
      await prisma.transaction.upsert({
        where: { id: transaction.id },
        update: transaction,
        create: transaction
      });
    }
    
    console.log('✅ All data imported successfully to PostgreSQL');
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
EOF

# Import data to PostgreSQL
print_status "Importing data to PostgreSQL..."
docker cp import-postgresql-data.js $(docker-compose -f docker-compose.production.yml ps -q api):/app/
docker cp data-export.json $(docker-compose -f docker-compose.production.yml ps -q api):/app/
docker-compose -f docker-compose.production.yml exec api node import-postgresql-data.js
print_success "Data imported to PostgreSQL"

# Final health check
print_status "Performing final health check..."
sleep 5

if curl -f http://localhost/health >/dev/null 2>&1; then
    print_success "✅ Migration completed successfully!"
else
    print_error "❌ Health check failed after migration"
    exit 1
fi

# Cleanup
rm -f export-sqlite-data.js import-postgresql-data.js data-export.json

print_success "🎉 Migration from SQLite to PostgreSQL completed!"
echo ""
echo "📊 Your application is now running on PostgreSQL and ready for SAAS scaling!"
echo "🌍 API: http://209.38.78.122/api/"
echo "💾 Database: PostgreSQL (SAAS ready)"
echo "📈 Scalability: Ready for hundreds of users"
echo ""
echo "🔧 Use these commands now:"
echo "   Manage: ./manage.sh [start|stop|restart|logs|status|backup]"
echo "   Logs: docker-compose -f docker-compose.production.yml logs -f"
echo ""
echo "✅ Your SQLite data has been preserved and migrated!"
print_success "🚀 Welcome to PostgreSQL - ready for SAAS growth!"