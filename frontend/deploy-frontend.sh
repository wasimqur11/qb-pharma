#!/bin/bash

# QB Pharma Frontend - Simple Ubuntu Deployment
# Builds and deploys React frontend to nginx

set -e

echo "🚀 QB Pharma Frontend - Simple Ubuntu Deployment"
echo "🌐 Deploying to Nginx at /var/www/html"
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

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the frontend directory"
    exit 1
fi

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_status "Installing frontend dependencies..."
npm install

print_status "Building frontend for production..."
npm run build

print_status "Creating backup of existing website..."
if [ -d "/var/www/html" ] && [ "$(ls -A /var/www/html)" ]; then
    sudo cp -r /var/www/html "/var/www/html.backup.$(date +%Y%m%d-%H%M%S)"
    print_success "Backup created"
fi

print_status "Deploying frontend to nginx..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

print_status "Creating nginx configuration for frontend..."
sudo tee /etc/nginx/sites-available/qb-pharma-frontend > /dev/null << 'EOF'
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
        
        # CORS headers
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
EOF

print_status "Enabling frontend site..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/qb-pharma
sudo ln -sf /etc/nginx/sites-available/qb-pharma-frontend /etc/nginx/sites-enabled/qb-pharma-frontend

print_status "Testing nginx configuration..."
if sudo nginx -t; then
    print_success "Nginx configuration is valid"
    sudo systemctl reload nginx
else
    print_error "Nginx configuration failed"
    exit 1
fi

print_status "Waiting for services to be ready..."
sleep 3

# Test frontend
print_status "Testing frontend deployment..."
if curl -f http://localhost/ >/dev/null 2>&1; then
    print_success "✅ Frontend is accessible!"
else
    print_error "❌ Frontend is not accessible"
fi

# Test API proxy
print_status "Testing API proxy..."
if curl -f http://localhost/health >/dev/null 2>&1; then
    print_success "✅ API proxy is working!"
else
    print_error "❌ API proxy failed - make sure backend is running"
fi

print_success "🎉 QB Pharma Frontend deployed successfully!"
echo ""
echo "🌐 Your QB Pharma application is now live!"
echo "   Frontend: http://localhost/"
echo "   API: http://localhost/api/"
echo "   Health: http://localhost/health"
echo ""
echo "📁 Frontend files: /var/www/html"
echo "⚙️  Nginx config: /etc/nginx/sites-available/qb-pharma-frontend"
echo ""
echo "🔧 Management Commands:"
echo "   sudo systemctl status nginx    # Check nginx status"
echo "   sudo systemctl reload nginx   # Reload nginx config"
echo "   npm run build                 # Rebuild frontend"
echo ""
print_success "🚀 Ready for your users!"