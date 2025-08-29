# QB Pharma Backend - DigitalOcean Deployment Guide

## Prerequisites

1. **DigitalOcean Droplet** with Docker and Docker Compose installed
   - Recommended: 2GB RAM, 1 vCPU, 50GB SSD
   - Ubuntu 22.04 LTS

2. **Domain Name** (optional but recommended for SSL)

3. **Environment Variables** configured

## Quick Deployment

### 1. Prepare the Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone and Deploy

```bash
# Clone the repository
git clone <https://github.com/wasimqur11/qb-pharma>
cd qb-pharma/backend

# Copy and configure environment variables
cp .env.production .env
nano .env  # Edit with your actual values

# Make deploy script executable
chmod +x deploy.sh

# Set required environment variables
export POSTGRES_PASSWORD="H0rsp@wer"
export JWT_SECRET="Kj9#mP2$vL8@nQ4!wE7*rT6%yU3&iO1^aS5+dF0-gH2~xC9"

# Run deployment
./deploy.sh
```

### 3. Environment Variables

Edit `.env` file with your actual values:

```bash
# Database
POSTGRES_DB=qb_pharma_prod
POSTGRES_USER=qb_pharma_user
POSTGRES_PASSWORD=your_secure_password_here

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key_here_at_least_32_characters
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. SSL Setup (Recommended)

```bash
# Create SSL directory
mkdir ssl

# Using Let's Encrypt (recommended)
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
```

### 5. Database Migration

```bash
# Run initial migration
docker-compose run --rm api npx prisma migrate deploy

# Generate Prisma client
docker-compose run --rm api npx prisma generate

# Optional: Seed with initial data
docker-compose run --rm api npx prisma db seed
```

## Service Management

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
```

### Restart Services
```bash
docker-compose restart api
```

## Health Checks

- **API Health**: `http://your-server-ip:3001/health`
- **Database**: Check with `docker-compose logs postgres`

## Database Backup

### Manual Backup
```bash
docker-compose exec postgres pg_dump -U qb_pharma_user qb_pharma_prod > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Automated Backup Script
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/backups"
DATE=$(date +%Y%m%d-%H%M%S)
mkdir -p $BACKUP_DIR

docker-compose exec postgres pg_dump -U qb_pharma_user qb_pharma_prod > $BACKUP_DIR/qb-pharma-backup-$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "qb-pharma-backup-*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab for daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /path/to/backup.sh") | crontab -
```

## Monitoring

### Container Status
```bash
docker-compose ps
```

### Resource Usage
```bash
docker stats
```

### Disk Usage
```bash
df -h
docker system df
```

## Security Considerations

1. **Firewall Configuration**
```bash
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **Regular Updates**
```bash
# Update Docker images
docker-compose pull
docker-compose up -d

# Update system packages
sudo apt update && sudo apt upgrade -y
```

3. **Database Security**
- Use strong passwords
- Limit database access to localhost
- Regular backups
- Monitor logs for suspicious activity

## Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
sudo netstat -tulpn | grep :3001
sudo kill -9 <PID>
```

2. **Database Connection Issues**
```bash
docker-compose logs postgres
docker-compose exec postgres psql -U qb_pharma_user -d qb_pharma_prod
```

3. **API Not Responding**
```bash
docker-compose logs api
curl -I http://localhost:3001/health
```

4. **SSL Certificate Issues**
```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout
```

### Reset Everything
```bash
# WARNING: This will delete all data
docker-compose down -v
docker system prune -a
```

## Performance Optimization

1. **Database Optimization**
```sql
-- Connect to database
docker-compose exec postgres psql -U qb_pharma_user -d qb_pharma_prod

-- Check database size
SELECT pg_size_pretty(pg_database_size('qb_pharma_prod'));

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM transactions LIMIT 10;
```

2. **API Performance**
```bash
# Monitor API response times
curl -w "Total time: %{time_total}s\n" -o /dev/null -s http://localhost:3001/health
```

## Scaling Considerations

For high-traffic scenarios:

1. **Load Balancer**: Use DigitalOcean Load Balancer
2. **Database**: Consider managed PostgreSQL
3. **Caching**: Add Redis for session storage
4. **CDN**: Use DigitalOcean Spaces + CDN for static assets

## Support

For deployment issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables
3. Ensure all prerequisites are installed
4. Check firewall settings
5. Verify database connectivity

## Updates

To update the application:
```bash
git pull origin main
docker-compose build api
docker-compose up -d api
```