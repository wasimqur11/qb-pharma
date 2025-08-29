# 🚀 QB Pharma Backend - Production Deployment Guide
## Server: 209.38.78.122

## ⚡ Quick Deployment

### 1. Connect to Your Server
```bash
ssh root@209.38.78.122
# or
ssh your-user@209.38.78.122
```

### 2. Install Prerequisites (if not already installed)
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin

# Add user to docker group (if not root)
usermod -aG docker $USER
newgrp docker
```

### 3. Clone and Deploy
```bash
# Clone the repository
git clone https://github.com/wasimqur11/qb-pharma.git
cd qb-pharma/backend

# Make scripts executable
chmod +x deploy-production.sh
chmod +x backup-database.sh

# Run production deployment
./deploy-production.sh
```

## 🎯 What the Deployment Script Does

1. **Environment Setup**: Creates log directories and sets permissions
2. **Container Management**: Stops old containers, builds new ones
3. **Database Setup**: Starts PostgreSQL, runs migrations, generates Prisma client
4. **API Deployment**: Starts the Node.js API with health checks
5. **Nginx Setup**: Configures reverse proxy with CORS for your IP
6. **Health Verification**: Checks all services are running correctly
7. **Sample Data**: Offers to seed database with test data

## 📊 Default Test Accounts

After deployment, you can login with:

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| Super Admin | `admin` | `admin123` | Full system access |
| Doctor | `dr.ahmed` | `doctor123` | Own consultations only |
| Business Partner | `wasim.partner` | `partner123` | Own profit data only |

## 🌐 Your API Endpoints

- **Base URL**: `http://209.38.78.122/api/`
- **Health Check**: `http://209.38.78.122/health`
- **Login**: `POST http://209.38.78.122/api/auth/login`

### Sample API Test
```bash
# Health check
curl http://209.38.78.122/health

# Login test
curl -X POST http://209.38.78.122/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 🛠️ Management Commands

### Using the Management Script
```bash
# Start all services
./manage.sh start

# Stop all services
./manage.sh stop

# Restart services
./manage.sh restart

# View logs
./manage.sh logs          # All logs
./manage.sh logs api      # API logs only
./manage.sh logs postgres # Database logs only

# Check status
./manage.sh status

# Backup database
./manage.sh backup
```

### Direct Docker Commands
```bash
# View running containers
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f api

# Restart a specific service
docker-compose -f docker-compose.production.yml restart api

# Stop everything
docker-compose -f docker-compose.production.yml down
```

## 📂 File Structure

```
qb-pharma/backend/
├── .env                           # Production environment variables
├── docker-compose.production.yml  # Production Docker configuration
├── nginx-production.conf          # Nginx configuration for your IP
├── deploy-production.sh          # Main deployment script
├── backup-database.sh           # Database backup script
├── manage.sh                   # Service management script
└── logs/                      # Application logs
    ├── api/                  # API logs
    ├── postgres/            # Database logs
    └── nginx/              # Nginx logs
```

## 🔒 Security Features

- **Rate Limiting**: 10 requests/second per IP
- **CORS**: Configured for your IP (209.38.78.122)
- **Security Headers**: XSS protection, frame options, etc.
- **Database**: Not exposed publicly (localhost only)
- **JWT**: Secure authentication with long secret key

## 💾 Database Backup

### Automatic Backups
```bash
# Set up daily automated backups
crontab -e

# Add this line for daily 2 AM backups
0 2 * * * /path/to/qb-pharma/backend/backup-database.sh
```

### Manual Backup
```bash
# Create backup
./backup-database.sh

# Backups are stored in: ~/qb-pharma-backups/
# Format: qb-pharma-backup-YYYYMMDD-HHMMSS.sql.gz
```

### Restore from Backup
```bash
# Stop the API (to avoid conflicts)
./manage.sh stop

# Start only the database
docker-compose -f docker-compose.production.yml up -d postgres

# Restore from backup
zcat ~/qb-pharma-backups/qb-pharma-backup-YYYYMMDD-HHMMSS.sql.gz | \
  docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U qb_pharma_user -d qb_pharma_prod

# Restart everything
./manage.sh start
```

## 📊 Monitoring

### Check System Resources
```bash
# Container resource usage
docker stats

# Disk usage
df -h
docker system df

# Memory usage
free -h

# Check logs for errors
./manage.sh logs api | grep ERROR
./manage.sh logs postgres | grep ERROR
```

### Health Monitoring
```bash
# API health check
curl -f http://209.38.78.122/health || echo "API is down!"

# Database connectivity
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U qb_pharma_user -d qb_pharma_prod -c "SELECT 1;"
```

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using port 80
sudo netstat -tulpn | grep :80
# Kill the process if needed
sudo kill -9 <PID>
```

#### Database Connection Issues
```bash
# Check database logs
./manage.sh logs postgres

# Connect to database manually
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U qb_pharma_user -d qb_pharma_prod
```

#### API Not Responding
```bash
# Check API logs
./manage.sh logs api

# Restart API only
docker-compose -f docker-compose.production.yml restart api

# Check if API is running
curl -I http://localhost:3001/health
```

#### Reset Everything (⚠️ DANGER - Deletes all data!)
```bash
# Stop everything
./manage.sh stop

# Remove all containers and volumes
docker-compose -f docker-compose.production.yml down -v

# Clean up everything
docker system prune -a --volumes

# Redeploy
./deploy-production.sh
```

## 🔄 Updates

### Update the Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.yml build --no-cache api
docker-compose -f docker-compose.production.yml up -d api
```

## 📞 Support

### Log Locations
- **API Logs**: `logs/api/`
- **Database Logs**: `logs/postgres/`
- **Nginx Logs**: `logs/nginx/`

### Quick Diagnostics
```bash
# Full system status
echo "=== Container Status ==="
./manage.sh status

echo "=== Health Checks ==="
curl -f http://209.38.78.122/health && echo "✅ API OK" || echo "❌ API Failed"

echo "=== Recent API Logs ==="
./manage.sh logs api | tail -20

echo "=== Resource Usage ==="
docker stats --no-stream
```

## 🎉 You're All Set!

Your QB Pharma Backend is now running in production at **http://209.38.78.122**

Next steps:
1. Update your frontend to use the new API URL
2. Test all functionality with the provided test accounts
3. Set up automated backups
4. Monitor the system regularly

**Happy managing! 🏥💊**