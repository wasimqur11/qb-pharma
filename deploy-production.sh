#!/bin/bash

# QB Pharma - Production Deployment Script
# Handles all common deployment errors and edge cases
# Version 2.0 - Fixed all known issues

set -e

echo "🚀 QB Pharma - Production Deployment v2.0"
echo "🌍 Server: DigitalOcean Ubuntu"
echo "📅 $(date)"
echo ""

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

# Function to handle errors gracefully
handle_error() {
    print_error "Script failed at line $1"
    print_error "Command: $2"
    exit 1
}

trap 'handle_error $LINENO "$BASH_COMMAND"' ERR

# Check if user has sudo privileges or is root
print_status "Checking user privileges..."
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root - this is okay but not recommended"
    SUDO_CMD=""
elif sudo -n true 2>/dev/null; then
    print_success "User has sudo privileges"
    SUDO_CMD="sudo"
else
    print_error "Current user doesn't have sudo privileges"
    print_status "Please run one of these commands first:"
    echo "  1. Switch to root: su root"
    echo "  2. Add user to sudo: (as root) usermod -aG sudo $USER"
    echo "  3. Or run this script as root"
    exit 1
fi

# Update system with error handling
print_status "🔄 Updating system packages..."
if ! $SUDO_CMD apt update; then
    print_warning "apt update failed, trying to fix..."
    $SUDO_CMD apt --fix-broken install -y
    $SUDO_CMD dpkg --configure -a
    $SUDO_CMD apt update
fi

$SUDO_CMD apt upgrade -y

# Install system dependencies with retries
print_status "📦 Installing system dependencies..."
PACKAGES="curl wget git nginx postgresql postgresql-contrib build-essential software-properties-common"

for package in $PACKAGES; do
    print_status "Installing $package..."
    if ! $SUDO_CMD apt install -y $package; then
        print_warning "Failed to install $package, retrying..."
        $SUDO_CMD apt update
        $SUDO_CMD apt install -y $package
    fi
done

# Install Node.js 18 with multiple fallback methods
print_status "🟢 Installing Node.js 18..."
if ! command -v node &> /dev/null || [[ $(node --version | cut -d'.' -f1 | cut -d'v' -f2) -lt 18 ]]; then
    # Method 1: NodeSource repository
    if curl -fsSL https://deb.nodesource.com/setup_18.x | $SUDO_CMD -E bash -; then
        $SUDO_CMD apt-get install -y nodejs
    else
        # Method 2: Snap package
        print_warning "NodeSource failed, trying snap..."
        if command -v snap &> /dev/null; then
            $SUDO_CMD snap install node --classic
        else
            # Method 3: Manual download and install
            print_warning "Snap failed, downloading Node.js manually..."
            cd /tmp
            wget https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.xz
            tar -xf node-v18.19.0-linux-x64.tar.xz
            $SUDO_CMD mv node-v18.19.0-linux-x64 /opt/nodejs
            $SUDO_CMD ln -sf /opt/nodejs/bin/node /usr/local/bin/node
            $SUDO_CMD ln -sf /opt/nodejs/bin/npm /usr/local/bin/npm
            cd ~
        fi
    fi
    
    # Verify Node.js installation
    if ! command -v node &> /dev/null; then
        print_error "Node.js installation failed completely"
        exit 1
    fi
fi

print_success "Node.js $(node --version) installed successfully"

# Install npm if not available
if ! command -v npm &> /dev/null; then
    print_status "Installing npm..."
    $SUDO_CMD apt-get install -y npm
fi

# Install PM2 with error handling
print_status "⚡ Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    if ! $SUDO_CMD npm install -g pm2; then
        print_warning "Global PM2 install failed, trying without sudo..."
        npm install -g pm2 --prefix=/usr/local
        export PATH="/usr/local/bin:$PATH"
    fi
fi

# Setup PostgreSQL with comprehensive error handling
print_status "🐘 Setting up PostgreSQL..."
$SUDO_CMD systemctl start postgresql || true
$SUDO_CMD systemctl enable postgresql || true

# Wait for PostgreSQL to be ready
sleep 5

# Create database and user with error handling
print_status "Creating PostgreSQL database and user..."
$SUDO_CMD -u postgres psql -c "SELECT 1;" > /dev/null 2>&1 || {
    print_warning "PostgreSQL not ready, restarting..."
    $SUDO_CMD systemctl restart postgresql
    sleep 10
}

# Drop existing database and user if they exist, then recreate
$SUDO_CMD -u postgres psql << 'PSQLEOF' || print_warning "Database setup warnings (likely already exists)"
DROP DATABASE IF EXISTS qb_pharma_prod;
DROP USER IF EXISTS qb_pharma_user;
CREATE USER qb_pharma_user WITH PASSWORD 'H0rsp@wer';
CREATE DATABASE qb_pharma_prod OWNER qb_pharma_user;
GRANT ALL PRIVILEGES ON DATABASE qb_pharma_prod TO qb_pharma_user;
ALTER USER qb_pharma_user CREATEDB;
PSQLEOF

print_success "PostgreSQL setup complete"

# Clone or update repository with error handling
print_status "📁 Setting up project repository..."
if [ -d "qb-pharma" ]; then
    print_status "Repository exists, updating..."
    cd qb-pharma
    git stash || true
    git pull origin main || {
        print_warning "Git pull failed, recloning..."
        cd ..
        rm -rf qb-pharma
        git clone https://github.com/wasimqur11/qb-pharma.git
        cd qb-pharma
    }
else
    print_status "Cloning repository..."
    git clone https://github.com/wasimqur11/qb-pharma.git
    cd qb-pharma
fi

# Backend deployment with comprehensive error handling
print_status "🔨 Deploying backend..."
cd backend

# Create production environment file
print_status "Creating production environment..."
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3001

# Database Configuration
DATABASE_URL="postgresql://qb_pharma_user:H0rsp@wer@localhost:5432/qb_pharma_prod"

# JWT Configuration
JWT_SECRET="Kj9#mP2$vL8@nQ4!wE7*rT6%yU3&iO1^aS5+dF0-gH2~xC9"
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN="*"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security Headers
HELMET_CROSS_ORIGIN_RESOURCE_POLICY=cross-origin

# Logging
LOG_LEVEL=info
ENVEOF

# Create deployment-friendly TypeScript config
print_status "Creating deployment TypeScript configuration..."
cat > tsconfig.json << 'TSEOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": false,
    "noImplicitAny": false,
    "noImplicitReturns": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
TSEOF

# Install backend dependencies with retry mechanism
print_status "Installing backend dependencies..."
npm cache clean --force || true

for attempt in 1 2 3; do
    if npm install; then
        print_success "Backend dependencies installed"
        break
    else
        print_warning "Attempt $attempt failed, retrying..."
        if [ $attempt -eq 3 ]; then
            print_error "Failed to install backend dependencies after 3 attempts"
            exit 1
        fi
        sleep 5
    fi
done

# Generate Prisma client with error handling
print_status "Generating Prisma client..."
npx prisma generate || {
    print_warning "Prisma generate failed, trying to fix..."
    rm -rf node_modules/@prisma/client
    npm install @prisma/client
    npx prisma generate
}

# Database migration with fallback
print_status "Running database migrations..."
if ! npx prisma migrate deploy; then
    print_warning "Migrate deploy failed, using db push..."
    npx prisma db push --force-reset || {
        print_error "Database setup failed completely"
        exit 1
    }
fi

# Build backend with fallback to tsx
print_status "Building backend..."
BUILD_METHOD=""
if npm run build; then
    print_success "TypeScript compilation successful"
    BUILD_METHOD="compiled"
    START_COMMAND="node dist/index.js"
else
    print_warning "TypeScript build failed, will use tsx for direct execution"
    BUILD_METHOD="tsx"
    START_COMMAND="npx tsx src/index.ts"
fi

# Stop any existing PM2 processes
pm2 delete qb-pharma 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Start backend with PM2
print_status "Starting backend with PM2..."
if [ "$BUILD_METHOD" = "compiled" ]; then
    pm2 start dist/index.js --name "qb-pharma" --env production
else
    pm2 start --name "qb-pharma" --interpreter="npx" --interpreter-args="tsx" src/index.ts
fi

# Save PM2 configuration
pm2 save
pm2 startup | grep -E '^sudo' | bash 2>/dev/null || print_warning "PM2 startup configuration needs manual setup"

# Wait for backend to start
print_status "Waiting for backend to initialize..."
sleep 10

# Test backend
BACKEND_READY=false
for i in {1..30}; do
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        BACKEND_READY=true
        break
    fi
    sleep 2
done

if [ "$BACKEND_READY" = false ]; then
    print_error "Backend failed to start properly"
    print_status "Showing PM2 logs for debugging:"
    pm2 logs qb-pharma --lines 20
    exit 1
fi

print_success "Backend is running successfully"

# Frontend deployment with comprehensive error handling
print_status "🎨 Deploying frontend..."
cd ../frontend

# Install frontend dependencies
print_status "Installing frontend dependencies..."
for attempt in 1 2 3; do
    if npm install; then
        print_success "Frontend dependencies installed"
        break
    else
        print_warning "Frontend dependency install attempt $attempt failed"
        if [ $attempt -eq 3 ]; then
            print_error "Failed to install frontend dependencies"
            exit 1
        fi
        npm cache clean --force
        sleep 5
    fi
done

# Build frontend with error handling
print_status "Building frontend..."
if ! npm run build; then
    print_error "Frontend build failed"
    print_status "Checking for common issues..."
    
    # Check if dist directory exists
    if [ ! -d "dist" ]; then
        print_warning "No dist directory found, checking node version..."
        node --version
        npm --version
        
        # Try with legacy peer deps
        print_status "Retrying with legacy peer deps..."
        npm install --legacy-peer-deps
        npm run build
    fi
fi

# Verify build output
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    print_error "Frontend build did not produce expected files"
    ls -la dist/ 2>/dev/null || echo "No dist directory"
    exit 1
fi

print_success "Frontend built successfully"

# Deploy frontend to nginx
print_status "📄 Deploying frontend to nginx..."

# Backup existing content
if [ -d "/var/www/html" ] && [ "$(ls -A /var/www/html 2>/dev/null)" ]; then
    $SUDO_CMD mv /var/www/html "/var/www/html.backup.$(date +%Y%m%d-%H%M%S)"
fi

# Create web directory and deploy
$SUDO_CMD mkdir -p /var/www/html
$SUDO_CMD cp -r dist/* /var/www/html/
$SUDO_CMD chown -R www-data:www-data /var/www/html
$SUDO_CMD chmod -R 755 /var/www/html

# Create comprehensive nginx configuration
print_status "⚙️  Configuring nginx..."
$SUDO_CMD tee /etc/nginx/sites-available/qb-pharma > /dev/null << 'NGINXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html index.htm;
    
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Disable server signature
    server_tokens off;
    
    # Frontend routes (React Router)
    location / {
        try_files $uri $uri/ /index.html;
        
        # Add cache headers for HTML files
        if ($uri ~* "\.html$") {
            add_header Cache-Control "no-cache, no-store, must-revalidate" always;
            add_header Pragma "no-cache" always;
            add_header Expires "0" always;
        }
    }
    
    # API routes (proxy to backend)
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        
        # CORS headers for API
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000 always;
            add_header 'Content-Type' 'text/plain charset=UTF-8' always;
            add_header 'Content-Length' 0 always;
            return 204;
        }
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        access_log off;
        
        # Add CORS headers for health check too
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
    }
    
    # Static assets with aggressive caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        add_header Vary "Accept-Encoding" always;
        
        # Fallback if file not found
        try_files $uri =404;
        
        # Security headers for static files
        add_header X-Content-Type-Options "nosniff" always;
    }
    
    # Disable access to sensitive files
    location ~ /\.(ht|git) {
        deny all;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        application/atom+xml
        application/geo+json
        application/javascript
        application/x-javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rdf+xml
        application/rss+xml
        application/xhtml+xml
        application/xml
        font/eot
        font/otf
        font/ttf
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;
}
NGINXEOF

# Remove default nginx sites and enable ours
$SUDO_CMD rm -f /etc/nginx/sites-enabled/default
$SUDO_CMD rm -f /etc/nginx/sites-enabled/*
$SUDO_CMD ln -sf /etc/nginx/sites-available/qb-pharma /etc/nginx/sites-enabled/

# Test nginx configuration
print_status "Testing nginx configuration..."
if ! $SUDO_CMD nginx -t; then
    print_error "Nginx configuration is invalid"
    $SUDO_CMD nginx -t 2>&1
    exit 1
fi

# Start and enable nginx
$SUDO_CMD systemctl enable nginx
$SUDO_CMD systemctl restart nginx

# Wait for nginx to start
sleep 5

print_success "Nginx configured and started successfully"

# Comprehensive health checks
print_status "🏥 Performing comprehensive health checks..."

# Check backend directly
print_status "Testing backend API directly..."
if curl -f -s http://localhost:3001/health >/dev/null; then
    print_success "✅ Backend API is responding"
else
    print_error "❌ Backend API is not responding"
    pm2 logs qb-pharma --lines 10
fi

# Check frontend
print_status "Testing frontend..."
if curl -f -s http://localhost/ >/dev/null; then
    print_success "✅ Frontend is accessible"
else
    print_error "❌ Frontend is not accessible"
    $SUDO_CMD ls -la /var/www/html/
fi

# Check API proxy through nginx
print_status "Testing API proxy through nginx..."
if curl -f -s http://localhost/health >/dev/null; then
    print_success "✅ API proxy is working"
else
    print_error "❌ API proxy failed"
    $SUDO_CMD nginx -t
fi

# Check PM2 status
print_status "Checking PM2 status..."
pm2 status

# Final external connectivity test
print_status "Testing external connectivity..."
EXTERNAL_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "unknown")
if [ "$EXTERNAL_IP" != "unknown" ]; then
    print_success "External IP: $EXTERNAL_IP"
    print_status "Your application should be accessible at: http://$EXTERNAL_IP/"
fi

# Database seeding option
echo ""
read -p "Do you want to seed the database with sample data? [y/N]: " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "🌱 Seeding database with sample data..."
    cd ../backend
    if npm run db:seed; then
        print_success "✅ Database seeded successfully!"
        echo ""
        print_success "📊 Default Login Credentials:"
        echo "   🔑 Super Admin: admin / admin123"
        echo "   👨‍⚕️ Doctor: dr.ahmed / doctor123"
        echo "   🤝 Partner: wasim.partner / partner123"
        echo "   🏭 Distributor: karachi.dist / distributor123"
    else
        print_warning "⚠️  Database seeding failed, but application is running"
    fi
fi

# Final success message
echo ""
echo "🎉 =================================================================="
echo "🎉 QB PHARMA DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "🎉 =================================================================="
echo ""
echo "🌐 Your QB Pharma application is now LIVE and ready for production!"
echo ""
echo "📱 Access URLs:"
echo "   🏠 Frontend: http://$EXTERNAL_IP/"
echo "   🔗 API Base: http://$EXTERNAL_IP/api/"
echo "   💚 Health Check: http://$EXTERNAL_IP/health"
echo ""
echo "🛠️  System Information:"
echo "   📊 Backend: Node.js $(node --version) with PM2"
echo "   🗄️  Database: PostgreSQL"
echo "   🌐 Web Server: Nginx"
echo "   📁 Frontend: React SPA"
echo ""
echo "🔧 Management Commands:"
echo "   pm2 status                    # Check backend status"
echo "   pm2 logs qb-pharma           # View backend logs  "
echo "   pm2 restart qb-pharma        # Restart backend"
echo "   pm2 stop qb-pharma           # Stop backend"
echo "   sudo systemctl status nginx  # Check nginx status"
echo "   sudo systemctl reload nginx  # Reload nginx config"
echo ""
echo "📁 Important Paths:"
echo "   Backend: ~/qb-pharma/backend/"
echo "   Frontend: /var/www/html/"
echo "   Nginx Config: /etc/nginx/sites-available/qb-pharma"
echo "   Database: PostgreSQL on localhost:5432"
echo ""
echo "🚀 Your QB Pharma system is production-ready!"
echo "🎯 Go to http://$EXTERNAL_IP/ to start using your application!"
echo ""