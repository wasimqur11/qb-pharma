#!/bin/bash

# QB Pharma Backend Deployment Script for DigitalOcean
set -e

echo "🚀 Starting QB Pharma Backend Deployment..."

# Check if environment variables are set
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ Error: POSTGRES_PASSWORD environment variable is not set"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ Error: JWT_SECRET environment variable is not set"
    exit 1
fi

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t qb-pharma-api:latest .

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Pull latest changes and rebuild if needed
echo "🔄 Pulling latest PostgreSQL image..."
docker-compose pull postgres

# Start services
echo "🔄 Starting services..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 30

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose run --rm api npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
docker-compose run --rm api npx prisma generate

# Start the API service
echo "🚀 Starting API service..."
docker-compose up -d api

# Start Nginx (if configured)
if [ -f "ssl/cert.pem" ] && [ -f "ssl/key.pem" ]; then
    echo "🌐 Starting Nginx reverse proxy..."
    docker-compose up -d nginx
else
    echo "⚠️  Nginx SSL certificates not found. Skipping Nginx setup."
    echo "   You can access the API directly at: http://your-server-ip:3001"
fi

# Health check
echo "🏥 Performing health check..."
sleep 10
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    docker-compose logs api
    exit 1
fi

# Show running containers
echo "📊 Running containers:"
docker-compose ps

echo "✅ Deployment completed successfully!"
echo "🌍 API available at: http://your-server-ip:3001"
echo "🏥 Health check: http://your-server-ip:3001/health"

# Optional: Seed database with initial data
read -p "Do you want to seed the database with initial data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    docker-compose run --rm api npx prisma db seed
    echo "✅ Database seeded successfully!"
fi

echo "🎉 QB Pharma Backend is now running!"
echo ""
echo "Next steps:"
echo "1. Set up SSL certificates in the ssl/ directory"
echo "2. Configure your domain in nginx.conf"
echo "3. Update frontend environment variables to point to this API"
echo "4. Set up automated backups for the PostgreSQL database"