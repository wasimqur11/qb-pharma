#!/bin/bash

# QB Pharma Database Setup Script
# Creates SQLite database tables and inserts default data

set -e

echo "🗄️ Setting up QB Pharma SQLite database..."

# Create data directory if it doesn't exist
mkdir -p data

# Check if database file exists
if [ ! -f "data/qb-pharma.db" ]; then
    echo "📁 Creating new SQLite database file..."
    touch data/qb-pharma.db
else
    echo "📁 Using existing SQLite database file..."
fi

# Create tables and insert default data
echo "📊 Creating database tables and default data..."
sqlite3 data/qb-pharma.db < create-tables.sql

# Check if tables were created
TABLES=$(sqlite3 data/qb-pharma.db ".tables")
if [ -z "$TABLES" ]; then
    echo "❌ Failed to create database tables"
    exit 1
else
    echo "✅ Database tables created successfully:"
    echo "$TABLES"
fi

# Check if admin user exists
USER_COUNT=$(sqlite3 data/qb-pharma.db "SELECT COUNT(*) FROM users WHERE username='admin';")
if [ "$USER_COUNT" -gt 0 ]; then
    echo "✅ Admin user exists in database"
    echo "📝 Login credentials:"
    echo "   Username: admin"
    echo "   Password: admin123"
else
    echo "❌ Admin user was not created"
    exit 1
fi

echo "🎉 Database setup completed successfully!"
echo "💾 Database location: $(pwd)/data/qb-pharma.db"
echo "📊 Database size: $(du -h data/qb-pharma.db | cut -f1)"