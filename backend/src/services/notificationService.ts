import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import { prisma } from '../index';

export interface NotificationConfig {
  email?: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromName: string;
    fromEmail: string;
    enableTLS: boolean;
  };
  sms?: {
    provider: string;
    apiKey: string;
    apiSecret: string;
    fromNumber: string;
  };
  whatsapp?: {
    provider: string;
    apiKey: string;
    apiSecret: string;
    fromNumber: string;
  };
}

export interface NotificationData {
  type: 'email' | 'sms' | 'whatsapp';
  recipient: string;
  subject?: string;
  message: string;
  template?: string;
  variables?: Record<string, any>;
  transactionId?: string;
  stakeholderId?: string;
  stakeholderType?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private config: NotificationConfig = {};

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async loadConfiguration(): Promise<void> {
    try {
      const configs = await prisma.systemConfiguration.findMany({
        where: {
          category: {
            in: ['email', 'sms', 'whatsapp']
          }
        }
      });

      // Group configurations by category
      const groupedConfigs = configs.reduce((acc, config) => {
        if (!acc[config.category]) {
          acc[config.category] = {};
        }
        acc[config.category][config.key] = config.value;
        return acc;
      }, {} as Record<string, Record<string, string>>);

      // Map to typed configuration
      if (groupedConfigs.email) {
        this.config.email = {
          smtpHost: groupedConfigs.email.smtpHost || '',
          smtpPort: parseInt(groupedConfigs.email.smtpPort || '587'),
          smtpUser: groupedConfigs.email.smtpUser || '',
          smtpPassword: groupedConfigs.email.smtpPassword || '',
          fromName: groupedConfigs.email.fromName || '',
          fromEmail: groupedConfigs.email.fromEmail || '',
          enableTLS: groupedConfigs.email.enableTLS === 'true'
        };
      }

      if (groupedConfigs.sms) {
        this.config.sms = {
          provider: groupedConfigs.sms.provider || '',
          apiKey: groupedConfigs.sms.apiKey || '',
          apiSecret: groupedConfigs.sms.apiSecret || '',
          fromNumber: groupedConfigs.sms.fromNumber || ''
        };
      }

      if (groupedConfigs.whatsapp) {
        this.config.whatsapp = {
          provider: groupedConfigs.whatsapp.provider || '',
          apiKey: groupedConfigs.whatsapp.apiKey || '',
          apiSecret: groupedConfigs.whatsapp.apiSecret || '',
          fromNumber: groupedConfigs.whatsapp.fromNumber || ''
        };
      }
    } catch (error) {
      console.error('Failed to load notification configuration:', error);
    }
  }

  async sendNotification(data: NotificationData): Promise<boolean> {
    try {
      // Log notification attempt
      const notificationLog = await prisma.notificationLog.create({
        data: {
          type: data.type,
          recipient: data.recipient,
          subject: data.subject || '',
          message: data.message,
          status: 'pending',
          transactionId: data.transactionId,
          stakeholderId: data.stakeholderId,
          stakeholderType: data.stakeholderType
        }
      });

      let success = false;

      switch (data.type) {
        case 'email':
          success = await this.sendEmail(data);
          break;
        case 'sms':
          success = await this.sendSMS(data);
          break;
        case 'whatsapp':
          success = await this.sendWhatsApp(data);
          break;
        default:
          throw new Error(`Unsupported notification type: ${data.type}`);
      }

      // Update notification log
      await prisma.notificationLog.update({
        where: { id: notificationLog.id },
        data: {
          status: success ? 'sent' : 'failed',
          sentAt: success ? new Date() : undefined
        }
      });

      return success;
    } catch (error) {
      console.error(`Failed to send ${data.type} notification:`, error);
      return false;
    }
  }

  private async sendEmail(data: NotificationData): Promise<boolean> {
    if (!this.config.email) {
      console.error('Email configuration not found');
      return false;
    }

    try {
      // Create transporter
      const transporter = nodemailer.createTransport({
        host: this.config.email.smtpHost,
        port: this.config.email.smtpPort,
        secure: this.config.email.smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: this.config.email.smtpUser,
          pass: this.config.email.smtpPassword
        },
        tls: {
          rejectUnauthorized: this.config.email.enableTLS
        }
      });

      // Prepare message content
      let htmlContent = data.message;
      let textContent = data.message;

      // If template is provided, compile it
      if (data.template && data.variables) {
        const template = handlebars.compile(data.template);
        htmlContent = template(data.variables);
        textContent = htmlContent.replace(/<[^>]*>/g, ''); // Strip HTML for text version
      }

      // Send email
      const info = await transporter.sendMail({
        from: `"${this.config.email.fromName}" <${this.config.email.fromEmail}>`,
        to: data.recipient,
        subject: data.subject || 'Notification from QB Pharma',
        text: textContent,
        html: htmlContent
      });

      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  private async sendSMS(data: NotificationData): Promise<boolean> {
    if (!this.config.sms) {
      console.error('SMS configuration not found');
      return false;
    }

    try {
      // TODO: Implement SMS sending based on provider
      switch (this.config.sms.provider) {
        case 'twilio':
          // TODO: Implement Twilio SMS
          console.log('SMS would be sent via Twilio:', data);
          break;
        case 'aws-sns':
          // TODO: Implement AWS SNS SMS
          console.log('SMS would be sent via AWS SNS:', data);
          break;
        default:
          throw new Error(`Unsupported SMS provider: ${this.config.sms.provider}`);
      }

      // For now, return true to simulate successful sending
      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  private async sendWhatsApp(data: NotificationData): Promise<boolean> {
    if (!this.config.whatsapp) {
      console.error('WhatsApp configuration not found');
      return false;
    }

    try {
      // TODO: Implement WhatsApp sending based on provider
      switch (this.config.whatsapp.provider) {
        case 'twilio':
          // TODO: Implement Twilio WhatsApp
          console.log('WhatsApp would be sent via Twilio:', data);
          break;
        case 'meta':
          // TODO: Implement Meta WhatsApp Business API
          console.log('WhatsApp would be sent via Meta:', data);
          break;
        default:
          throw new Error(`Unsupported WhatsApp provider: ${this.config.whatsapp.provider}`);
      }

      // For now, return true to simulate successful sending
      return true;
    } catch (error) {
      console.error('WhatsApp sending failed:', error);
      return false;
    }
  }

  async sendTransactionNotification(
    transactionId: string,
    category: string,
    stakeholderId?: string,
    stakeholderType?: string
  ): Promise<void> {
    try {
      // Load fresh configuration
      await this.loadConfiguration();

      // Get transaction details
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          pharmaUnit: true,
          creator: {
            select: { name: true, username: true }
          }
        }
      });

      if (!transaction) {
        console.error('Transaction not found for notification:', transactionId);
        return;
      }

      // Determine recipients based on transaction category
      const recipients = await this.getRecipientsForTransaction(category, stakeholderId, stakeholderType, transaction.pharmaUnitId);

      if (recipients.length === 0) {
        console.log('No recipients found for transaction notification:', transactionId);
        return;
      }

      // Send notifications to each recipient
      for (const recipient of recipients) {
        const subject = this.getEmailSubject(category, transaction);
        const message = this.getEmailMessage(category, transaction, recipient);

        await this.sendNotification({
          type: 'email',
          recipient: recipient.email,
          subject,
          message,
          transactionId,
          stakeholderId: recipient.id,
          stakeholderType: recipient.type
        });
      }
    } catch (error) {
      console.error('Failed to send transaction notification:', error);
    }
  }

  private async getRecipientsForTransaction(
    category: string,
    stakeholderId?: string,
    stakeholderType?: string,
    pharmaUnitId?: string
  ): Promise<Array<{ id: string; email: string; name: string; type: string }>> {
    const recipients: Array<{ id: string; email: string; name: string; type: string }> = [];

    try {
      // Business partners for profit-related transactions
      if (['pharmacy_sale', 'sales_profit_distribution', 'distributor_payment', 'distributor_credit_purchase', 'distributor_credit_note'].includes(category)) {
        const businessPartners = await prisma.businessPartner.findMany({
          where: { pharmaUnitId },
          select: { id: true, email: true, name: true }
        });

        recipients.push(...businessPartners.map(bp => ({
          id: bp.id,
          email: bp.email,
          name: bp.name,
          type: 'business_partner'
        })));
      }

      // Specific stakeholder notifications
      if (stakeholderId && stakeholderType) {
        switch (stakeholderType) {
          case 'doctor':
            const doctor = await prisma.doctor.findUnique({
              where: { id: stakeholderId },
              select: { id: true, email: true, name: true }
            });
            if (doctor) {
              recipients.push({
                id: doctor.id,
                email: doctor.email,
                name: doctor.name,
                type: 'doctor'
              });
            }
            break;

          case 'distributor':
            const distributor = await prisma.distributor.findUnique({
              where: { id: stakeholderId },
              select: { id: true, email: true, name: true }
            });
            if (distributor) {
              recipients.push({
                id: distributor.id,
                email: distributor.email,
                name: distributor.name,
                type: 'distributor'
              });
            }
            break;

          case 'employee':
            const employee = await prisma.employee.findUnique({
              where: { id: stakeholderId },
              select: { id: true, email: true, name: true }
            });
            if (employee) {
              recipients.push({
                id: employee.id,
                email: employee.email,
                name: employee.name,
                type: 'employee'
              });
            }
            break;
        }
      }

      return recipients;
    } catch (error) {
      console.error('Failed to get recipients for transaction:', error);
      return [];
    }
  }

  private getEmailSubject(category: string, transaction: any): string {
    const categoryMap: Record<string, string> = {
      pharmacy_sale: 'New Pharmacy Sale Transaction',
      sales_profit_distribution: 'Sales Profit Distribution Notice',
      consultation_fee: 'Consultation Fee Received',
      doctor_expense: 'Doctor Payment Processed',
      distributor_payment: 'Distributor Payment Processed',
      distributor_credit_purchase: 'New Distributor Credit Purchase',
      distributor_credit_note: 'Distributor Credit Note Issued'
    };

    return categoryMap[category] || 'Transaction Notification';
  }

  private getEmailMessage(category: string, transaction: any, recipient: any): string {
    const formatAmount = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
    const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-IN');

    const baseMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">QB Pharma - Transaction Notification</h2>

        <p>Dear ${recipient.name},</p>

        <p>This is to inform you about a transaction that affects your account:</p>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Transaction Details</h3>
          <p><strong>Type:</strong> ${this.getTransactionDisplayName(category)}</p>
          <p><strong>Amount:</strong> ${formatAmount(transaction.amount)}</p>
          <p><strong>Date:</strong> ${formatDate(transaction.date)}</p>
          <p><strong>Description:</strong> ${transaction.description}</p>
          ${transaction.billNo ? `<p><strong>Bill No:</strong> ${transaction.billNo}</p>` : ''}
        </div>

        ${this.getCategorySpecificMessage(category, transaction, recipient)}

        <p>If you have any questions about this transaction, please contact your pharmacy administrator.</p>

        <p>Best regards,<br>QB Pharma Management System</p>
      </div>
    `;

    return baseMessage;
  }

  private getTransactionDisplayName(category: string): string {
    const displayNames: Record<string, string> = {
      pharmacy_sale: 'Pharmacy Sale',
      sales_profit_distribution: 'Sales Profit Distribution',
      consultation_fee: 'Consultation Fee',
      doctor_expense: 'Doctor Payment',
      distributor_payment: 'Distributor Payment',
      distributor_credit_purchase: 'Distributor Credit Purchase',
      distributor_credit_note: 'Distributor Credit Note'
    };

    return displayNames[category] || category;
  }

  private getCategorySpecificMessage(category: string, transaction: any, recipient: any): string {
    switch (category) {
      case 'pharmacy_sale':
        return '<p>This sale contributes to the overall business revenue and will be included in the next profit distribution calculation.</p>';

      case 'sales_profit_distribution':
        return '<p>Your share of the profit has been calculated based on your ownership percentage. Please check your account for the credited amount.</p>';

      case 'consultation_fee':
        return '<p>This consultation fee has been recorded in your account. Your commission will be calculated based on your commission rate.</p>';

      case 'doctor_expense':
        return '<p>A payment has been processed to your account. Please verify the amount and contact us if you have any discrepancies.</p>';

      case 'distributor_payment':
        return '<p>A payment has been made to the distributor. This affects the overall business cash flow and profit calculations.</p>';

      case 'distributor_credit_purchase':
        return '<p>A credit purchase has been made from a distributor. This transaction affects inventory and business expenses.</p>';

      case 'distributor_credit_note':
        return '<p>A credit note has been issued. This adjustment affects the distributor account balance and business calculations.</p>';

      default:
        return '<p>Please review this transaction and contact us if you need any clarification.</p>';
    }
  }
}

export default NotificationService;