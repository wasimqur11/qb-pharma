#!/bin/bash

# QB Pharma Simple Management Script (No Docker)

case "$1" in
    start)
        echo "🚀 Starting QB Pharma..."
        pm2 start qb-pharma
        sudo systemctl start nginx
        echo "✅ QB Pharma started"
        ;;
    stop)
        echo "🛑 Stopping QB Pharma..."
        pm2 stop qb-pharma
        sudo systemctl stop nginx
        echo "✅ QB Pharma stopped"
        ;;
    restart)
        echo "🔄 Restarting QB Pharma..."
        pm2 restart qb-pharma
        sudo systemctl reload nginx
        echo "✅ QB Pharma restarted"
        ;;
    status)
        echo "📊 QB Pharma Status:"
        echo "===================="
        pm2 status qb-pharma
        echo ""
        echo "Nginx Status:"
        sudo systemctl status nginx --no-pager -l
        ;;
    logs)
        echo "📋 QB Pharma Logs:"
        pm2 logs qb-pharma --lines 50
        ;;
    health)
        echo "🏥 Health Check:"
        echo "==============="
        if curl -f http://localhost:3001/health 2>/dev/null; then
            echo "✅ Internal API: OK"
        else
            echo "❌ Internal API: Failed"
        fi
        
        if curl -f http://209.38.78.122/health 2>/dev/null; then
            echo "✅ External API: OK"
        else
            echo "❌ External API: Failed"
        fi
        ;;
    backup)
        echo "💾 Creating backup..."
        mkdir -p backups
        DATE=$(date +%Y%m%d-%H%M%S)
        cp data/qb-pharma.db "backups/qb-pharma-backup-$DATE.db"
        gzip "backups/qb-pharma-backup-$DATE.db"
        echo "✅ Backup created: backups/qb-pharma-backup-$DATE.db.gz"
        ;;
    update)
        echo "🔄 Updating QB Pharma..."
        git pull origin main
        npm install
        npx prisma generate
        npx prisma migrate deploy
        npm run build
        pm2 restart qb-pharma
        echo "✅ Update completed"
        ;;
    seed)
        echo "🌱 Seeding database..."
        npm run db:seed
        echo "✅ Database seeded"
        ;;
    *)
        echo "QB Pharma Management Script"
        echo "Usage: $0 {start|stop|restart|status|logs|health|backup|update|seed}"
        echo ""
        echo "Commands:"
        echo "  start   - Start QB Pharma and Nginx"
        echo "  stop    - Stop QB Pharma and Nginx"
        echo "  restart - Restart QB Pharma and reload Nginx"
        echo "  status  - Show application and server status"
        echo "  logs    - Show application logs"
        echo "  health  - Check API health"
        echo "  backup  - Create database backup"
        echo "  update  - Update application from git"
        echo "  seed    - Seed database with sample data"
        exit 1
esac