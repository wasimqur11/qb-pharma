import express from 'express';
import { z } from 'zod';
import { authenticateToken, requirePermission, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = express.Router();

// Apply authentication to all transaction routes
router.use(authenticateToken);

// Validation schemas
const CreateTransactionSchema = z.object({
  category: z.enum([
    'pharmacy_sale', 'consultation_fee', 'distributor_payment', 'distributor_credit_purchase',
    'distributor_credit_note', 'doctor_expense', 'sales_profit_distribution', 'employee_payment',
    'clinic_expense', 'patient_credit_sale', 'patient_payment', 'settlement_point'
  ]),
  stakeholderId: z.string().optional(),
  stakeholderType: z.enum(['doctor', 'business_partner', 'employee', 'distributor', 'patient']).optional(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  billNo: z.string().optional(),
  date: z.string().datetime('Invalid date format')
});

const UpdateTransactionSchema = z.object({
  category: z.enum([
    'pharmacy_sale', 'consultation_fee', 'distributor_payment', 'distributor_credit_purchase',
    'distributor_credit_note', 'doctor_expense', 'sales_profit_distribution', 'employee_payment',
    'clinic_expense', 'patient_credit_sale', 'patient_payment', 'settlement_point'
  ]).optional(),
  stakeholderId: z.string().optional(),
  stakeholderType: z.enum(['doctor', 'business_partner', 'employee', 'distributor', 'patient']).optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  billNo: z.string().optional(),
  date: z.string().datetime('Invalid date format').optional()
});

// Get all transactions (with role-based filtering)
router.get('/', requirePermission('transactions', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { category, stakeholderId, stakeholderType, startDate, endDate, page = '1', limit = '50' } = req.query;
    
    // Build filter conditions based on role
    const whereClause: any = {};
    
    // Role-based filtering
    if (req.user?.role === 'doctor' && req.user.linkedStakeholderId) {
      // Doctor: only their consultation transactions
      whereClause.OR = [
        { stakeholderId: req.user.linkedStakeholderId, stakeholderType: 'doctor' },
        { category: 'consultation_fee', stakeholderId: req.user.linkedStakeholderId }
      ];
    } else if (req.user?.role === 'partner' && req.user.linkedStakeholderId) {
      // Partner: only their profit distribution transactions
      whereClause.OR = [
        { stakeholderId: req.user.linkedStakeholderId, stakeholderType: 'business_partner' },
        { category: 'sales_profit_distribution', stakeholderId: req.user.linkedStakeholderId }
      ];
    } else if (req.user?.role === 'distributor' && req.user.linkedStakeholderId) {
      // Distributor: only their purchase/payment transactions
      whereClause.OR = [
        { stakeholderId: req.user.linkedStakeholderId, stakeholderType: 'distributor' }
      ];
    } else if (['operator', 'admin'].includes(req.user?.role || '') && req.user?.pharmaUnitId) {
      // Operator/Admin: unit transactions
      whereClause.pharmaUnitId = req.user.pharmaUnitId;
    }
    // Super admin: all transactions (no additional filters)
    
    // Apply query filters
    if (category && typeof category === 'string') {
      whereClause.category = category;
    }
    
    if (stakeholderId && typeof stakeholderId === 'string') {
      whereClause.stakeholderId = stakeholderId;
    }
    
    if (stakeholderType && typeof stakeholderType === 'string') {
      whereClause.stakeholderType = stakeholderType;
    }
    
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate && typeof startDate === 'string') {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        whereClause.date.lte = new Date(endDate);
      }
    }
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;
    
    // Get transactions with related data
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          pharmaUnit: true,
          creator: {
            select: {
              id: true,
              username: true,
              name: true
            }
          },
          doctor: true,
          businessPartner: true,
          employee: true,
          distributor: true,
          patient: true
        },
        orderBy: {
          date: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.transaction.count({ where: whereClause })
    ]);
    
    // Format response with stakeholder details
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      category: transaction.category,
      stakeholderId: transaction.stakeholderId,
      stakeholderType: transaction.stakeholderType,
      stakeholderName: 
        transaction.doctor?.name ||
        transaction.businessPartner?.name ||
        transaction.employee?.name ||
        transaction.distributor?.name ||
        transaction.patient?.name ||
        null,
      amount: transaction.amount,
      description: transaction.description,
      billNo: transaction.billNo,
      date: transaction.date,
      pharmaUnitId: transaction.pharmaUnitId,
      pharmaUnitName: transaction.pharmaUnit?.name,
      createdBy: {
        id: transaction.creator.id,
        username: transaction.creator.username,
        name: transaction.creator.name
      },
      createdAt: transaction.createdAt
    }));
    
    res.json({
      transactions: formattedTransactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create transaction
router.post('/', requirePermission('transactions', 'create'), async (req: AuthenticatedRequest, res) => {
  try {
    const transactionData = CreateTransactionSchema.parse(req.body);
    
    // Validate stakeholder exists if provided
    if (transactionData.stakeholderId && transactionData.stakeholderType) {
      let stakeholderExists = false;
      
      switch (transactionData.stakeholderType) {
        case 'doctor':
          stakeholderExists = !!(await prisma.doctor.findUnique({ where: { id: transactionData.stakeholderId } }));
          break;
        case 'business_partner':
          stakeholderExists = !!(await prisma.businessPartner.findUnique({ where: { id: transactionData.stakeholderId } }));
          break;
        case 'employee':
          stakeholderExists = !!(await prisma.employee.findUnique({ where: { id: transactionData.stakeholderId } }));
          break;
        case 'distributor':
          stakeholderExists = !!(await prisma.distributor.findUnique({ where: { id: transactionData.stakeholderId } }));
          break;
        case 'patient':
          stakeholderExists = !!(await prisma.patient.findUnique({ where: { id: transactionData.stakeholderId } }));
          break;
      }
      
      if (!stakeholderExists) {
        return res.status(400).json({ error: 'Invalid stakeholder ID for the specified type' });
      }
    }
    
    // Determine pharma unit
    let pharmaUnitId = req.user?.pharmaUnitId;
    
    // Super admin can specify pharma unit, others use their own
    if (req.user?.role === 'super_admin' && req.body.pharmaUnitId) {
      pharmaUnitId = req.body.pharmaUnitId;
    }
    
    if (!pharmaUnitId) {
      return res.status(400).json({ error: 'Pharma unit is required' });
    }
    
    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        category: transactionData.category,
        stakeholderId: transactionData.stakeholderId,
        stakeholderType: transactionData.stakeholderType,
        amount: transactionData.amount,
        description: transactionData.description,
        billNo: transactionData.billNo,
        date: new Date(transactionData.date),
        createdBy: req.user!.id,
        pharmaUnitId
      },
      include: {
        pharmaUnit: true,
        creator: {
          select: {
            id: true,
            username: true,
            name: true
          }
        },
        doctor: true,
        businessPartner: true,
        employee: true,
        distributor: true,
        patient: true
      }
    });
    
    // Format response
    const formattedTransaction = {
      id: transaction.id,
      category: transaction.category,
      stakeholderId: transaction.stakeholderId,
      stakeholderType: transaction.stakeholderType,
      stakeholderName: 
        transaction.doctor?.name ||
        transaction.businessPartner?.name ||
        transaction.employee?.name ||
        transaction.distributor?.name ||
        transaction.patient?.name ||
        null,
      amount: transaction.amount,
      description: transaction.description,
      billNo: transaction.billNo,
      date: transaction.date,
      pharmaUnitId: transaction.pharmaUnitId,
      pharmaUnitName: transaction.pharmaUnit?.name,
      createdBy: {
        id: transaction.creator.id,
        username: transaction.creator.username,
        name: transaction.creator.name
      },
      createdAt: transaction.createdAt
    };
    
    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: formattedTransaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Get transaction by ID
router.get('/:id', requirePermission('transactions', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        pharmaUnit: true,
        creator: {
          select: {
            id: true,
            username: true,
            name: true
          }
        },
        doctor: true,
        businessPartner: true,
        employee: true,
        distributor: true,
        patient: true
      }
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Role-based access control
    let hasAccess = false;
    
    if (['super_admin'].includes(req.user?.role || '')) {
      hasAccess = true;
    } else if (['admin', 'operator'].includes(req.user?.role || '')) {
      hasAccess = transaction.pharmaUnitId === req.user?.pharmaUnitId;
    } else if (req.user?.role === 'doctor' && req.user.linkedStakeholderId) {
      hasAccess = transaction.stakeholderId === req.user.linkedStakeholderId && 
                  transaction.stakeholderType === 'doctor';
    } else if (req.user?.role === 'partner' && req.user.linkedStakeholderId) {
      hasAccess = transaction.stakeholderId === req.user.linkedStakeholderId && 
                  transaction.stakeholderType === 'business_partner';
    } else if (req.user?.role === 'distributor' && req.user.linkedStakeholderId) {
      hasAccess = transaction.stakeholderId === req.user.linkedStakeholderId && 
                  transaction.stakeholderType === 'distributor';
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this transaction' });
    }
    
    // Format response
    const formattedTransaction = {
      id: transaction.id,
      category: transaction.category,
      stakeholderId: transaction.stakeholderId,
      stakeholderType: transaction.stakeholderType,
      stakeholderName: 
        transaction.doctor?.name ||
        transaction.businessPartner?.name ||
        transaction.employee?.name ||
        transaction.distributor?.name ||
        transaction.patient?.name ||
        null,
      amount: transaction.amount,
      description: transaction.description,
      billNo: transaction.billNo,
      date: transaction.date,
      pharmaUnitId: transaction.pharmaUnitId,
      pharmaUnitName: transaction.pharmaUnit?.name,
      createdBy: {
        id: transaction.creator.id,
        username: transaction.creator.username,
        name: transaction.creator.name
      },
      createdAt: transaction.createdAt
    };
    
    res.json({ transaction: formattedTransaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Update transaction
router.put('/:id', requirePermission('transactions', 'update'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = UpdateTransactionSchema.parse(req.body);
    
    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        pharmaUnit: true
      }
    });
    
    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Role-based access control
    let canUpdate = false;
    
    if (req.user?.role === 'super_admin') {
      canUpdate = true;
    } else if (['admin', 'operator'].includes(req.user?.role || '')) {
      canUpdate = existingTransaction.pharmaUnitId === req.user?.pharmaUnitId;
    }
    
    if (!canUpdate) {
      return res.status(403).json({ error: 'Insufficient permissions to update this transaction' });
    }
    
    // Validate stakeholder exists if being updated
    if (updateData.stakeholderId && updateData.stakeholderType) {
      let stakeholderExists = false;
      
      switch (updateData.stakeholderType) {
        case 'doctor':
          stakeholderExists = !!(await prisma.doctor.findUnique({ where: { id: updateData.stakeholderId } }));
          break;
        case 'business_partner':
          stakeholderExists = !!(await prisma.businessPartner.findUnique({ where: { id: updateData.stakeholderId } }));
          break;
        case 'employee':
          stakeholderExists = !!(await prisma.employee.findUnique({ where: { id: updateData.stakeholderId } }));
          break;
        case 'distributor':
          stakeholderExists = !!(await prisma.distributor.findUnique({ where: { id: updateData.stakeholderId } }));
          break;
        case 'patient':
          stakeholderExists = !!(await prisma.patient.findUnique({ where: { id: updateData.stakeholderId } }));
          break;
      }
      
      if (!stakeholderExists) {
        return res.status(400).json({ error: 'Invalid stakeholder ID for the specified type' });
      }
    }
    
    // Prepare update data
    const updateFields: any = { ...updateData };
    if (updateData.date) {
      updateFields.date = new Date(updateData.date);
    }
    
    // Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: updateFields,
      include: {
        pharmaUnit: true,
        creator: {
          select: {
            id: true,
            username: true,
            name: true
          }
        },
        doctor: true,
        businessPartner: true,
        employee: true,
        distributor: true,
        patient: true
      }
    });
    
    // Format response
    const formattedTransaction = {
      id: updatedTransaction.id,
      category: updatedTransaction.category,
      stakeholderId: updatedTransaction.stakeholderId,
      stakeholderType: updatedTransaction.stakeholderType,
      stakeholderName: 
        updatedTransaction.doctor?.name ||
        updatedTransaction.businessPartner?.name ||
        updatedTransaction.employee?.name ||
        updatedTransaction.distributor?.name ||
        updatedTransaction.patient?.name ||
        null,
      amount: updatedTransaction.amount,
      description: updatedTransaction.description,
      billNo: updatedTransaction.billNo,
      date: updatedTransaction.date,
      pharmaUnitId: updatedTransaction.pharmaUnitId,
      pharmaUnitName: updatedTransaction.pharmaUnit?.name,
      createdBy: {
        id: updatedTransaction.creator.id,
        username: updatedTransaction.creator.username,
        name: updatedTransaction.creator.name
      },
      createdAt: updatedTransaction.createdAt
    };
    
    res.json({
      message: 'Transaction updated successfully',
      transaction: formattedTransaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete transaction
router.delete('/:id', requirePermission('transactions', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id }
    });
    
    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Role-based access control
    let canDelete = false;
    
    if (req.user?.role === 'super_admin') {
      canDelete = true;
    } else if (['admin'].includes(req.user?.role || '')) {
      canDelete = existingTransaction.pharmaUnitId === req.user?.pharmaUnitId;
    }
    // Note: Operators typically shouldn't delete transactions, only admin+
    
    if (!canDelete) {
      return res.status(403).json({ error: 'Insufficient permissions to delete this transaction' });
    }
    
    // Delete transaction
    await prisma.transaction.delete({ where: { id } });
    
    res.json({ 
      message: 'Transaction deleted successfully',
      deletedId: id
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;