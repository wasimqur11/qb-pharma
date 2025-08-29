#!/bin/bash

# QB Pharma Backend Production Deployment Script
# Server: 209.38.78.122
set -e

echo "🚀 Starting QB Pharma Backend Production Deployment..."
echo "🌍 Server: 209.38.78.122"
echo "📅 $(date)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Don't run this script as root! Use a regular user with sudo access."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs/{api,postgres,nginx}
mkdir -p backups

# Set permissions
chmod 755 logs
chmod 755 backups

# Stop existing containers if running
print_status "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || true

# Remove old containers (optional cleanup)
print_status "Cleaning up old containers..."
docker system prune -f

# Pull latest images
print_status "Pulling latest Docker images..."
docker-compose -f docker-compose.production.yml pull postgres nginx

# Build the application
print_status "Building QB Pharma API..."
docker-compose -f docker-compose.production.yml build --no-cache api

# Start PostgreSQL first
print_status "Starting PostgreSQL database..."
docker-compose -f docker-compose.production.yml up -d postgres

# Wait for database to be ready
print_status "Waiting for database to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U qb_pharma_user -d qb_pharma_prod >/dev/null 2>&1; then
        print_success "Database is ready!"
        break
    fi
    
    print_status "Attempt $attempt/$max_attempts - Database not ready yet, waiting 3 seconds..."
    sleep 3
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    print_error "Database failed to start after $max_attempts attempts!"
    docker-compose -f docker-compose.production.yml logs postgres
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.production.yml run --rm api npx prisma migrate deploy

# Generate Prisma client
print_status "Generating Prisma client..."
docker-compose -f docker-compose.production.yml run --rm api npx prisma generate

# Start the API service
print_status "Starting API service..."
docker-compose -f docker-compose.production.yml up -d api

# Wait for API to be ready
print_status "Waiting for API to be ready..."
max_attempts=20
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        print_success "API is ready!"
        break
    fi
    
    print_status "Attempt $attempt/$max_attempts - API not ready yet, waiting 5 seconds..."
    sleep 5
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    print_error "API failed to start after $max_attempts attempts!"
    docker-compose -f docker-compose.production.yml logs api
    exit 1
fi

# Start Nginx
print_status "Starting Nginx reverse proxy..."
docker-compose -f docker-compose.production.yml up -d nginx

# Wait for Nginx to be ready
sleep 5

# Final health checks
print_status "Performing final health checks..."

# Check API health
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    print_success "✅ API health check passed!"
else
    print_error "❌ API health check failed!"
    exit 1
fi

# Check Nginx proxy
if curl -f http://localhost/health >/dev/null 2>&1; then
    print_success "✅ Nginx proxy health check passed!"
else
    print_warning "⚠️  Nginx proxy health check failed, but API is working"
fi

# Show running containers
print_status "Current running containers:"
docker-compose -f docker-compose.production.yml ps

# Show resource usage
print_status "Current resource usage:"
docker stats --no-stream

print_success "🎉 Deployment completed successfully!"
echo ""
echo "🌍 Your QB Pharma Backend is now running at:"
echo "   API: http://209.38.78.122/api/"
echo "   Health: http://209.38.78.122/health"
echo ""
echo "📊 Default login credentials:"
echo "   Super Admin: admin / admin123"
echo "   Doctor: dr.ahmed / doctor123"
echo "   Partner: wasim.partner / partner123"
echo ""

# Ask about database seeding
read -p "Do you want to seed the database with sample data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Seeding database with sample data..."
    if docker-compose -f docker-compose.production.yml run --rm api npm run db:seed; then
        print_success "✅ Database seeded successfully!"
    else
        print_warning "⚠️  Database seeding failed, but the system is running"
    fi
fi

echo ""
print_success "🚀 QB Pharma Backend is now live!"
echo ""
echo "📝 Next steps:"
echo "   1. Test the API: curl http://209.38.78.122/health"
echo "   2. Update your frontend to use: http://209.38.78.122/api/"
echo "   3. Monitor logs: docker-compose -f docker-compose.production.yml logs -f"
echo "   4. Set up automated backups (backup script provided)"
echo ""
echo "🔧 Management commands:"
echo "   Stop:    docker-compose -f docker-compose.production.yml down"
echo "   Restart: docker-compose -f docker-compose.production.yml restart"
echo "   Logs:    docker-compose -f docker-compose.production.yml logs -f [service]"
echo ""

# Create a simple management script
cat > manage.sh << 'EOF'
#!/bin/bash
# QB Pharma Management Script

case "$1" in
    start)
        docker-compose -f docker-compose.production.yml up -d
        ;;
    stop)
        docker-compose -f docker-compose.production.yml down
        ;;
    restart)
        docker-compose -f docker-compose.production.yml restart
        ;;
    logs)
        docker-compose -f docker-compose.production.yml logs -f ${2:-}
        ;;
    status)
        docker-compose -f docker-compose.production.yml ps
        ;;
    backup)
        ./backup-database.sh
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs [service]|status|backup}"
        exit 1
esac
EOF

chmod +x manage.sh
print_success "✅ Created management script: ./manage.sh"

print_success "🎉 All done! Your QB Pharma Backend is ready for production use!"