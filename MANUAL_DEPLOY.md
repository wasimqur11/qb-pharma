# Manual Deployment to Digital Ocean

Since automated deployment tools need specific setup, here's a manual deployment process:

## Step 1: Connect to Your Server

```bash
ssh root@209.38.78.122
# Password: W@h!dp0R@A
```

## Step 2: Install Nginx and Setup Directories

```bash
# Update system
apt update
apt install -y nginx wget unzip

# Create application directory
mkdir -p /var/www/qb-pharma
cd /var/www/qb-pharma

# Set permissions
chown -R www-data:www-data /var/www/qb-pharma
chmod -R 755 /var/www/qb-pharma
```

## Step 3: Upload Your Build Files

You have two options:

### Option A: Direct Upload (Recommended)
1. Zip your `frontend/dist` folder on Windows
2. Upload via SCP/SFTP to `/var/www/qb-pharma/`
3. Extract on server

### Option B: GitHub Upload
1. Push your `frontend/dist` folder to a GitHub repository
2. Download on server:

```bash
# Example if you create a GitHub repo
wget https://github.com/yourusername/qb-pharma-build/archive/main.zip
unzip main.zip
mv qb-pharma-build-main/* .
```

## Step 4: Configure Nginx

```bash
# Create Nginx configuration
cat > /etc/nginx/sites-available/qb-pharma << 'EOF'
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
        
        # Disable caching for index.html
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
    
    # Hide Nginx version
    server_tokens off;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/qb-pharma /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx

# Enable Nginx to start on boot
systemctl enable nginx
```

## Step 5: Configure Firewall

```bash
# Allow HTTP traffic
ufw allow 'Nginx Full'
ufw allow ssh
ufw --force enable
```

## Step 6: Test Deployment

```bash
# Check if Nginx is running
systemctl status nginx

# Test locally on server
curl -I http://localhost

# Check from outside
curl -I http://209.38.78.122
```

## Step 7: Verify Application

Open your browser and go to: **http://209.38.78.122**

You should see your QB Pharma application running!

---

## Quick Copy-Paste Commands

If you want to run everything at once (after uploading files):

```bash
# Complete setup script
#!/bin/bash
set -e

echo "Setting up QB Pharma application..."

# Install nginx
apt update && apt install -y nginx

# Configure nginx
cat > /etc/nginx/sites-available/qb-pharma << 'EOF'
server {
    listen 80;
    server_name 209.38.78.122;
    root /var/www/qb-pharma;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    server_tokens off;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/qb-pharma /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Set permissions
chown -R www-data:www-data /var/www/qb-pharma
chmod -R 755 /var/www/qb-pharma

# Restart nginx
nginx -t && systemctl restart nginx

# Configure firewall
ufw allow 'Nginx Full'

echo "QB Pharma deployment completed!"
echo "Access your application at: http://209.38.78.122"
```

---

## Troubleshooting

If you encounter issues:

```bash
# Check Nginx status
systemctl status nginx

# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Check Nginx access logs
tail -f /var/log/nginx/access.log

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

Your QB Pharma application should be live once you complete these steps!