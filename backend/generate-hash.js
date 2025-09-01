#!/usr/bin/env node

// Generate bcrypt hash for admin password

const bcrypt = require('bcryptjs');

const password = 'admin123';
const saltRounds = 12;

const hash = bcrypt.hashSync(password, saltRounds);

console.log('Original password:', password);
console.log('Generated hash:', hash);

// Verify the hash works
const isValid = bcrypt.compareSync(password, hash);
console.log('Hash verification:', isValid ? '✅ Valid' : '❌ Invalid');