import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanNonUserData() {
  console.log('🧹 Starting clean-up of non-user data...');

  try {
    // Delete business data in the correct order to respect foreign key constraints
    console.log('Cleaning transactions...');
    await prisma.transaction.deleteMany({});
    
    console.log('Cleaning stakeholder relationships...');
    await prisma.doctorReferral.deleteMany({});
    
    console.log('Cleaning stakeholders...');
    await prisma.doctor.deleteMany({});
    await prisma.businessPartner.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.distributor.deleteMany({});
    await prisma.patient.deleteMany({});
    
    console.log('Cleaning audit logs...');
    await prisma.auditLog.deleteMany({
      where: {
        NOT: {
          action: {
            in: ['USER_LOGIN', 'USER_CREATED', 'SYSTEM_CONFIG_UPDATED']
          }
        }
      }
    });

    console.log('✅ Non-user data cleanup completed successfully!');
    console.log('');
    console.log('🔒 Preserved data:');
    console.log('   ✅ User accounts and permissions');
    console.log('   ✅ System configurations');
    console.log('   ✅ Departments and pharma units');
    console.log('   ✅ Essential audit logs');
    console.log('');
    console.log('🗑️  Removed data:');
    console.log('   ❌ All transactions');
    console.log('   ❌ All stakeholders (doctors, distributors, patients, etc.)');
    console.log('   ❌ Business-related audit logs');
    console.log('');

  } catch (error) {
    console.error('❌ Error during data cleanup:', error);
    throw error;
  }
}

cleanNonUserData()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✅ Clean-up completed successfully');
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Clean-up failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });