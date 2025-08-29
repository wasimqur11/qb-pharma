import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

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
          actions: ['create', 'read', 'update', 'delete'],
          scope: 'all'
        },
        {
          userId: superAdmin.id,
          module: 'users',
          actions: ['create', 'read', 'update', 'delete'],
          scope: 'all'
        },
        {
          userId: superAdmin.id,
          module: 'transactions',
          actions: ['create', 'read', 'update', 'delete'],
          scope: 'all'
        },
        {
          userId: superAdmin.id,
          module: 'stakeholders',
          actions: ['create', 'read', 'update', 'delete'],
          scope: 'all'
        },
        {
          userId: superAdmin.id,
          module: 'reports',
          actions: ['read', 'export'],
          scope: 'all'
        },
        {
          userId: superAdmin.id,
          module: 'settlements',
          actions: ['create', 'read', 'update'],
          scope: 'all'
        },
        {
          userId: superAdmin.id,
          module: 'dashboard',
          actions: ['read'],
          scope: 'all'
        },
        {
          userId: superAdmin.id,
          module: 'system_settings',
          actions: ['read', 'update'],
          scope: 'all'
        }
      ],
      skipDuplicates: true
    });

    console.log('✅ Created super admin permissions');

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

    // Create sample doctor
    const doctor = await prisma.doctor.create({
      data: {
        name: 'Dr. Ahmed Hassan',
        consultationFee: 50.00,
        commissionRate: 15.0,
        email: 'dr.ahmed@qbpharma.com',
        phone: '+1-555-0124',
        pharmaUnitId: pharmaUnit.id
      }
    });

    console.log('✅ Created sample doctor:', doctor.name);

    // Create sample business partner
    const partner = await prisma.businessPartner.create({
      data: {
        name: 'Wasim Qureshi',
        ownershipPercentage: 35.0,
        email: 'wasim@qbpharma.com',
        phone: '+1-555-0125',
        pharmaUnitId: pharmaUnit.id
      }
    });

    console.log('✅ Created sample business partner:', partner.name);

    // Create sample distributor
    const distributor = await prisma.distributor.create({
      data: {
        name: 'MediSupply Inc.',
        contactPerson: 'John Smith',
        email: 'orders@medisupply.com',
        phone: '+1-555-0126',
        address: '456 Distribution Ave, Supply City, SC 67890',
        creditBalance: 5000.00,
        paymentSchedule: 'monthly',
        paymentPercentage: 80.0,
        nextPaymentDue: '2024-02-15',
        pharmaUnitId: pharmaUnit.id
      }
    });

    console.log('✅ Created sample distributor:', distributor.name);

    // Create sample employee
    const employee = await prisma.employee.create({
      data: {
        name: 'Sarah Johnson',
        salary: 3000.00,
        department: 'Pharmacy',
        email: 'sarah@qbpharma.com',
        phone: '+1-555-0127',
        salaryDueDate: '2024-01-31',
        salaryFrequency: 'monthly',
        pharmaUnitId: pharmaUnit.id
      }
    });

    console.log('✅ Created sample employee:', employee.name);

    // Create sample patient
    const patient = await prisma.patient.create({
      data: {
        name: 'Mary Wilson',
        email: 'mary.wilson@email.com',
        phone: '+1-555-0128',
        address: '789 Patient Lane, Health City, HC 13579',
        dateOfBirth: '1985-06-15',
        creditLimit: 500.00,
        currentCredit: 0.00,
        isActive: true,
        pharmaUnitId: pharmaUnit.id
      }
    });

    console.log('✅ Created sample patient:', patient.name);

    // Create sample transactions
    const sampleTransactions = [
      {
        category: 'pharmacy_sale' as const,
        stakeholderId: patient.id,
        stakeholderType: 'patient' as const,
        amount: 125.50,
        description: 'Prescription medication sale - Antibiotics and vitamins',
        billNo: 'BILL-2024-001',
        date: new Date('2024-01-15T10:30:00Z'),
        createdBy: superAdmin.id,
        pharmaUnitId: pharmaUnit.id
      },
      {
        category: 'consultation_fee' as const,
        stakeholderId: doctor.id,
        stakeholderType: 'doctor' as const,
        amount: 50.00,
        description: 'General consultation fee',
        billNo: 'CONS-2024-001',
        date: new Date('2024-01-15T09:00:00Z'),
        createdBy: superAdmin.id,
        pharmaUnitId: pharmaUnit.id
      },
      {
        category: 'distributor_credit_purchase' as const,
        stakeholderId: distributor.id,
        stakeholderType: 'distributor' as const,
        amount: -2500.00,
        description: 'Monthly inventory purchase from distributor',
        billNo: 'PO-2024-001',
        date: new Date('2024-01-10T14:00:00Z'),
        createdBy: superAdmin.id,
        pharmaUnitId: pharmaUnit.id
      },
      {
        category: 'employee_payment' as const,
        stakeholderId: employee.id,
        stakeholderType: 'employee' as const,
        amount: -3000.00,
        description: 'Monthly salary payment - January 2024',
        date: new Date('2024-01-31T16:00:00Z'),
        createdBy: superAdmin.id,
        pharmaUnitId: pharmaUnit.id
      },
      {
        category: 'sales_profit_distribution' as const,
        stakeholderId: partner.id,
        stakeholderType: 'business_partner' as const,
        amount: -875.00,
        description: 'Monthly profit distribution - 35% share',
        date: new Date('2024-01-31T17:00:00Z'),
        createdBy: superAdmin.id,
        pharmaUnitId: pharmaUnit.id
      }
    ];

    await prisma.transaction.createMany({
      data: sampleTransactions
    });

    console.log('✅ Created sample transactions');

    // Create doctor user account linked to the doctor
    const doctorPassword = await bcrypt.hash('doctor123', 12);
    const doctorUser = await prisma.user.create({
      data: {
        username: 'dr.ahmed',
        email: 'dr.ahmed@qbpharma.com',
        passwordHash: doctorPassword,
        name: 'Dr. Ahmed Hassan',
        phone: '+1-555-0124',
        role: 'doctor',
        pharmaUnitId: pharmaUnit.id,
        linkedStakeholderId: doctor.id,
        linkedStakeholderType: 'doctor',
        isActive: true
      }
    });

    // Create doctor permissions
    await prisma.userPermission.createMany({
      data: [
        {
          userId: doctorUser.id,
          module: 'transactions',
          actions: ['read'],
          scope: 'own'
        },
        {
          userId: doctorUser.id,
          module: 'dashboard',
          actions: ['read'],
          scope: 'own'
        },
        {
          userId: doctorUser.id,
          module: 'reports',
          actions: ['read'],
          scope: 'own'
        }
      ]
    });

    console.log('✅ Created doctor user account:', doctorUser.username);

    // Create partner user account linked to the business partner
    const partnerPassword = await bcrypt.hash('partner123', 12);
    const partnerUser = await prisma.user.create({
      data: {
        username: 'wasim.partner',
        email: 'wasim@qbpharma.com',
        passwordHash: partnerPassword,
        name: 'Wasim Qureshi',
        phone: '+1-555-0125',
        role: 'partner',
        pharmaUnitId: pharmaUnit.id,
        linkedStakeholderId: partner.id,
        linkedStakeholderType: 'business_partner',
        isActive: true
      }
    });

    // Create partner permissions
    await prisma.userPermission.createMany({
      data: [
        {
          userId: partnerUser.id,
          module: 'transactions',
          actions: ['read'],
          scope: 'own'
        },
        {
          userId: partnerUser.id,
          module: 'dashboard',
          actions: ['read'],
          scope: 'own'
        },
        {
          userId: partnerUser.id,
          module: 'reports',
          actions: ['read'],
          scope: 'own'
        },
        {
          userId: partnerUser.id,
          module: 'settlements',
          actions: ['read'],
          scope: 'own'
        }
      ]
    });

    console.log('✅ Created partner user account:', partnerUser.username);

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Default login credentials:');
    console.log('==========================');
    console.log('Super Admin:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('');
    console.log('Doctor:');
    console.log('  Username: dr.ahmed');
    console.log('  Password: doctor123');
    console.log('');
    console.log('Business Partner:');
    console.log('  Username: wasim.partner');
    console.log('  Password: partner123');
    console.log('');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
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