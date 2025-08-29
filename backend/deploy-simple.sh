#!/bin/bash

# QB Pharma - Simple Ubuntu Deployment (No Docker)
# Perfect for 2-4 users on Ubuntu server

set -e

echo "🚀 QB Pharma - Simple Ubuntu Deployment"
echo "🌍 Server: 209.38.78.122"
echo "💻 No Docker needed - runs directly on Ubuntu!"
echo "📅 $(date)"

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

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Don't run this script as root! Use a regular user with sudo access."
    exit 1
fi

print_status "Installing Node.js and npm..."

# Install Node.js 18 (if not already installed)
if ! command -v node &> /dev/null || [[ $(node --version | cut -d'.' -f1 | cut -d'v' -f2) -lt 18 ]]; then
    print_status "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_success "Node.js is already installed: $(node --version)"
fi

# Install npm if not available
if ! command -v npm &> /dev/null; then
    print_status "Installing npm..."
    sudo apt-get install -y npm
else
    print_success "npm is already installed: $(npm --version)"
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2 for process management..."
    sudo npm install -g pm2
else
    print_success "PM2 is already installed: $(pm2 --version)"
fi

# Install nginx for reverse proxy
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt update
    sudo apt install -y nginx
else
    print_success "Nginx is already installed"
fi

# Create directories
print_status "Creating necessary directories..."
mkdir -p data logs backups
chmod 755 data logs backups

# Set up environment for simple deployment
print_status "Setting up environment..."
cat > .env << EOF
# Simple Ubuntu Deployment Configuration
NODE_ENV=production
PORT=3001

# Database Configuration - SQLite
DATABASE_PROVIDER=sqlite
DATABASE_URL="file:./data/qb-pharma.db"

# JWT Configuration
JWT_SECRET="Kj9#mP2\$vL8@nQ4!wE7*rT6%yU3&iO1^aS5+dF0-gH2~xC9"
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=http://209.38.78.122
CORS_ORIGIN=http://209.38.78.122

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security Headers
HELMET_CROSS_ORIGIN_RESOURCE_POLICY=cross-origin

# Logging
LOG_LEVEL=info
EOF

print_success "Environment configured for SQLite"

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Run database migrations
print_status "Setting up SQLite database..."
npx prisma migrate deploy

# Build the application
print_status "Building the application..."
npm run build

# Stop existing PM2 process if running
print_status "Stopping existing QB Pharma process..."
pm2 delete qb-pharma 2>/dev/null || true

# Start the application with PM2
print_status "Starting QB Pharma API with PM2..."
pm2 start dist/index.js --name "qb-pharma" --env production

# Save PM2 configuration
pm2 save
pm2 startup | grep -E '^sudo' | bash || print_warning "PM2 startup setup needs manual run"

# Configure Nginx
print_status "Configuring Nginx reverse proxy..."
sudo tee /etc/nginx/sites-available/qb-pharma > /dev/null << 'EOF'
server {
    listen 80;
    server_name 209.38.78.122;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API routes
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'http://209.38.78.122' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'http://209.38.78.122';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
            add_header 'Access-Control-Max-Age' 86400;
            return 204;
        }
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        access_log off;
    }

    # Frontend (if deployed later)
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
}
EOF

# Enable the site
print_status "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/qb-pharma /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
if sudo nginx -t; then
    print_success "Nginx configuration is valid"
    sudo systemctl reload nginx
    sudo systemctl enable nginx
else
    print_error "Nginx configuration failed"
    exit 1
fi

# Wait for application to start
print_status "Waiting for application to start..."
sleep 5

# Health check
print_status "Performing health check..."
max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        print_success "✅ Application health check passed!"
        break
    fi
    
    print_status "Attempt $attempt/$max_attempts - waiting 3 seconds..."
    sleep 3
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    print_error "❌ Application failed to start!"
    pm2 logs qb-pharma --lines 20
    exit 1
fi

# Check external access
if curl -f http://209.38.78.122/health >/dev/null 2>&1; then
    print_success "✅ External health check passed!"
else
    print_warning "⚠️  External access might need firewall configuration"
fi

print_success "🎉 QB Pharma deployed successfully!"
echo ""
echo "🌍 Your QB Pharma Backend is running at:"
echo "   API: http://209.38.78.122/api/"
echo "   Health: http://209.38.78.122/health"
echo "   Direct API: http://209.38.78.122:3001/health"
echo ""
echo "💾 Database: SQLite file at ./data/qb-pharma.db"
echo "📊 Process Manager: PM2"
echo "🌐 Web Server: Nginx"
echo ""
echo "📋 Management Commands:"
echo "   pm2 status                    # Check application status"
echo "   pm2 logs qb-pharma           # View application logs"
echo "   pm2 restart qb-pharma        # Restart application"
echo "   pm2 stop qb-pharma           # Stop application"
echo "   pm2 start qb-pharma          # Start application"
echo "   sudo systemctl status nginx  # Check nginx status"
echo ""

# Ask about database seeding
read -p "Do you want to seed the database with sample data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Seeding database with sample data..."
    if npm run db:seed; then
        print_success "✅ Database seeded successfully!"
        echo ""
        echo "📊 Default login credentials:"
        echo "   Super Admin: admin / admin123"
        echo "   Doctor: dr.ahmed / doctor123"
        echo "   Partner: wasim.partner / partner123"
    else
        print_warning "⚠️  Database seeding failed, but the system is running"
    fi
fi

echo ""
print_success "🚀 QB Pharma is now live - No Docker needed!"
echo "💡 Much simpler deployment and maintenance!"
echo "📈 Ready to scale with the migration script when needed!"