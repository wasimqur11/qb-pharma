#!/usr/bin/env node

// Check all database files to see which has proper schema and data

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbFiles = [
  './data/qb-pharma.db',
  './prisma/data/qb-pharma.db', 
  './prisma/dev.db'
];

console.log('🔍 Checking all database files...');

async function checkDatabase(filePath) {
  return new Promise((resolve) => {
    const absolutePath = path.resolve(__dirname, filePath);
    const db = new sqlite3.Database(absolutePath, (err) => {
      if (err) {
        console.log(`\n❌ ${filePath}: Connection error - ${err.message}`);
        resolve();
        return;
      }
      
      console.log(`\n📁 ${filePath}:`);
      
      // Check tables
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
          console.log(`   Tables error: ${err.message}`);
          db.close();
          resolve();
          return;
        }
        
        console.log(`   Tables: ${tables.map(t => t.name).join(', ')}`);
        
        // Check if users table has data
        db.get("SELECT COUNT(*) as count FROM users", (err, result) => {
          if (err) {
            console.log(`   Users count error: ${err.message}`);
          } else {
            console.log(`   Users count: ${result.count}`);
            
            if (result.count > 0) {
              db.get("SELECT username, role FROM users LIMIT 1", (err, user) => {
                if (!err && user) {
                  console.log(`   Sample user: ${user.username} (${user.role})`);
                }
                db.close();
                resolve();
              });
            } else {
              db.close();
              resolve();
            }
          }
        });
      });
    });
  });
}

async function checkAllDatabases() {
  for (const file of dbFiles) {
    await checkDatabase(file);
  }
  console.log('\n✅ Database check completed');
}

checkAllDatabases();