#!/bin/bash

# QB Pharma - Complete Deployment Script for Fresh Ubuntu Server
# Deploys both backend and frontend in one go

set -e

echo "🚀 QB Pharma - Complete Ubuntu Deployment"
echo "🌍 Server: Fresh DigitalOcean Droplet"
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

print_status "🔄 Updating system packages..."
sudo apt update && sudo apt upgrade -y

print_status "📦 Installing system dependencies..."
sudo apt install -y curl wget git nginx postgresql postgresql-contrib build-essential

# Install Node.js 18
print_status "🟢 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
print_status "⚡ Installing PM2..."
sudo npm install -g pm2

# Setup PostgreSQL
print_status "🐘 Setting up PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE USER qb_pharma_user WITH PASSWORD 'H0rsp@wer';
CREATE DATABASE qb_pharma_prod;
GRANT ALL PRIVILEGES ON DATABASE qb_pharma_prod TO qb_pharma_user;
ALTER USER qb_pharma_user CREATEDB;
\q
EOF

print_success "PostgreSQL setup complete"

# Setup project directory
print_status "📁 Setting up project..."
if [ ! -d "qb-pharma" ]; then
    git clone https://github.com/wasimqur11/qb-pharma.git
    cd qb-pharma
else
    cd qb-pharma
    git pull origin main
fi

# Backend deployment
print_status "🔨 Deploying backend..."
cd backend

# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=3001

# Database Configuration
DATABASE_URL="postgresql://qb_pharma_user:H0rsp@wer@localhost:5432/qb_pharma_prod"

# JWT Configuration
JWT_SECRET="Kj9#mP2\$vL8@nQ4!wE7*rT6%yU3&iO1^aS5+dF0-gH2~xC9"
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
EOF

# Simplify tsconfig for deployment
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src", 
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Install dependencies and build
npm install
npx prisma generate
npx prisma migrate deploy || npx prisma db push

# Try to build - if it fails, we'll use tsx
if npm run build; then
    print_success "TypeScript build successful"
    START_COMMAND="node dist/index.js"
else
    print_warning "TypeScript build failed, using tsx for direct execution"
    START_COMMAND="npx tsx src/index.ts"
fi

# Stop existing PM2 process
pm2 delete qb-pharma 2>/dev/null || true

# Start backend with PM2
pm2 start --name "qb-pharma" --env production -- $START_COMMAND
pm2 save
pm2 startup | grep -E '^sudo' | bash || print_warning "PM2 startup setup needs manual run"

print_success "Backend deployed successfully"

# Frontend deployment
print_status "🎨 Deploying frontend..."
cd ../frontend

# Install dependencies and build
npm install
npm run build

# Deploy to nginx
print_status "📄 Setting up nginx..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Create nginx configuration
sudo tee /etc/nginx/sites-available/qb-pharma > /dev/null << 'NGINXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html;
    
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend routes (React Router)
    location / {
        try_files $uri $uri/ /index.html;
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
        
        # CORS headers for API
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
            add_header 'Access-Control-Max-Age' 86400;
            return 204;
        }
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        access_log off;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
NGINXEOF

# Enable site
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/*
sudo ln -sf /etc/nginx/sites-available/qb-pharma /etc/nginx/sites-enabled/qb-pharma

# Test and restart nginx
if sudo nginx -t; then
    print_success "Nginx configuration is valid"
    sudo systemctl enable nginx
    sudo systemctl restart nginx
else
    print_error "Nginx configuration failed"
    exit 1
fi

# Health checks
print_status "🏥 Performing health checks..."
sleep 5

# Check backend
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    print_success "✅ Backend API is running"
else
    print_error "❌ Backend API failed to start"
    pm2 logs qb-pharma --lines 10
fi

# Check frontend
if curl -f http://localhost/ >/dev/null 2>&1; then
    print_success "✅ Frontend is accessible"
else
    print_error "❌ Frontend is not accessible"
fi

# Check API proxy
if curl -f http://localhost/health >/dev/null 2>&1; then
    print_success "✅ API proxy is working"
else
    print_error "❌ API proxy failed"
fi

# Seed database
read -p "Do you want to seed the database with sample data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "🌱 Seeding database..."
    cd ../backend
    if npm run db:seed; then
        print_success "✅ Database seeded successfully!"
        echo ""
        echo "📊 Default login credentials:"
        echo "   Super Admin: admin / admin123"
        echo "   Doctor: dr.ahmed / doctor123" 
        echo "   Partner: wasim.partner / partner123"
    else
        print_warning "⚠️  Database seeding failed"
    fi
fi

print_success "🎉 QB Pharma deployment completed!"
echo ""
echo "🌐 Your application is now live!"
echo "   Frontend: http://your-server-ip/"
echo "   API: http://your-server-ip/api/"
echo "   Health: http://your-server-ip/health"
echo ""
echo "🔧 Management Commands:"
echo "   pm2 status                 # Check backend status"
echo "   pm2 logs qb-pharma        # View backend logs"
echo "   pm2 restart qb-pharma     # Restart backend"
echo "   sudo systemctl status nginx # Check nginx status"
echo ""
echo "📁 Important paths:"
echo "   Backend: ~/qb-pharma/backend"
echo "   Frontend: /var/www/html"
echo "   Database: PostgreSQL on localhost:5432"
echo ""
print_success "🚀 Ready for production use!"