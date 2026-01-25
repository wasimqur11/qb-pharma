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

    // Weekly Insights Configurations
    const weeklyInsightsConfigs = [
      {
        category: 'weekly_insights',
        key: 'target_payment_percentage',
        value: '10',
        dataType: 'number',
        description: 'Target weekly payment as percentage of total distributor credit',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      },
      {
        category: 'weekly_insights',
        key: 'sales_allocation_percentage',
        value: '75',
        dataType: 'number',
        description: 'Percentage of gross sales allocated for distributor payments',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      },
      {
        category: 'weekly_insights',
        key: 'target_profit_margin_min',
        value: '20',
        dataType: 'number',
        description: 'Minimum target profit margin percentage',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      },
      {
        category: 'weekly_insights',
        key: 'target_profit_margin_max',
        value: '25',
        dataType: 'number',
        description: 'Maximum target profit margin percentage',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      },
      {
        category: 'weekly_insights',
        key: 'healthy_coverage_threshold',
        value: '100',
        dataType: 'number',
        description: 'Minimum sales coverage ratio for healthy status',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      },
      {
        category: 'weekly_insights',
        key: 'cautionary_coverage_threshold',
        value: '80',
        dataType: 'number',
        description: 'Minimum sales coverage ratio for cautionary status',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      },
      {
        category: 'weekly_insights',
        key: 'warning_coverage_threshold',
        value: '50',
        dataType: 'number',
        description: 'Minimum sales coverage ratio for warning status',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      },
      {
        category: 'weekly_insights',
        key: 'optimal_inventory_weeks_min',
        value: '6',
        dataType: 'number',
        description: 'Minimum optimal weeks of inventory coverage',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      },
      {
        category: 'weekly_insights',
        key: 'optimal_inventory_weeks_max',
        value: '8',
        dataType: 'number',
        description: 'Maximum optimal weeks of inventory coverage',
        createdBy: 'user-001',
        updatedBy: 'user-001'
      }
    ];

    const allConfigs = [...paymentConfigs, ...systemConfigs, ...reportConfigs, ...weeklyInsightsConfigs];

    // Create configurations only if they don't exist (conditional seeding)
    for (const config of allConfigs) {
      const existing = await prisma.systemConfiguration.findUnique({
        where: {
          category_key: {
            category: config.category,
            key: config.key
          }
        }
      });

      if (!existing) {
        await prisma.systemConfiguration.create({
          data: config
        });
        console.log(`✅ Created configuration: ${config.category}.${config.key}`);
      } else {
        console.log(`⏭️  Skipped existing configuration: ${config.category}.${config.key}`);
      }
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

    console.log('\n📊 Weekly Insights Configurations:');
    const weeklyInsightsConfs = await prisma.systemConfiguration.findMany({
      where: { category: 'weekly_insights' },
      orderBy: { key: 'asc' }
    });

    weeklyInsightsConfs.forEach(config => {
      console.log(`   ${config.key}: ${config.value} - ${config.description}`);
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