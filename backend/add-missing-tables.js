#!/usr/bin/env node

// Add missing Prisma tables to our existing database

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'qb-pharma.db');

console.log('🔧 Adding missing Prisma tables to existing database...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  }
});

// SQL for missing tables
const missingTables = [
  `CREATE TABLE IF NOT EXISTS user_permissions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    module TEXT NOT NULL,
    actions TEXT NOT NULL,
    scope TEXT NOT NULL,
    conditions TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  )`,
  
  `CREATE TABLE IF NOT EXISTS settlement_records (
    id TEXT PRIMARY KEY,
    settlementId TEXT NOT NULL,
    partnerId TEXT NOT NULL,
    settlementDate TEXT NOT NULL,
    owedAmount REAL NOT NULL,
    actualAmount REAL NOT NULL,
    equityChange REAL NOT NULL,
    reason TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partnerId) REFERENCES business_partners(id)
  )`
];

let completed = 0;
const total = missingTables.length;

console.log(`📊 Creating ${total} missing tables...`);

missingTables.forEach((sql, index) => {
  db.run(sql, function(err) {
    if (err) {
      console.error(`❌ Failed to create table ${index + 1}:`, err.message);
    } else {
      console.log(`✅ Table ${index + 1} created successfully`);
    }
    
    completed++;
    if (completed === total) {
      // Verify all tables exist
      db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
        if (err) {
          console.error('❌ Failed to verify tables:', err.message);
          process.exit(1);
        }
        
        console.log('\n📊 All tables in database:');
        tables.forEach(table => console.log(`   ✓ ${table.name}`));
        
        console.log('\n🎉 Missing tables added successfully!');
        console.log('Database is now compatible with Prisma schema');
        
        db.close();
      });
    }
  });
});