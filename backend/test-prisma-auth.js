#!/usr/bin/env node

// Test Prisma authentication directly

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔍 Testing Prisma authentication...');
    
    // Find user with Prisma (same as backend code)
    const user = await prisma.user.findUnique({
      where: { username: 'admin' },
      include: {
        userPermissions: true,
        pharmaUnit: true
      }
    });

    if (!user) {
      console.error('❌ User not found via Prisma');
      return;
    }

    console.log('👤 User found via Prisma:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
    console.log(`   Password Hash: ${user.passwordHash.substring(0, 20)}...`);
    console.log(`   Pharma Unit: ${user.pharmaUnit ? user.pharmaUnit.name : 'None'}`);
    console.log(`   Permissions: ${user.userPermissions.length} found`);

    if (!user.isActive) {
      console.error('❌ Account is inactive');
      return;
    }

    // Test password comparison (same as backend code)
    console.log('\n🔐 Testing password comparison...');
    const isValidPassword = await bcrypt.compare('admin123', user.passwordHash);
    console.log(`Password Match: ${isValidPassword ? '✅ Valid' : '❌ Invalid'}`);
    
    if (isValidPassword) {
      console.log('\n🎉 Prisma authentication test successful!');
      console.log('The login should work via API');
    } else {
      console.log('\n❌ Password comparison failed via Prisma');
    }
    
  } catch (error) {
    console.error('❌ Prisma test error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();