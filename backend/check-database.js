#!/usr/bin/env node

// Check QB Pharma Database Contents

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'qb-pharma.db');

console.log('🔍 Checking QB Pharma database...');
console.log(`📍 Database location: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  }
});

// Check tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('❌ Failed to check tables:', err.message);
    process.exit(1);
  }
  
  console.log('\n📊 Available tables:');
  tables.forEach(table => console.log(`   ✓ ${table.name}`));
  
  // Check admin user
  db.get("SELECT * FROM users WHERE username='admin'", (err, admin) => {
    if (err) {
      console.error('❌ Failed to check admin user:', err.message);
      process.exit(1);
    }
    
    if (admin) {
      console.log('\n👤 Admin user found:');
      console.log(`   Username: ${admin.username}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Active: ${admin.isActive ? 'Yes' : 'No'}`);
    } else {
      console.log('\n❌ Admin user not found');
    }
    
    // Check pharma units
    db.get("SELECT * FROM pharma_units WHERE id='pharma-001'", (err, pharmaUnit) => {
      if (err) {
        console.error('❌ Failed to check pharma unit:', err.message);
        process.exit(1);
      }
      
      if (pharmaUnit) {
        console.log('\n🏥 Default pharma unit found:');
        console.log(`   Name: ${pharmaUnit.name}`);
        console.log(`   Email: ${pharmaUnit.contactEmail}`);
        console.log(`   License: ${pharmaUnit.licenseNumber}`);
      } else {
        console.log('\n❌ Default pharma unit not found');
      }
      
      // Check departments count
      db.get("SELECT COUNT(*) as count FROM departments", (err, result) => {
        if (err) {
          console.error('❌ Failed to check departments:', err.message);
          process.exit(1);
        }
        
        console.log(`\n🏢 Departments: ${result.count} found`);
        
        console.log('\n✅ Database check completed!');
        db.close();
      });
    });
  });
});