import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';
import NotificationService from '../services/notificationService';

const router = express.Router();

// Apply authentication to all notification routes
router.use(authenticateToken);

// Validation schemas
const NotificationConfigSchema = z.object({
  category: z.enum(['email', 'sms', 'whatsapp']),
  key: z.string().min(1),
  value: z.string(),
  description: z.string().optional()
});

const EmailConfigSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP host is required'),
  smtpPort: z.number().int().min(1).max(65535),
  smtpUser: z.string().email('Valid email is required'),
  smtpPassword: z.string().min(1, 'Password is required'),
  fromName: z.string().min(1, 'From name is required'),
  fromEmail: z.string().email('Valid from email is required'),
  enableTLS: z.boolean().default(true)
});

const SMSConfigSchema = z.object({
  provider: z.enum(['twilio', 'aws-sns']),
  apiKey: z.string().min(1, 'API key is required'),
  apiSecret: z.string().min(1, 'API secret is required'),
  fromNumber: z.string().min(1, 'From number is required')
});

const WhatsAppConfigSchema = z.object({
  provider: z.enum(['twilio', 'meta']),
  apiKey: z.string().min(1, 'API key is required'),
  apiSecret: z.string().min(1, 'API secret is required'),
  fromNumber: z.string().min(1, 'From number is required')
});

// Get all notification configurations
router.get('/config', requireRole(['super_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const configs = await prisma.systemConfiguration.findMany({
      where: {
        category: {
          in: ['email', 'sms', 'whatsapp']
        }
      },
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    // Group configs by category
    const groupedConfigs = configs.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = {};
      }

      // Mask sensitive values (passwords, secrets)
      let value = config.value;
      if (config.key.toLowerCase().includes('password') ||
          config.key.toLowerCase().includes('secret') ||
          config.key.toLowerCase().includes('key')) {
        value = '***masked***';
      }

      acc[config.category][config.key] = {
        value,
        description: config.description,
        isEditable: config.isEditable,
        updatedAt: config.updatedAt
      };
      return acc;
    }, {} as Record<string, any>);

    res.json({
      configurations: groupedConfigs,
      categories: ['email', 'sms', 'whatsapp']
    });
  } catch (error) {
    console.error('Get notification configs error:', error);
    res.status(500).json({ error: 'Failed to fetch notification configurations' });
  }
});

// Update email configuration
router.put('/config/email', requireRole(['super_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const emailConfig = EmailConfigSchema.parse(req.body);

    const configsToUpdate = [
      { key: 'smtpHost', value: emailConfig.smtpHost, description: 'SMTP server hostname' },
      { key: 'smtpPort', value: emailConfig.smtpPort.toString(), description: 'SMTP server port' },
      { key: 'smtpUser', value: emailConfig.smtpUser, description: 'SMTP username/email' },
      { key: 'smtpPassword', value: emailConfig.smtpPassword, description: 'SMTP password' },
      { key: 'fromName', value: emailConfig.fromName, description: 'Sender name' },
      { key: 'fromEmail', value: emailConfig.fromEmail, description: 'Sender email address' },
      { key: 'enableTLS', value: emailConfig.enableTLS.toString(), description: 'Enable TLS encryption' }
    ];

    // Update or create each configuration
    await Promise.all(configsToUpdate.map(config =>
      prisma.systemConfiguration.upsert({
        where: {
          category_key: {
            category: 'email',
            key: config.key
          }
        },
        update: {
          value: config.value,
          description: config.description,
          updatedBy: req.user!.id,
          updatedAt: new Date()
        },
        create: {
          category: 'email',
          key: config.key,
          value: config.value,
          dataType: 'string',
          description: config.description,
          isEditable: true,
          createdBy: req.user!.id,
          updatedBy: req.user!.id
        }
      })
    ));

    res.json({
      message: 'Email configuration updated successfully',
      category: 'email'
    });
  } catch (error) {
    console.error('Update email config error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({ error: 'Failed to update email configuration' });
  }
});

// Update SMS configuration
router.put('/config/sms', requireRole(['super_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const smsConfig = SMSConfigSchema.parse(req.body);

    const configsToUpdate = [
      { key: 'provider', value: smsConfig.provider, description: 'SMS service provider' },
      { key: 'apiKey', value: smsConfig.apiKey, description: 'API key/account SID' },
      { key: 'apiSecret', value: smsConfig.apiSecret, description: 'API secret/auth token' },
      { key: 'fromNumber', value: smsConfig.fromNumber, description: 'SMS sender phone number' }
    ];

    await Promise.all(configsToUpdate.map(config =>
      prisma.systemConfiguration.upsert({
        where: {
          category_key: {
            category: 'sms',
            key: config.key
          }
        },
        update: {
          value: config.value,
          description: config.description,
          updatedBy: req.user!.id,
          updatedAt: new Date()
        },
        create: {
          category: 'sms',
          key: config.key,
          value: config.value,
          dataType: 'string',
          description: config.description,
          isEditable: true,
          createdBy: req.user!.id,
          updatedBy: req.user!.id
        }
      })
    ));

    res.json({
      message: 'SMS configuration updated successfully',
      category: 'sms'
    });
  } catch (error) {
    console.error('Update SMS config error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({ error: 'Failed to update SMS configuration' });
  }
});

// Update WhatsApp configuration
router.put('/config/whatsapp', requireRole(['super_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const whatsappConfig = WhatsAppConfigSchema.parse(req.body);

    const configsToUpdate = [
      { key: 'provider', value: whatsappConfig.provider, description: 'WhatsApp service provider' },
      { key: 'apiKey', value: whatsappConfig.apiKey, description: 'API key/access token' },
      { key: 'apiSecret', value: whatsappConfig.apiSecret, description: 'API secret/app secret' },
      { key: 'fromNumber', value: whatsappConfig.fromNumber, description: 'WhatsApp sender number' }
    ];

    await Promise.all(configsToUpdate.map(config =>
      prisma.systemConfiguration.upsert({
        where: {
          category_key: {
            category: 'whatsapp',
            key: config.key
          }
        },
        update: {
          value: config.value,
          description: config.description,
          updatedBy: req.user!.id,
          updatedAt: new Date()
        },
        create: {
          category: 'whatsapp',
          key: config.key,
          value: config.value,
          dataType: 'string',
          description: config.description,
          isEditable: true,
          createdBy: req.user!.id,
          updatedBy: req.user!.id
        }
      })
    ));

    res.json({
      message: 'WhatsApp configuration updated successfully',
      category: 'whatsapp'
    });
  } catch (error) {
    console.error('Update WhatsApp config error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({ error: 'Failed to update WhatsApp configuration' });
  }
});

// Test notification configuration
router.post('/config/test/:type', requireRole(['super_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { type } = req.params;
    const { recipient } = req.body;

    if (!['email', 'sms', 'whatsapp'].includes(type)) {
      return res.status(400).json({ error: 'Invalid notification type' });
    }

    if (!recipient) {
      return res.status(400).json({ error: 'Recipient is required for testing' });
    }

    // Get configuration for the specified type
    const configs = await prisma.systemConfiguration.findMany({
      where: { category: type }
    });

    if (configs.length === 0) {
      return res.status(400).json({ error: `No ${type} configuration found` });
    }

    const configObj = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    // Test the configuration (implementation will be added with the service)
    // For now, just validate that required configs exist
    let requiredFields: string[] = [];

    switch (type) {
      case 'email':
        requiredFields = ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 'fromEmail'];
        break;
      case 'sms':
        requiredFields = ['provider', 'apiKey', 'apiSecret', 'fromNumber'];
        break;
      case 'whatsapp':
        requiredFields = ['provider', 'apiKey', 'apiSecret', 'fromNumber'];
        break;
    }

    const missingFields = requiredFields.filter(field => !configObj[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required configuration fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Actually send the test notification via the service
    const notificationService = NotificationService.getInstance();
    await notificationService.loadConfiguration();

    const success = await notificationService.sendNotification({
      type: type as 'email' | 'sms' | 'whatsapp',
      recipient,
      subject: `Test ${type.toUpperCase()} Notification from QB Pharma`,
      message: `This is a test ${type} notification from QB Pharma system. If you received this, your ${type} configuration is working correctly.`
    });

    if (!success) {
      return res.status(500).json({
        error: `Failed to send test ${type} notification. Check server logs and verify your configuration.`
      });
    }

    res.json({
      message: `Test ${type} notification sent successfully`,
      recipient,
      type
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Failed to test notification configuration' });
  }
});

// Get notification logs
router.get('/logs', requireRole(['super_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { type, status, page = '1', limit = '50' } = req.query;

    const whereClause: any = {};

    if (type && typeof type === 'string') {
      whereClause.type = type;
    }

    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, totalCount] = await Promise.all([
      prisma.notificationLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.notificationLog.count({ where: whereClause })
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('Get notification logs error:', error);
    res.status(500).json({ error: 'Failed to fetch notification logs' });
  }
});

export default router;