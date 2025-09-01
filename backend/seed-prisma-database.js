#!/usr/bin/env node

// Seed database using Prisma with admin user and default data

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with Prisma...');

    // Create default pharma unit
    const pharmaUnit = await prisma.pharmaUnit.create({
      data: {
        id: 'pharma-001',
        name: 'QB Pharma Main Unit',
        address: '123 Medical Street, Healthcare City',
        contactEmail: 'admin@qbpharma.com',
        contactPhone: '+1-555-0123',
        licenseNumber: 'PH-001-2024'
      }
    });
    console.log('✅ Default pharma unit created');

    // Create admin user with hashed password
    const passwordHash = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.create({
      data: {
        id: 'user-001',
        username: 'admin',
        email: 'admin@qbpharma.com',
        passwordHash: passwordHash,
        name: 'System Administrator',
        phone: '+1-555-0123',
        role: 'super_admin',
        pharmaUnitId: 'pharma-001',
        isActive: true
      }
    });
    console.log('✅ Admin user created');

    // Create sample departments
    const departments = [
      { id: 'dept-001', name: 'Administration', description: 'Administrative staff and management' },
      { id: 'dept-002', name: 'Pharmacy', description: 'Pharmacy operations and dispensing' },
      { id: 'dept-003', name: 'Clinical', description: 'Clinical services and consultations' },
      { id: 'dept-004', name: 'Finance', description: 'Financial management and accounting' },
      { id: 'dept-005', name: 'IT Support', description: 'Information technology and support' }
    ];

    for (const dept of departments) {
      await prisma.department.create({ data: dept });
    }
    console.log('✅ Sample departments created');

    // Verify data was created
    const userCount = await prisma.user.count();
    const deptCount = await prisma.department.count();
    const pharmaCount = await prisma.pharmaUnit.count();

    console.log('\n📊 Database seeded successfully!');
    console.log(`   Users: ${userCount}`);
    console.log(`   Departments: ${deptCount}`);  
    console.log(`   Pharma Units: ${pharmaCount}`);

    console.log('\n📝 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');

    // Test login
    const testUser = await prisma.user.findUnique({
      where: { username: 'admin' },
      include: { pharmaUnit: true }
    });

    if (testUser) {
      const isValidPassword = await bcrypt.compare('admin123', testUser.passwordHash);
      console.log(`\n🔐 Password verification: ${isValidPassword ? '✅ Valid' : '❌ Invalid'}`);
    }

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();