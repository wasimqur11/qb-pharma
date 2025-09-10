import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('👤 Starting user-only database seeding...');

  try {
    // Create a default pharma unit
    const pharmaUnit = await prisma.pharmaUnit.upsert({
      where: { licenseNumber: 'PH-001-2024' },
      update: {},
      create: {
        name: 'QB Pharma Main Unit',
        address: '123 Medical Street, Healthcare City, HC 12345',
        contactEmail: 'admin@qbpharma.com',
        contactPhone: '+1-555-0123',
        licenseNumber: 'PH-001-2024',
        isActive: true
      }
    });

    console.log('✅ Created pharma unit:', pharmaUnit.name);

    // Create default super admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const superAdmin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@qbpharma.com',
        passwordHash: hashedPassword,
        name: 'System Administrator',
        phone: '+1-555-0123',
        role: 'super_admin',
        pharmaUnitId: pharmaUnit.id,
        isActive: true
      }
    });

    console.log('✅ Created super admin user:', superAdmin.username);

    // Create default permissions for super admin
    await prisma.userPermission.createMany({
      data: [
        {
          userId: superAdmin.id,
          module: 'pharma_units',
          actions: 'create,read,update,delete',
          scope: 'all'
        },
        {
          userId: superAdmin.id,
          module: 'users',
          actions: 'create,read,update,delete',
          scope: 'all'
        },
        {
          userId: superAdmin.id,
          module: 'transactions',
          actions: 'create,read,update,delete',
          scope: 'all'
        },
        {
          userId: superAdmin.id,
          module: 'stakeholders',
          actions: 'create,read,update,delete',
          scope: 'all'
        },
        {
          userId: superAdmin.id,
          module: 'reports',
          actions: 'read,export',
          scope: 'all'
        },
        {
          userId: superAdmin.id,
          module: 'settlements',
          actions: 'create,read,update',
          scope: 'all'
        },
        {
          userId: superAdmin.id,
          module: 'dashboard',
          actions: 'read',
          scope: 'all'
        },
        {
          userId: superAdmin.id,
          module: 'system_settings',
          actions: 'read,update',
          scope: 'all'
        },
        {
          userId: superAdmin.id,
          module: 'configurations',
          actions: 'create,read,update,delete',
          scope: 'all'
        }
      ]
    });

    console.log('✅ Created super admin permissions');

    // Create data operator user with limited access
    const operatorPassword = await bcrypt.hash('operator123', 12);
    
    const dataOperator = await prisma.user.upsert({
      where: { username: 'dataoperator' },
      update: {},
      create: {
        username: 'dataoperator',
        email: 'operator@qbpharma.com',
        passwordHash: operatorPassword,
        name: 'Data Operator',
        phone: '+1-555-0124',
        role: 'operator',
        pharmaUnitId: pharmaUnit.id,
        isActive: true
      }
    });

    console.log('✅ Created data operator user:', dataOperator.username);

    // Create limited permissions for data operator
    await prisma.userPermission.createMany({
      data: [
        {
          userId: dataOperator.id,
          module: 'transactions',
          actions: 'create,read,update',
          scope: 'unit'
        },
        {
          userId: dataOperator.id,
          module: 'stakeholders',
          actions: 'create,read,update',
          scope: 'unit'
        },
        {
          userId: dataOperator.id,
          module: 'reports',
          actions: 'read',
          scope: 'unit'
        },
        {
          userId: dataOperator.id,
          module: 'dashboard',
          actions: 'read',
          scope: 'unit'
        }
      ]
    });

    console.log('✅ Created data operator permissions');

    // Create sample departments
    const departments = [
      { name: 'Administration', description: 'Administrative staff and management' },
      { name: 'Pharmacy', description: 'Pharmacy operations and dispensing' },
      { name: 'Clinical', description: 'Clinical services and consultations' },
      { name: 'Finance', description: 'Financial management and accounting' },
      { name: 'IT Support', description: 'Information technology and support' }
    ];

    for (const dept of departments) {
      await prisma.department.upsert({
        where: { name: dept.name },
        update: {},
        create: dept
      });
    }

    console.log('✅ Created sample departments');

    console.log('🎉 User-only database seeding completed successfully!');
    console.log('');
    console.log('Default login credentials:');
    console.log('==========================');
    console.log('Super Admin:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('');
    console.log('Data Operator:');
    console.log('  Username: dataoperator');
    console.log('  Password: operator123');
    console.log('  Access: Limited to transactions, stakeholders, reports (unit scope)');
    console.log('');

  } catch (error) {
    console.error('❌ Error during user seeding:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });