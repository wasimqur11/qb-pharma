import express from 'express';
import { z } from 'zod';
import { authenticateToken, requirePermission, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';
import NotificationService from '../services/notificationService';

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
  amount: z.number().min(0, 'Amount must be non-negative'),
  description: z.string().min(1, 'Description is required'),
  billNo: z.string().optional(),
  date: z.union([
    z.string().datetime('Invalid date format'),
    z.date().transform(date => date.toISOString())
  ])
}).refine((data) => {
  // Settlement Point must be exactly 0
  if (data.category === 'settlement_point') {
    return data.amount === 0;
  }
  // All other transactions must be positive
  return data.amount > 0;
}, {
  message: 'Settlement Point amount must be ₹0, other transactions must be positive',
  path: ['amount']
});

const UpdateTransactionSchema = z.object({
  category: z.enum([
    'pharmacy_sale', 'consultation_fee', 'distributor_payment', 'distributor_credit_purchase',
    'distributor_credit_note', 'doctor_expense', 'sales_profit_distribution', 'employee_payment',
    'clinic_expense', 'patient_credit_sale', 'patient_payment', 'settlement_point'
  ]).optional(),
  stakeholderId: z.string().optional(),
  stakeholderType: z.enum(['doctor', 'business_partner', 'employee', 'distributor', 'patient']).optional(),
  amount: z.number().min(0, 'Amount must be non-negative').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  billNo: z.string().optional(),
  date: z.string().datetime('Invalid date format').optional()
}).refine((data) => {
  // If amount is provided, validate based on category
  if (data.amount !== undefined && data.category) {
    // Settlement Point must be exactly 0
    if (data.category === 'settlement_point') {
      return data.amount === 0;
    }
    // All other transactions must be positive
    return data.amount > 0;
  }
  return true;
}, {
  message: 'Settlement Point amount must be ₹0, other transactions must be positive',
  path: ['amount']
});

// Get all transactions (with role-based filtering)
router.get('/', requirePermission('transactions', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { category, stakeholderId, stakeholderType, startDate, endDate, page = '1', limit = '50', all } = req.query;

    // Build filter conditions based on role
    const whereClause: any = { deletedAt: null };

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

    // Pagination - support ?all=true to fetch all records
    const fetchAll = all === 'true';
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = fetchAll ? undefined : Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = fetchAll ? undefined : (pageNum - 1) * limitNum!;

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
          }
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
      stakeholderName: null, // We'll need to fetch this separately if needed
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
      pagination: fetchAll ? {
        page: 1,
        limit: totalCount,
        total: totalCount,
        totalPages: 1
      } : {
        page: pageNum,
        limit: limitNum!,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum!)
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
      
      const sid = transactionData.stakeholderId!;
      switch (transactionData.stakeholderType) {
        case 'doctor':
          stakeholderExists = !!(await prisma.doctor.findFirst({ where: { id: sid, deletedAt: null } }));
          break;
        case 'business_partner':
          stakeholderExists = !!(await prisma.businessPartner.findFirst({ where: { id: sid, deletedAt: null } }));
          break;
        case 'employee':
          stakeholderExists = !!(await prisma.employee.findFirst({ where: { id: sid, deletedAt: null } }));
          break;
        case 'distributor':
          stakeholderExists = !!(await prisma.distributor.findFirst({ where: { id: sid, deletedAt: null } }));
          break;
        case 'patient':
          stakeholderExists = !!(await prisma.patient.findFirst({ where: { id: sid, deletedAt: null } }));
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

    // Settlement Point guard: pharmacy cash must be within ±₹50 of zero
    if (transactionData.category === 'settlement_point') {
      const SETTLEMENT_TOLERANCE = 50;

      // Compute pharmacy cash position from the database
      // Formula: (pharmacy_sale + patient_payment) - distributor_payment
      //          - sales_profit_distribution - employee_payment
      //          - clinic_expense - patient_credit_sale
      const REVENUE_CATS   = ['pharmacy_sale', 'patient_payment'];
      const DEDUCTION_CATS = [
        'distributor_payment', 'sales_profit_distribution',
        'employee_payment', 'clinic_expense', 'patient_credit_sale'
      ];

      const categoryTotals = await prisma.transaction.groupBy({
        by: ['category'],
        where: {
          pharmaUnitId,
          category: { in: [...REVENUE_CATS, ...DEDUCTION_CATS] }
        },
        _sum: { amount: true }
      });

      const sumByCategory: Record<string, number> = {};
      for (const row of categoryTotals) {
        sumByCategory[row.category] = row._sum.amount ?? 0;
      }

      const pharmacyRevenue   = REVENUE_CATS  .reduce((s, c) => s + (sumByCategory[c] ?? 0), 0);
      const pharmacyDeductions= DEDUCTION_CATS.reduce((s, c) => s + (sumByCategory[c] ?? 0), 0);
      const cashPosition      = pharmacyRevenue - pharmacyDeductions;

      if (Math.abs(cashPosition) > SETTLEMENT_TOLERANCE) {
        return res.status(422).json({
          error: `Pharmacy cash position is ₹${cashPosition.toFixed(2)}. ` +
                 `It must be within ±₹${SETTLEMENT_TOLERANCE} of zero before a Settlement Point can be recorded.`,
          cashPosition
        });
      }
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
        }
      }
    });

    // Send notification asynchronously (don't wait for completion)
    const notificationCategories = [
      'pharmacy_sale', 'sales_profit_distribution', 'consultation_fee',
      'doctor_expense', 'distributor_payment', 'distributor_credit_purchase',
      'distributor_credit_note'
    ];

    if (notificationCategories.includes(transactionData.category)) {
      setImmediate(async () => {
        try {
          const notificationService = NotificationService.getInstance();
          await notificationService.sendTransactionNotification(
            transaction.id,
            transactionData.category,
            transactionData.stakeholderId,
            transactionData.stakeholderType
          );
        } catch (error) {
          console.error('Failed to send transaction notification:', error);
        }
      });
    }

    // Format response
    const formattedTransaction = {
      id: transaction.id,
      category: transaction.category,
      stakeholderId: transaction.stakeholderId,
      stakeholderType: transaction.stakeholderType,
      stakeholderName: null, // We'll need to fetch this separately if needed
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

// Get aggregated financial summaries computed server-side (avoids loading all records to the client)
router.get('/aggregates', requirePermission('transactions', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Role-based base filter — mirrors the logic in GET /
    const baseWhere: any = { deletedAt: null };
    if (req.user?.role === 'doctor' && req.user.linkedStakeholderId) {
      baseWhere.OR = [
        { stakeholderId: req.user.linkedStakeholderId, stakeholderType: 'doctor' },
        { category: 'consultation_fee', stakeholderId: req.user.linkedStakeholderId }
      ];
    } else if (req.user?.role === 'partner' && req.user.linkedStakeholderId) {
      baseWhere.OR = [
        { stakeholderId: req.user.linkedStakeholderId, stakeholderType: 'business_partner' },
        { category: 'sales_profit_distribution', stakeholderId: req.user.linkedStakeholderId }
      ];
    } else if (req.user?.role === 'distributor' && req.user.linkedStakeholderId) {
      baseWhere.OR = [
        { stakeholderId: req.user.linkedStakeholderId, stakeholderType: 'distributor' }
      ];
    } else if (['operator', 'admin'].includes(req.user?.role || '') && req.user?.pharmaUnitId) {
      baseWhere.pharmaUnitId = req.user.pharmaUnitId;
    }
    // super_admin: no additional filter

    // Optional date-range applied to category totals
    const rangeWhere: any = { ...baseWhere };
    if (startDate && typeof startDate === 'string') {
      rangeWhere.date = { ...rangeWhere.date, gte: new Date(startDate) };
    }
    if (endDate && typeof endDate === 'string') {
      rangeWhere.date = { ...rangeWhere.date, lte: new Date(endDate) };
    }

    // Today's boundaries (always uses base filter, ignores startDate/endDate)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [categoryTotals, todayTotals, lastSettlement, distributorTotals] = await Promise.all([
      // All-time (or date-range) totals per category
      prisma.transaction.groupBy({
        by: ['category'],
        where: rangeWhere,
        _sum: { amount: true },
        _count: true
      }),

      // Today's totals per category (ignores the date-range filter)
      prisma.transaction.groupBy({
        by: ['category'],
        where: { ...baseWhere, date: { gte: startOfToday, lte: endOfToday } },
        _sum: { amount: true }
      }),

      // Most recent settlement point
      prisma.transaction.findFirst({
        where: { ...baseWhere, category: 'settlement_point' },
        orderBy: { date: 'desc' },
        select: { id: true, date: true, description: true }
      }),

      // Per-distributor transaction totals (all-time, for balance calculation)
      prisma.transaction.groupBy({
        by: ['stakeholderId', 'category'],
        where: {
          ...baseWhere,
          stakeholderType: 'distributor',
          category: { in: ['distributor_credit_purchase', 'distributor_payment', 'distributor_credit_note'] }
        },
        _sum: { amount: true }
      })
    ]);

    // Format category totals
    const categories: Record<string, { total: number; count: number }> = {};
    for (const item of categoryTotals) {
      categories[item.category] = { total: item._sum.amount ?? 0, count: item._count };
    }

    // Format today totals
    const today: Record<string, number> = {};
    for (const item of todayTotals) {
      today[item.category] = item._sum.amount ?? 0;
    }

    // Format distributor totals grouped by stakeholderId
    const distributorTransactionTotals: Record<string, { purchases: number; payments: number; creditNotes: number }> = {};
    for (const item of distributorTotals) {
      const id = item.stakeholderId!;
      if (!distributorTransactionTotals[id]) {
        distributorTransactionTotals[id] = { purchases: 0, payments: 0, creditNotes: 0 };
      }
      const amount = item._sum.amount ?? 0;
      if (item.category === 'distributor_credit_purchase') distributorTransactionTotals[id].purchases += amount;
      else if (item.category === 'distributor_payment')          distributorTransactionTotals[id].payments  += amount;
      else if (item.category === 'distributor_credit_note')      distributorTransactionTotals[id].creditNotes += amount;
    }

    res.json({
      categories,
      today,
      distributorTransactionTotals,
      lastSettlementPoint: lastSettlement
        ? { id: lastSettlement.id, date: lastSettlement.date.toISOString(), description: lastSettlement.description }
        : null
    });
  } catch (error) {
    console.error('Get transaction aggregates error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction aggregates' });
  }
});

// Get transaction by ID
router.get('/:id', requirePermission('transactions', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const transaction = await prisma.transaction.findFirst({
      where: { id, deletedAt: null },
      include: {
        pharmaUnit: true,
        creator: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
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
      stakeholderName: null, // We'll need to fetch this separately if needed
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
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, deletedAt: null },
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
      
      const uid = updateData.stakeholderId!;
      switch (updateData.stakeholderType) {
        case 'doctor':
          stakeholderExists = !!(await prisma.doctor.findFirst({ where: { id: uid, deletedAt: null } }));
          break;
        case 'business_partner':
          stakeholderExists = !!(await prisma.businessPartner.findFirst({ where: { id: uid, deletedAt: null } }));
          break;
        case 'employee':
          stakeholderExists = !!(await prisma.employee.findFirst({ where: { id: uid, deletedAt: null } }));
          break;
        case 'distributor':
          stakeholderExists = !!(await prisma.distributor.findFirst({ where: { id: uid, deletedAt: null } }));
          break;
        case 'patient':
          stakeholderExists = !!(await prisma.patient.findFirst({ where: { id: uid, deletedAt: null } }));
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
        }
      }
    });
    
    // Format response
    const formattedTransaction = {
      id: updatedTransaction.id,
      category: updatedTransaction.category,
      stakeholderId: updatedTransaction.stakeholderId,
      stakeholderType: updatedTransaction.stakeholderType,
      stakeholderName: null, // We'll need to fetch this separately if needed
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
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, deletedAt: null }
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

    if (!canDelete) {
      return res.status(403).json({ error: 'Insufficient permissions to delete this transaction' });
    }

    // Soft delete
    await prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } });

    res.json({
      message: 'Transaction deleted successfully',
      deletedId: id
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Batch create transactions for data import - Super Admin only
router.post('/batch', requireRole(['super_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const transactions = req.body.transactions;
    
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Transactions array is required' });
    }

    // Validate all transactions
    const validatedTransactions = [];
    const errors = [];

    for (let i = 0; i < transactions.length; i++) {
      try {
        const transactionData = CreateTransactionSchema.parse(transactions[i]);
        validatedTransactions.push({
          ...transactionData,
          createdBy: req.user!.id,
          pharmaUnitId: req.user?.pharmaUnitId || 'pharma-001',
          date: new Date(transactionData.date)
        });
      } catch (error) {
        errors.push({ index: i, error: error instanceof z.ZodError ? error.errors : 'Invalid transaction data' });
      }
    }

    // Create all valid transactions in a single database transaction
    const results = await prisma.$transaction(
      validatedTransactions.map(data =>
        prisma.transaction.create({
          data,
          include: {
            pharmaUnit: true,
            creator: {
              select: {
                id: true,
                username: true,
                name: true
              }
            }
          }
        })
      )
    );

    res.status(201).json({
      message: `Successfully created ${results.length} transactions`,
      created: results.length,
      errors: errors.length,
      errorDetails: errors
    });

  } catch (error) {
    console.error('Batch create transactions error:', error);
    res.status(500).json({ error: 'Failed to create transactions' });
  }
});

export default router;