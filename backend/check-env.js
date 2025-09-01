#!/usr/bin/env node

// Check which database file Prisma is actually using

require('dotenv').config();

const path = require('path');
const fs = require('fs');

console.log('🔍 Checking database configuration...');
console.log(`DATABASE_URL: ${process.env.DATABASE_URL}`);

// Parse the file path from DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.startsWith('file:')) {
  const filePath = dbUrl.replace('file:', '');
  console.log(`Parsed file path: ${filePath}`);
  
  // Check if it's relative or absolute
  const absolutePath = path.resolve(__dirname, filePath);
  console.log(`Absolute path: ${absolutePath}`);
  
  // Check if file exists
  const exists = fs.existsSync(absolutePath);
  console.log(`File exists: ${exists ? '✅ Yes' : '❌ No'}`);
  
  if (exists) {
    const stats = fs.statSync(absolutePath);
    console.log(`File size: ${stats.size} bytes`);
    console.log(`Last modified: ${stats.mtime}`);
  }
}

// List all .db files we found
console.log('\n📁 All .db files found:');
const dbFiles = [
  './data/qb-pharma.db',
  './prisma/data/qb-pharma.db', 
  './prisma/dev.db'
];

dbFiles.forEach(file => {
  const absolutePath = path.resolve(__dirname, file);
  if (fs.existsSync(absolutePath)) {
    const stats = fs.statSync(absolutePath);
    console.log(`   ${file} - ${stats.size} bytes (${stats.mtime})`);
  }
});