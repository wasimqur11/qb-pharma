#!/usr/bin/env node

// Debug exact user data for Prisma compatibility

const sqlite3 = require('sqlite3').verbose();
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'qb-pharma.db');
const prisma = new PrismaClient();

console.log('🔍 Comparing raw SQLite data vs Prisma query...');

const db = new sqlite3.Database(dbPath);

// Raw SQLite query
db.get("SELECT * FROM users WHERE username = 'admin'", async (err, sqliteUser) => {
  if (err) {
    console.error('❌ SQLite error:', err.message);
    return;
  }
  
  console.log('\n📊 Raw SQLite data:');
  console.log(JSON.stringify(sqliteUser, null, 2));
  
  // Prisma query
  try {
    console.log('\n🔍 Attempting Prisma query...');
    
    // Try different query approaches
    const allUsers = await prisma.user.findMany();
    console.log(`\n📈 Total users found by Prisma: ${allUsers.length}`);
    
    if (allUsers.length > 0) {
      console.log('First user found by Prisma:');
      console.log(JSON.stringify(allUsers[0], null, 2));
    }
    
    // Try finding by username
    const userByUsername = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    console.log('\n👤 User found by username:', userByUsername ? '✅ Found' : '❌ Not found');
    if (userByUsername) {
      console.log(JSON.stringify(userByUsername, null, 2));
    }
    
    // Try raw Prisma query
    const rawUser = await prisma.$queryRaw`SELECT * FROM users WHERE username = 'admin'`;
    console.log('\n🔍 Raw Prisma query result:', rawUser.length > 0 ? '✅ Found' : '❌ Not found');
    if (rawUser.length > 0) {
      console.log(JSON.stringify(rawUser[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Prisma error:', error.message);
    console.error('Full error:', error);
  }
  
  db.close();
  await prisma.$disconnect();
});