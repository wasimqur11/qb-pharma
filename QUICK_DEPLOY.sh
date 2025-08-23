#!/bin/bash
# QB Pharma - One-Command Deployment for Digital Ocean
# Run this on your server: ssh root@209.38.78.122

echo "🚀 QB Pharma Auto-Deployment Starting..."
echo "Server: 209.38.78.122"
echo "=================================="

# Update system and install required packages
echo "📦 Installing required packages..."
apt update
apt install -y nginx wget

# Create application directory
echo "📁 Setting up directories..."
mkdir -p /var/www/qb-pharma
cd /var/www/qb-pharma

# Download QB Pharma build files from GitHub (public method)
echo "📥 Downloading QB Pharma application files..."
# Note: You'll need to upload the build files to a public location first
# For now, creating a placeholder structure

# Create a basic index.html if download fails
cat > index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QB Pharma - Loading...</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            margin-top: 100px; 
            background: #1a1a2e;
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 10px;
            max-width: 600px;
            margin: 0 auto;
        }
        .success { color: #4ade80; font-size: 32px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="success">🏥 QB Pharma</h1>
        <p>Deployment in progress...</p>
        <p>Please upload your build files to /var/www/qb-pharma/</p>
        <p>Your build files are ready at: D:\WasimQureshi\SoftwareDevelopment\ClaudeProjects\qb-pharma\frontend\dist\</p>
    </div>
</body>
</html>
HTMLEOF

# Set proper permissions
echo "🔒 Setting permissions..."
chown -R www-data:www-data /var/www/qb-pharma
chmod -R 755 /var/www/qb-pharma

# Configure Nginx
echo "⚙️ Configuring Nginx..."
cat > /etc/nginx/sites-available/qb-pharma << 'NGINXEOF'
server {
    listen 80;
    server_name 209.38.78.122;
    root /var/www/qb-pharma;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        application/json
        application/javascript
        text/xml
        application/xml
        application/xml+rss
        text/javascript;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
        
        # Disable caching for HTML files
        location ~* \.html$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
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
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Hide server information
    server_tokens off;
    
    # Additional security
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
NGINXEOF

# Enable the site and disable default
echo "🌐 Enabling QB Pharma site..."
ln -sf /etc/nginx/sites-available/qb-pharma /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Restart Nginx
    echo "🔄 Restarting Nginx..."
    systemctl restart nginx
    systemctl enable nginx
    
    # Configure firewall
    echo "🔥 Configuring firewall..."
    ufw allow 'Nginx Full'
    ufw allow ssh
    
    # Final status check
    echo "🏁 Checking final status..."
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx is running successfully!"
        echo ""
        echo "🎉 QB Pharma deployment completed!"
        echo "📋 Deployment Summary:"
        echo "   - Server: 209.38.78.122"
        echo "   - Web Server: Nginx"
        echo "   - Document Root: /var/www/qb-pharma"
        echo "   - Status: Ready for build files"
        echo ""
        echo "🔗 Access your application at: http://209.38.78.122"
        echo ""
        echo "📤 Next Steps:"
        echo "1. Upload your build files from:"
        echo "   D:\\WasimQureshi\\SoftwareDevelopment\\ClaudeProjects\\qb-pharma\\frontend\\dist\\"
        echo "2. Extract them to: /var/www/qb-pharma/"
        echo "3. Set permissions: chown -R www-data:www-data /var/www/qb-pharma"
        echo ""
        echo "💡 Quick upload via SCP:"
        echo "   scp -r /path/to/dist/* root@209.38.78.122:/var/www/qb-pharma/"
        
    else
        echo "❌ Nginx failed to start. Check logs:"
        echo "   systemctl status nginx"
        echo "   tail -f /var/log/nginx/error.log"
    fi
else
    echo "❌ Nginx configuration test failed!"
    nginx -t
fi

echo ""
echo "🛠️ Useful Commands:"
echo "  - Check status: systemctl status nginx"
echo "  - View logs: tail -f /var/log/nginx/access.log"
echo "  - Restart: systemctl restart nginx"
echo "  - Test config: nginx -t"
echo ""
echo "🏥 QB Pharma deployment script completed!"