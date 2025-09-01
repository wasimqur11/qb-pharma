#!/usr/bin/env node

// Update admin password hash in database

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'qb-pharma.db');
const password = 'admin123';
const newHash = '$2a$12$iGlEQPQ.tobThWWD1weDv.4.7DFW8W8nrMPWpqDe57iFnz1hd9ZTi';

console.log('🔐 Updating admin password hash in database...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  }
});

// Update admin password
const sql = `UPDATE users SET passwordHash = ? WHERE username = 'admin'`;

db.run(sql, [newHash], function(err) {
  if (err) {
    console.error('❌ Failed to update password:', err.message);
    process.exit(1);
  }
  
  if (this.changes === 0) {
    console.error('❌ Admin user not found');
    process.exit(1);
  }
  
  console.log('✅ Admin password hash updated successfully');
  
  // Verify the update
  db.get("SELECT passwordHash FROM users WHERE username='admin'", (err, result) => {
    if (err) {
      console.error('❌ Failed to verify update:', err.message);
      process.exit(1);
    }
    
    console.log('🔍 Verifying password hash...');
    const isValid = bcrypt.compareSync(password, result.passwordHash);
    console.log('Password verification:', isValid ? '✅ Valid' : '❌ Invalid');
    
    if (isValid) {
      console.log('🎉 Admin password is ready for authentication!');
      console.log('📝 Login credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    }
    
    db.close();
  });
});