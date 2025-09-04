import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSystemConfigurations() {
  console.log('🔧 Seeding system configurations...');

  try {
    // Payment Estimation Configurations
    const paymentConfigs = [
      {
        category: 'payment_estimation',
        key: 'profit_allocation_percentage',
        value: '25',
        dataType: 'number',
        description: 'Percentage of weekly sales allocated for profit/expenses',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      },
      {
        category: 'payment_estimation',
        key: 'distributor_allocation_percentage',
        value: '75',
        dataType: 'number',
        description: 'Percentage of weekly sales allocated for distributor payments',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      },
      {
        category: 'payment_estimation',
        key: 'max_distributor_payment_percentage',
        value: '10',
        dataType: 'number',
        description: 'Maximum percentage of distributor credit balance as payment cap',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      }
    ];

    // System Settings
    const systemConfigs = [
      {
        category: 'system_settings',
        key: 'default_credit_limit',
        value: '100000',
        dataType: 'number',
        description: 'Default credit limit for new distributors',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      },
      {
        category: 'system_settings',
        key: 'currency_symbol',
        value: '₹',
        dataType: 'string',
        description: 'Currency symbol used throughout the application',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      },
      {
        category: 'system_settings',
        key: 'company_name',
        value: 'QB Pharma Management System',
        dataType: 'string',
        description: 'Company name displayed in reports and UI',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      }
    ];

    // Report Settings
    const reportConfigs = [
      {
        category: 'report_settings',
        key: 'default_report_days',
        value: '30',
        dataType: 'number',
        description: 'Default number of days for report generation',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      },
      {
        category: 'report_settings',
        key: 'max_export_records',
        value: '10000',
        dataType: 'number',
        description: 'Maximum number of records allowed in exports',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      }
    ];

    const allConfigs = [...paymentConfigs, ...systemConfigs, ...reportConfigs];

    // Upsert each configuration
    for (const config of allConfigs) {
      await prisma.systemConfiguration.upsert({
        where: {
          category_key: {
            category: config.category,
            key: config.key
          }
        },
        update: {
          value: config.value,
          description: config.description,
          updatedBy: config.updatedBy
        },
        create: config
      });
    }

    console.log(`✅ Seeded ${allConfigs.length} system configurations`);
    
    // Display seeded configurations
    console.log('\n📋 Payment Estimation Configurations:');
    const paymentEstimationConfigs = await prisma.systemConfiguration.findMany({
      where: { category: 'payment_estimation' },
      orderBy: { key: 'asc' }
    });
    
    paymentEstimationConfigs.forEach(config => {
      console.log(`   ${config.key}: ${config.value}% - ${config.description}`);
    });

  } catch (error) {
    console.error('❌ Error seeding system configurations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedSystemConfigurations()
  .then(() => {
    console.log('✅ System configuration seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ System configuration seeding failed:', error);
    process.exit(1);
  });