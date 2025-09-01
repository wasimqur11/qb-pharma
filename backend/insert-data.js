#!/usr/bin/env node

// Insert default data into QB Pharma Database

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'qb-pharma.db');

console.log('📊 Inserting default data into QB Pharma database...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  }
});

// Insert data in proper sequence
const insertPharmaUnit = () => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT OR IGNORE INTO pharma_units (id, name, address, contactEmail, contactPhone, licenseNumber)
                 VALUES ('pharma-001', 'QB Pharma Main Unit', '123 Medical Street, Healthcare City', 'admin@qbpharma.com', '+1-555-0123', 'PH-001-2024')`;
    
    db.run(sql, function(err) {
      if (err) {
        reject(err);
      } else {
        console.log('✅ Default pharma unit inserted');
        resolve(this.changes);
      }
    });
  });
};

const insertAdminUser = () => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT OR IGNORE INTO users (id, username, email, passwordHash, name, phone, role, pharmaUnitId)
                 VALUES ('user-001', 'admin', 'admin@qbpharma.com', '$2a$12$LQv3c1yqBw/fNKk9aQXfnOer7w2L2bFw8OIZ4TP.8qz9Vn.jA.3O2', 'System Administrator', '+1-555-0123', 'super_admin', 'pharma-001')`;
    
    db.run(sql, function(err) {
      if (err) {
        reject(err);
      } else {
        console.log('✅ Admin user inserted');
        resolve(this.changes);
      }
    });
  });
};

const insertDepartments = () => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT OR IGNORE INTO departments (id, name, description) VALUES
                 ('dept-001', 'Administration', 'Administrative staff and management'),
                 ('dept-002', 'Pharmacy', 'Pharmacy operations and dispensing'),
                 ('dept-003', 'Clinical', 'Clinical services and consultations'),
                 ('dept-004', 'Finance', 'Financial management and accounting'),
                 ('dept-005', 'IT Support', 'Information technology and support')`;
    
    db.run(sql, function(err) {
      if (err) {
        reject(err);
      } else {
        console.log('✅ Sample departments inserted');
        resolve(this.changes);
      }
    });
  });
};

// Execute insertions sequentially
const executeInserts = async () => {
  try {
    await insertPharmaUnit();
    await insertAdminUser();
    await insertDepartments();
    
    console.log('🎉 All default data inserted successfully!');
    console.log('📝 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
    db.close();
  } catch (error) {
    console.error('❌ Failed to insert data:', error.message);
    db.close();
    process.exit(1);
  }
};

executeInserts();