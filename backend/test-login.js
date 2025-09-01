#!/usr/bin/env node

// Test login process step by step

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'qb-pharma.db');
const testPassword = 'admin123';

console.log('🔍 Testing login process step by step...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  }
});

// Get admin user
db.get("SELECT * FROM users WHERE username='admin'", (err, user) => {
  if (err) {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  }
  
  if (!user) {
    console.error('❌ Admin user not found');
    process.exit(1);
  }
  
  console.log('👤 Admin user found:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Username: ${user.username}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
  console.log(`   Password Hash: ${user.passwordHash.substring(0, 20)}...`);
  
  if (!user.isActive) {
    console.error('❌ Account is inactive');
    process.exit(1);
  }
  
  // Test password comparison
  console.log('\n🔐 Testing password comparison...');
  console.log(`Test Password: ${testPassword}`);
  
  bcrypt.compare(testPassword, user.passwordHash).then((isValid) => {
    console.log(`Password Match: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    
    if (isValid) {
      console.log('\n🎉 Login test successful!');
      console.log('📝 Use these credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('\n❌ Password comparison failed');
      
      // Let's also test with a fresh hash
      const newHash = bcrypt.hashSync(testPassword, 12);
      console.log(`Fresh hash for comparison: ${newHash.substring(0, 20)}...`);
      
      const freshTest = bcrypt.compareSync(testPassword, newHash);
      console.log(`Fresh hash test: ${freshTest ? '✅ Valid' : '❌ Invalid'}`);
    }
    
    db.close();
  }).catch((error) => {
    console.error('❌ Password comparison error:', error.message);
    db.close();
  });
});