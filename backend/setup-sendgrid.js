const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupSendGrid() {
  try {
    console.log('Setting up SendGrid configuration...');

    // You'll need to replace 'YOUR_SENDGRID_API_KEY' with your actual API key
    const sendgridApiKey = 'YOUR_SENDGRID_API_KEY'; // Get this from SendGrid dashboard

    const configs = [
      {
        category: 'email',
        key: 'smtpHost',
        value: 'smtp.sendgrid.net',
        description: 'SendGrid SMTP server'
      },
      {
        category: 'email',
        key: 'smtpPort',
        value: '587',
        description: 'SendGrid SMTP port'
      },
      {
        category: 'email',
        key: 'smtpUser',
        value: 'apikey',
        description: 'SendGrid username (always "apikey")'
      },
      {
        category: 'email',
        key: 'smtpPassword',
        value: sendgridApiKey,
        description: 'SendGrid API key'
      },
      {
        category: 'email',
        key: 'fromName',
        value: 'QB Pharma System',
        description: 'Email sender name'
      },
      {
        category: 'email',
        key: 'fromEmail',
        value: 'qureshimitv@gmail.com',
        description: 'Verified sender email'
      },
      {
        category: 'email',
        key: 'enableTLS',
        value: 'true',
        description: 'Enable TLS encryption'
      }
    ];

    for (const config of configs) {
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
          updatedAt: new Date()
        },
        create: {
          category: config.category,
          key: config.key,
          value: config.value,
          dataType: 'string',
          description: config.description,
          isEditable: true,
          createdBy: '1',
          updatedBy: '1'
        }
      });

      console.log(`✅ Configured: ${config.key}`);
    }

    console.log('✅ SendGrid configuration completed!');
    console.log('📧 Now update the API key above and run again');

  } catch (error) {
    console.error('❌ Failed to setup SendGrid:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupSendGrid();