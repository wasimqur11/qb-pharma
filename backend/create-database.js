#!/usr/bin/env node

// QB Pharma Database Setup Script (Node.js version)
// Creates SQLite database tables and inserts default data

const fs = require('fs');
const path = require('path');

console.log('🗄️ Setting up QB Pharma SQLite database...');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Created data directory...');
}

// Database file path
const dbPath = path.join(dataDir, 'qb-pharma.db');

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.log('📁 Creating new SQLite database file...');
  fs.writeFileSync(dbPath, '');
} else {
  console.log('📁 Using existing SQLite database file...');
}

console.log('📊 Creating database tables and default data...');

// Import SQLite3
let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (error) {
  console.log('⚠️  SQLite3 module not found, installing...');
  const { execSync } = require('child_process');
  
  try {
    execSync('npm install sqlite3', { stdio: 'inherit', cwd: __dirname });
    sqlite3 = require('sqlite3').verbose();
    console.log('✅ SQLite3 installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install SQLite3:', installError.message);
    process.exit(1);
  }
}

// Read SQL script
const sqlScript = fs.readFileSync(path.join(__dirname, 'create-tables.sql'), 'utf8');

// Create database connection and execute SQL
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  }
});

// Split SQL script into individual statements
const statements = sqlScript.split(';').filter(statement => statement.trim().length > 0);

// Execute each statement
let completed = 0;
const total = statements.length;

statements.forEach((statement, index) => {
  db.run(statement.trim(), (err) => {
    if (err) {
      console.error(`❌ Failed to execute statement ${index + 1}:`, err.message);
      console.error('Statement:', statement.trim().substring(0, 100) + '...');
    }
    
    completed++;
    if (completed === total) {
      // Check if tables were created
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
          console.error('❌ Failed to check tables:', err.message);
          process.exit(1);
        }
        
        if (tables.length === 0) {
          console.error('❌ Failed to create database tables');
          process.exit(1);
        } else {
          console.log('✅ Database tables created successfully:');
          tables.forEach(table => console.log(`   ${table.name}`));
        }
        
        // Check if admin user exists
        db.get("SELECT COUNT(*) as count FROM users WHERE username='admin'", (err, result) => {
          if (err) {
            console.error('❌ Failed to check admin user:', err.message);
            process.exit(1);
          }
          
          if (result.count > 0) {
            console.log('✅ Admin user exists in database');
            console.log('📝 Login credentials:');
            console.log('   Username: admin');
            console.log('   Password: admin123');
          } else {
            console.error('❌ Admin user was not created');
            process.exit(1);
          }
          
          // Get file size
          const stats = fs.statSync(dbPath);
          const fileSizeInBytes = stats.size;
          const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(1);
          
          console.log('🎉 Database setup completed successfully!');
          console.log(`💾 Database location: ${dbPath}`);
          console.log(`📊 Database size: ${fileSizeInKB}KB`);
          
          db.close();
          process.exit(0);
        });
      });
    }
  });
});