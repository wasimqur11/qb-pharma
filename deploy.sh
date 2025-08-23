#!/bin/bash

# QB Pharma - Digital Ocean Deployment Script
# Server: 209.38.78.122
# User: root

SERVER_IP="209.38.78.122"
SERVER_USER="root"
SERVER_PASSWORD="W@h!dp0R@A"
APP_NAME="qb-pharma"
BUILD_DIR="./frontend/dist"

echo "🚀 Starting QB Pharma deployment to Digital Ocean..."

# Test server connection
echo "📡 Testing server connection..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "echo 'Connection successful!'"

if [ $? -eq 0 ]; then
    echo "✅ Server connection successful!"
else
    echo "❌ Failed to connect to server"
    exit 1
fi

# Update server and install required packages
echo "📦 Installing required packages on server..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
apt update
apt install -y nginx
systemctl enable nginx
systemctl start nginx
ufw allow 'Nginx Full'
mkdir -p /var/www/qb-pharma
chown -R www-data:www-data /var/www/qb-pharma
chmod -R 755 /var/www/qb-pharma
EOF

# Upload build files to server
echo "📤 Uploading application files..."
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no -r $BUILD_DIR/* $SERVER_USER@$SERVER_IP:/var/www/qb-pharma/

# Configure Nginx
echo "⚙️ Configuring Nginx..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
cat > /etc/nginx/sites-available/qb-pharma << 'NGINX_CONFIG'
server {
    listen 80;
    server_name 209.38.78.122;
    root /var/www/qb-pharma;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Main location block for SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINX_CONFIG

# Enable the site
ln -sf /etc/nginx/sites-available/qb-pharma /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx

echo "✅ Nginx configuration complete!"
EOF

# Test deployment
echo "🧪 Testing deployment..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP)

if [ "$RESPONSE" = "200" ]; then
    echo "🎉 Deployment successful!"
    echo "🌐 Your QB Pharma application is now live at: http://$SERVER_IP"
    echo ""
    echo "📋 Deployment Summary:"
    echo "   - Server: $SERVER_IP"
    echo "   - Application: QB Pharma"
    echo "   - Web Server: Nginx"
    echo "   - SSL: Not configured (HTTP only)"
    echo ""
    echo "🔗 Access your application: http://$SERVER_IP"
else
    echo "⚠️  Deployment may have issues. HTTP response code: $RESPONSE"
    echo "Please check server logs: ssh root@$SERVER_IP 'tail -f /var/log/nginx/error.log'"
fi

echo "🏁 Deployment script completed!"