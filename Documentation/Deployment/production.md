# Production Deployment Guide

## Overview

This guide covers the complete production deployment process for QB Pharma system, including server setup, security hardening, and monitoring configuration.

## Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04 LTS or higher
- **CPU**: 2+ vCPUs (4+ recommended for high traffic)
- **RAM**: 4GB minimum (8GB+ recommended)
- **Storage**: 20GB SSD minimum (50GB+ recommended)
- **Network**: Stable internet connection, ports 80, 443, 3001 accessible

### Domain & SSL
- Domain name configured and pointing to server
- SSL certificate (Let's Encrypt recommended)
- DNS records properly configured

### Access Requirements
- SSH access to production server
- sudo privileges on the server
- Git repository access

## Deployment Process

### Step 1: Server Preparation

#### 1.1 System Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx
```

#### 1.2 Node.js Installation
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be 18.x or higher
npm --version   # Should be 8.x or higher
```

#### 1.3 PM2 Installation
```bash
# Install PM2 globally
sudo npm install -y pm2@latest

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### Step 2: Application Deployment

#### 2.1 Clone Repository
```bash
# Navigate to web directory
cd /var/www

# Clone repository (replace with your repository URL)
sudo git clone https://github.com/your-org/qb-pharma.git
sudo chown -R $USER:$USER qb-pharma
cd qb-pharma
```

#### 2.2 Environment Configuration
```bash
# Copy and edit environment file
cp backend/.env.example backend/.env
nano backend/.env
```

**Required Environment Variables:**
```bash
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
DATABASE_URL="file:./prisma/data/qb-pharma.db"

# Generate secure JWT secret (use a secure random string)
JWT_SECRET="your-super-secure-jwt-secret-here"
JWT_EXPIRES_IN="7d"

# Domain configuration
FRONTEND_URL="https://yourdomain.com"
CORS_ORIGIN="https://yourdomain.com"

# Security settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Prisma settings
PRISMA_HIDE_UPDATE_MESSAGE=true
PRISMA_TELEMETRY_INFORMATION=false
```

#### 2.3 Frontend Environment
```bash
# Configure frontend environment
cp frontend/.env.example frontend/.env
nano frontend/.env
```

```bash
VITE_API_URL="/api"
VITE_APP_NAME="QB Pharma"
VITE_NODE_ENV=production
VITE_LOCAL_API=true
```

### Step 3: Application Build

#### 3.1 Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm ci --production

# Generate Prisma client
npm run db:generate

# Run database migrations (if any)
npm run db:deploy

# Seed database with initial data
npm run db:seed

# Build TypeScript
npm run build
```

#### 3.2 Frontend Build
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm ci

# Build production bundle
npm run build

# Verify build output
ls -la dist/
```

### Step 4: Process Management

#### 4.1 PM2 Configuration
Create PM2 ecosystem file:
```bash
# Create ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'qb-pharma-backend',
    script: 'dist/index.js',
    cwd: '/var/www/qb-pharma/backend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/qb-pharma/backend-error.log',
    out_file: '/var/log/qb-pharma/backend-out.log',
    log_file: '/var/log/qb-pharma/backend-combined.log',
    time: true,
    max_memory_restart: '500M'
  }]
};
```

#### 4.2 Start Application
```bash
# Create log directory
sudo mkdir -p /var/log/qb-pharma
sudo chown $USER:$USER /var/log/qb-pharma

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Verify application is running
pm2 status
pm2 logs qb-pharma-backend --lines 50
```

### Step 5: Nginx Configuration

#### 5.1 Create Nginx Configuration
```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/qb-pharma
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (will be added by Certbot)
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self';" always;
    
    # Serve static files
    location / {
        root /var/www/qb-pharma/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Security: Deny access to sensitive files
    location ~ /\.(env|git) {
        deny all;
        return 404;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
```

#### 5.2 Enable Site
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/qb-pharma /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 6: SSL Certificate

#### 6.1 Obtain SSL Certificate
```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Verify certificate renewal
sudo certbot renew --dry-run
```

#### 6.2 Setup Auto-renewal
```bash
# Add cron job for certificate renewal
sudo crontab -e

# Add this line to crontab:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### Step 7: Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw --force enable

# Allow SSH (replace 22 with your SSH port if different)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check firewall status
sudo ufw status
```

### Step 8: Database Backup Setup

#### 8.1 Create Backup Script
```bash
# Create backup script
sudo mkdir -p /opt/qb-pharma/scripts
sudo nano /opt/qb-pharma/scripts/backup-db.sh
```

```bash
#!/bin/bash

# Configuration
DB_PATH="/var/www/qb-pharma/backend/prisma/data/qb-pharma.db"
BACKUP_DIR="/var/backups/qb-pharma"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/qb-pharma_$TIMESTAMP.db"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Copy database with timestamp
cp $DB_PATH $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "qb-pharma_*.db.gz" -type f -mtime +30 -delete

echo "Database backup completed: ${BACKUP_FILE}.gz"
```

#### 8.2 Schedule Backups
```bash
# Make script executable
sudo chmod +x /opt/qb-pharma/scripts/backup-db.sh

# Add to crontab for daily backups at 2 AM
sudo crontab -e

# Add this line:
# 0 2 * * * /opt/qb-pharma/scripts/backup-db.sh >> /var/log/qb-pharma/backup.log 2>&1
```

### Step 9: Monitoring Setup

#### 9.1 Health Check Script
```bash
# Create health check script
sudo nano /opt/qb-pharma/scripts/health-check.sh
```

```bash
#!/bin/bash

# Configuration
APP_URL="https://yourdomain.com/health"
LOG_FILE="/var/log/qb-pharma/health-check.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Check application health
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" $APP_URL)

if [ $HTTP_STATUS -eq 200 ]; then
    echo "[$TIMESTAMP] Health check passed - Status: $HTTP_STATUS" >> $LOG_FILE
else
    echo "[$TIMESTAMP] Health check failed - Status: $HTTP_STATUS" >> $LOG_FILE
    
    # Restart application if health check fails
    pm2 restart qb-pharma-backend
    echo "[$TIMESTAMP] Application restarted due to health check failure" >> $LOG_FILE
fi
```

#### 9.2 Setup Health Check Monitoring
```bash
# Make script executable
sudo chmod +x /opt/qb-pharma/scripts/health-check.sh

# Add to crontab for monitoring every 5 minutes
sudo crontab -e

# Add this line:
# */5 * * * * /opt/qb-pharma/scripts/health-check.sh
```

### Step 10: Final Verification

#### 10.1 Application Tests
```bash
# Test application endpoints
curl https://yourdomain.com/health
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_admin_password"}'

# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check logs
pm2 logs qb-pharma-backend --lines 20
sudo tail -f /var/log/nginx/access.log
```

#### 10.2 Performance Verification
```bash
# Check system resources
htop
df -h
free -h

# Check application memory usage
pm2 monit
```

## Post-Deployment Tasks

### 1. Security Hardening
- Review and update firewall rules
- Configure fail2ban for SSH protection
- Setup log monitoring and alerting
- Regular security updates

### 2. Performance Optimization
- Configure database connection pooling
- Setup Redis for session management (if needed)
- Optimize Nginx caching rules
- Monitor application performance metrics

### 3. Backup Verification
- Test backup restoration procedure
- Verify backup file integrity
- Document recovery procedures

### 4. Documentation Updates
- Update deployment documentation
- Document custom configurations
- Create runbooks for common operations

## Troubleshooting

### Common Issues

1. **Application won't start**
   - Check environment variables
   - Verify database file permissions
   - Review PM2 logs

2. **502 Bad Gateway**
   - Check if backend is running on port 3001
   - Verify Nginx proxy configuration
   - Check firewall rules

3. **SSL Certificate Issues**
   - Verify domain DNS configuration
   - Check certificate expiration
   - Review Certbot logs

4. **Database Connection Errors**
   - Check database file path and permissions
   - Verify Prisma client generation
   - Review database migration status

### Emergency Procedures

1. **Application Rollback**
   ```bash
   # Stop current application
   pm2 stop qb-pharma-backend
   
   # Restore previous version from git
   git checkout previous_working_commit
   
   # Rebuild and restart
   npm run build
   pm2 start qb-pharma-backend
   ```

2. **Database Recovery**
   ```bash
   # Restore from latest backup
   gunzip /var/backups/qb-pharma/qb-pharma_TIMESTAMP.db.gz
   cp /var/backups/qb-pharma/qb-pharma_TIMESTAMP.db /var/www/qb-pharma/backend/prisma/data/qb-pharma.db
   pm2 restart qb-pharma-backend
   ```

## Maintenance

### Regular Tasks
- **Daily**: Monitor application logs and performance
- **Weekly**: Review security logs and update documentation
- **Monthly**: Update system packages and security patches
- **Quarterly**: Security audit and performance review

### Update Procedure
1. Create application backup
2. Test updates in staging environment
3. Schedule maintenance window
4. Deploy updates using deployment script
5. Verify application functionality
6. Monitor for issues post-deployment

---

This completes the production deployment guide. For additional support, refer to the troubleshooting section or contact the development team.