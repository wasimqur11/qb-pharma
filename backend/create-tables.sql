-- QB Pharma Database Tables Creation Script
-- This script creates the essential tables needed for QB Pharma to function

-- Create pharma_units table
CREATE TABLE IF NOT EXISTS pharma_units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    contactEmail TEXT NOT NULL,
    contactPhone TEXT NOT NULL,
    licenseNumber TEXT UNIQUE NOT NULL,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL,
    pharmaUnitId TEXT,
    linkedStakeholderId TEXT,
    linkedStakeholderType TEXT,
    isActive INTEGER DEFAULT 1,
    lastLogin TEXT,
    createdBy TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pharmaUnitId) REFERENCES pharma_units(id)
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    consultationFee REAL NOT NULL,
    commissionRate REAL NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    pharmaUnitId TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pharmaUnitId) REFERENCES pharma_units(id)
);

-- Create business_partners table
CREATE TABLE IF NOT EXISTS business_partners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ownershipPercentage REAL NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    pharmaUnitId TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pharmaUnitId) REFERENCES pharma_units(id)
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    salary REAL NOT NULL,
    department TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    salaryDueDate TEXT NOT NULL,
    lastPaidDate TEXT,
    salaryFrequency TEXT DEFAULT 'monthly',
    pharmaUnitId TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pharmaUnitId) REFERENCES pharma_units(id)
);

-- Create distributors table
CREATE TABLE IF NOT EXISTS distributors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contactPerson TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    creditBalance REAL DEFAULT 0,
    initialBalanceDate TEXT,
    paymentSchedule TEXT NOT NULL,
    paymentPercentage REAL NOT NULL,
    nextPaymentDue TEXT NOT NULL,
    lastPaymentDate TEXT,
    pharmaUnitId TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pharmaUnitId) REFERENCES pharma_units(id)
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    address TEXT,
    dateOfBirth TEXT,
    emergencyContact TEXT,
    emergencyPhone TEXT,
    creditLimit REAL DEFAULT 0,
    currentCredit REAL DEFAULT 0,
    lastVisit TEXT,
    notes TEXT,
    isActive INTEGER DEFAULT 1,
    pharmaUnitId TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pharmaUnitId) REFERENCES pharma_units(id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    stakeholderId TEXT,
    stakeholderType TEXT,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    billNo TEXT,
    date TEXT NOT NULL,
    createdBy TEXT NOT NULL,
    pharmaUnitId TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pharmaUnitId) REFERENCES pharma_units(id),
    FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert default pharma unit
INSERT OR IGNORE INTO pharma_units (id, name, address, contactEmail, contactPhone, licenseNumber)
VALUES ('pharma-001', 'QB Pharma Main Unit', '123 Medical Street, Healthcare City', 'admin@qbpharma.com', '+1-555-0123', 'PH-001-2024');

-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO users (id, username, email, passwordHash, name, phone, role, pharmaUnitId)
VALUES ('user-001', 'admin', 'admin@qbpharma.com', '$2a$12$LQv3c1yqBw/fNKk9aQXfnOer7w2L2bFw8OIZ4TP.8qz9Vn.jA.3O2', 'System Administrator', '+1-555-0123', 'super_admin', 'pharma-001');

-- Insert sample departments
INSERT OR IGNORE INTO departments (id, name, description) VALUES
('dept-001', 'Administration', 'Administrative staff and management'),
('dept-002', 'Pharmacy', 'Pharmacy operations and dispensing'),
('dept-003', 'Clinical', 'Clinical services and consultations'),
('dept-004', 'Finance', 'Financial management and accounting'),
('dept-005', 'IT Support', 'Information technology and support');