#!/usr/bin/env node

// Debug Prisma schema differences

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'qb-pharma.db');

console.log('🔍 Debugging Prisma schema differences...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  }
});

// Get all tables and their schemas
db.all("SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
  if (err) {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  }
  
  console.log('\n📊 Database tables and schemas:');
  tables.forEach(table => {
    console.log(`\n🏷️  Table: ${table.name}`);
    if (table.sql) {
      console.log(`   Schema: ${table.sql.substring(0, 100)}...`);
    }
  });
  
  // Check users table specifically
  console.log('\n👥 Users table data:');
  db.all("SELECT id, username, email, role, isActive FROM users LIMIT 5", (err, users) => {
    if (err) {
      console.error('❌ Users query error:', err.message);
    } else {
      users.forEach(user => {
        console.log(`   • ${user.username} (${user.role}) - Active: ${user.isActive}`);
      });
    }
    
    // Check if there are Prisma migration tables
    console.log('\n🔧 Checking for Prisma migration tables:');
    db.all("SELECT name FROM sqlite_master WHERE name LIKE '%prisma%' OR name LIKE '%migration%'", (err, prismaTables) => {
      if (err) {
        console.error('❌ Migration check error:', err.message);
      } else if (prismaTables.length > 0) {
        console.log('   Prisma migration tables found:');
        prismaTables.forEach(table => {
          console.log(`   • ${table.name}`);
        });
      } else {
        console.log('   No Prisma migration tables found');
      }
      
      db.close();
    });
  });
});