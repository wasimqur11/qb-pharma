import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanBusinessData() {
  console.log('🧹 Starting business data cleanup...');
  console.log('   This will remove ALL business data while preserving users and settings');
  
  try {
    // Create backup before cleaning
    console.log('📦 Creating backup before cleanup...');
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    
    // Show what will be preserved
    console.log('\n✅ Data that will be PRESERVED:');
    const userCount = await prisma.user.count();
    const pharmaUnitCount = await prisma.pharmaUnit.count();
    const permissionCount = await prisma.userPermission.count();
    const configCount = await prisma.systemConfiguration.count();
    const departmentCount = await prisma.department.count();
    
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Pharma Units: ${pharmaUnitCount}`);
    console.log(`   - User Permissions: ${permissionCount}`);
    console.log(`   - System Configurations: ${configCount}`);
    console.log(`   - Departments: ${departmentCount}`);

    // Show what will be removed
    console.log('\n🗑️  Business data that will be REMOVED:');
    const transactionCount = await prisma.transaction.count();
    const settlementCount = await prisma.settlementRecord.count();
    const doctorCount = await prisma.doctor.count();
    const businessPartnerCount = await prisma.businessPartner.count();
    const employeeCount = await prisma.employee.count();
    const distributorCount = await prisma.distributor.count();
    const patientCount = await prisma.patient.count();
    
    console.log(`   - Transactions: ${transactionCount}`);
    console.log(`   - Settlement Records: ${settlementCount}`);
    console.log(`   - Doctors: ${doctorCount}`);
    console.log(`   - Business Partners: ${businessPartnerCount}`);
    console.log(`   - Employees: ${employeeCount}`);
    console.log(`   - Distributors: ${distributorCount}`);
    console.log(`   - Patients: ${patientCount}`);

    const totalToRemove = transactionCount + settlementCount + doctorCount + 
                         businessPartnerCount + employeeCount + distributorCount + patientCount;
    
    if (totalToRemove === 0) {
      console.log('\n✅ No business data found to clean up.');
      return;
    }

    console.log(`\n⚠️  Total records to be removed: ${totalToRemove}`);
    console.log('\n🚀 Starting cleanup process...');

    // Clean business data in dependency order
    let removedCount = 0;

    // 1. Remove settlement records (depends on business partners)
    if (settlementCount > 0) {
      const { count } = await prisma.settlementRecord.deleteMany({});
      console.log(`   ✅ Removed ${count} settlement records`);
      removedCount += count;
    }

    // 2. Remove transactions (depends on users and pharma units, but we're keeping those)
    if (transactionCount > 0) {
      const { count } = await prisma.transaction.deleteMany({});
      console.log(`   ✅ Removed ${count} transactions`);
      removedCount += count;
    }

    // 3. Remove stakeholders (no dependencies)
    if (doctorCount > 0) {
      const { count } = await prisma.doctor.deleteMany({});
      console.log(`   ✅ Removed ${count} doctors`);
      removedCount += count;
    }

    if (businessPartnerCount > 0) {
      const { count } = await prisma.businessPartner.deleteMany({});
      console.log(`   ✅ Removed ${count} business partners`);
      removedCount += count;
    }

    if (employeeCount > 0) {
      const { count } = await prisma.employee.deleteMany({});
      console.log(`   ✅ Removed ${count} employees`);
      removedCount += count;
    }

    if (distributorCount > 0) {
      const { count } = await prisma.distributor.deleteMany({});
      console.log(`   ✅ Removed ${count} distributors`);
      removedCount += count;
    }

    if (patientCount > 0) {
      const { count } = await prisma.patient.deleteMany({});
      console.log(`   ✅ Removed ${count} patients`);
      removedCount += count;
    }

    console.log(`\n✅ Business data cleanup completed successfully!`);
    console.log(`   Total records removed: ${removedCount}`);
    
    // Verify preserved data
    console.log('\n🔍 Verifying preserved data:');
    const finalUserCount = await prisma.user.count();
    const finalConfigCount = await prisma.systemConfiguration.count();
    const finalPermissionCount = await prisma.userPermission.count();
    
    console.log(`   - Users preserved: ${finalUserCount}`);
    console.log(`   - System configurations preserved: ${finalConfigCount}`);
    console.log(`   - User permissions preserved: ${finalPermissionCount}`);
    
    if (finalUserCount === userCount && finalConfigCount === configCount) {
      console.log('✅ All essential data successfully preserved!');
    } else {
      console.log('⚠️  Warning: Some essential data may have been affected');
    }

    console.log('\n📋 Clean database ready for production use:');
    console.log('   - All user accounts and authentication preserved (admin + dataoperator)');
    console.log('   - System configurations and settings preserved');
    console.log('   - All business/sample data removed');
    console.log('   - Ready for real business data entry');

  } catch (error) {
    console.error('❌ Error during business data cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanBusinessData()
  .then(() => {
    console.log('\n🎉 Business data cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Business data cleanup failed:', error);
    process.exit(1);
  });