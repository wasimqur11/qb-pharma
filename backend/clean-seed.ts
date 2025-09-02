import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Starting database cleanup (removing all data except users)...');

  try {
    // Delete all data in order (respecting foreign key constraints)
    
    // 1. Delete settlement records first (they reference business partners)
    const settlementRecords = await prisma.settlementRecord.deleteMany({});
    console.log(`✅ Deleted ${settlementRecords.count} settlement records`);

    // 2. Delete all transactions
    const transactions = await prisma.transaction.deleteMany({});
    console.log(`✅ Deleted ${transactions.count} transactions`);

    // 3. Delete all stakeholders
    const patients = await prisma.patient.deleteMany({});
    console.log(`✅ Deleted ${patients.count} patients`);

    const employees = await prisma.employee.deleteMany({});
    console.log(`✅ Deleted ${employees.count} employees`);

    const distributors = await prisma.distributor.deleteMany({});
    console.log(`✅ Deleted ${distributors.count} distributors`);

    const businessPartners = await prisma.businessPartner.deleteMany({});
    console.log(`✅ Deleted ${businessPartners.count} business partners`);

    const doctors = await prisma.doctor.deleteMany({});
    console.log(`✅ Deleted ${doctors.count} doctors`);

    // 4. Delete departments
    const departments = await prisma.department.deleteMany({});
    console.log(`✅ Deleted ${departments.count} departments`);

    // Keep users, user permissions, and pharma units intact
    
    console.log('🎉 Database cleanup completed successfully!');
    console.log('');
    console.log('Remaining data:');
    console.log('===============');
    
    const userCount = await prisma.user.count();
    const pharmaUnitCount = await prisma.pharmaUnit.count();
    const permissionCount = await prisma.userPermission.count();
    
    console.log(`Users: ${userCount}`);
    console.log(`Pharma Units: ${pharmaUnitCount}`);
    console.log(`User Permissions: ${permissionCount}`);
    console.log('');
    console.log('Login credentials remain the same:');
    console.log('Super Admin - Username: admin, Password: admin123');
    console.log('Doctor - Username: dr.ahmed, Password: doctor123');
    console.log('Business Partner - Username: wasim.partner, Password: partner123');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

cleanDatabase()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });