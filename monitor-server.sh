#!/bin/bash

# QB Pharma Server Health Monitor
# This script checks if the backend server is running and restarts if needed

LOG_FILE="/var/log/qb-pharma-monitor.log"
HEALTH_URL="http://localhost:3001/health"
SERVICE_NAME="qb-pharma"

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

check_server() {
    if curl -s --connect-timeout 5 "$HEALTH_URL" > /dev/null 2>&1; then
        return 0  # Server is healthy
    else
        return 1  # Server is down
    fi
}

restart_service() {
    log_message "Server appears to be down. Restarting $SERVICE_NAME service..."
    systemctl restart "$SERVICE_NAME"
    sleep 10
    
    if check_server; then
        log_message "Service restarted successfully"
        return 0
    else
        log_message "Service restart failed"
        return 1
    fi
}

# Main monitoring logic
if check_server; then
    # Server is healthy - no action needed
    exit 0
else
    log_message "Health check failed for $HEALTH_URL"
    
    # Check if systemd service is running
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        log_message "Service is marked as active but health check failed"
    else
        log_message "Service is not active"
    fi
    
    # Attempt restart
    restart_service
    exit $?
fi