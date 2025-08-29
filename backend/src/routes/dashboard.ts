import express from 'express';
import { authenticateToken, requirePermission, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = express.Router();

// Apply authentication to all dashboard routes
router.use(authenticateToken);

// Get dashboard overview stats
router.get('/overview', requirePermission('dashboard', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    // Determine filter scope based on user role
    let pharmaUnitFilter: any = {};
    let stakeholderFilter: any = {};
    
    if (req.user?.role === 'doctor' && req.user.linkedStakeholderId) {
      stakeholderFilter = {
        stakeholderId: req.user.linkedStakeholderId,
        stakeholderType: 'doctor'
      };
    } else if (req.user?.role === 'partner' && req.user.linkedStakeholderId) {
      stakeholderFilter = {
        stakeholderId: req.user.linkedStakeholderId,
        stakeholderType: 'business_partner'
      };
    } else if (req.user?.role === 'distributor' && req.user.linkedStakeholderId) {
      stakeholderFilter = {
        stakeholderId: req.user.linkedStakeholderId,
        stakeholderType: 'distributor'
      };
    } else if (['operator', 'admin'].includes(req.user?.role || '')) {
      pharmaUnitFilter = { pharmaUnitId: req.user?.pharmaUnitId };
    }
    // Super admin gets all data (no filters)
    
    const transactionFilter = { ...pharmaUnitFilter, ...stakeholderFilter };
    
    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Get current week date range
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Parallel queries for dashboard stats
    const [
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      totalTransactions,
      monthlyTransactions,
      recentTransactions,
      stakeholderCounts
    ] = await Promise.all([
      // Total revenue
      prisma.transaction.aggregate({
        where: {
          ...transactionFilter,
          category: { in: ['pharmacy_sale', 'consultation_fee'] }
        },
        _sum: { amount: true }
      }),
      
      // Monthly revenue
      prisma.transaction.aggregate({
        where: {
          ...transactionFilter,
          category: { in: ['pharmacy_sale', 'consultation_fee'] },
          date: { gte: startOfMonth, lte: endOfMonth }
        },
        _sum: { amount: true }
      }),
      
      // Weekly revenue
      prisma.transaction.aggregate({
        where: {
          ...transactionFilter,
          category: { in: ['pharmacy_sale', 'consultation_fee'] },
          date: { gte: startOfWeek, lte: endOfWeek }
        },
        _sum: { amount: true }
      }),
      
      // Total transactions
      prisma.transaction.count({ where: transactionFilter }),
      
      // Monthly transactions
      prisma.transaction.count({
        where: {
          ...transactionFilter,
          date: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      
      // Recent transactions (limited based on role)
      prisma.transaction.findMany({
        where: transactionFilter,
        include: {
          creator: {
            select: { username: true, name: true }
          },
          doctor: { select: { name: true } },
          businessPartner: { select: { name: true } },
          employee: { select: { name: true } },
          distributor: { select: { name: true } },
          patient: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Stakeholder counts (only for admin/super_admin)
      ['super_admin', 'admin', 'operator'].includes(req.user?.role || '') 
        ? Promise.all([
            prisma.doctor.count({ where: pharmaUnitFilter }),
            prisma.businessPartner.count({ where: pharmaUnitFilter }),
            prisma.employee.count({ where: pharmaUnitFilter }),
            prisma.distributor.count({ where: pharmaUnitFilter }),
            prisma.patient.count({ where: { ...pharmaUnitFilter, isActive: true } })
          ])
        : Promise.resolve([0, 0, 0, 0, 0])
    ]);
    
    // Format recent transactions
    const formattedTransactions = recentTransactions.map(transaction => ({
      id: transaction.id,
      category: transaction.category,
      stakeholderName: 
        transaction.doctor?.name ||
        transaction.businessPartner?.name ||
        transaction.employee?.name ||
        transaction.distributor?.name ||
        transaction.patient?.name ||
        'N/A',
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.date,
      createdBy: transaction.creator.name || transaction.creator.username
    }));
    
    const [doctorCount, partnerCount, employeeCount, distributorCount, patientCount] = stakeholderCounts;
    
    res.json({
      overview: {
        revenue: {
          total: totalRevenue._sum.amount || 0,
          monthly: monthlyRevenue._sum.amount || 0,
          weekly: weeklyRevenue._sum.amount || 0
        },
        transactions: {
          total: totalTransactions,
          monthly: monthlyTransactions
        },
        stakeholders: {
          doctors: doctorCount,
          partners: partnerCount,
          employees: employeeCount,
          distributors: distributorCount,
          patients: patientCount
        }
      },
      recentTransactions: formattedTransactions
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

// Get revenue analytics
router.get('/revenue-analytics', requirePermission('dashboard', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear().toString() } = req.query;
    
    // Determine filter scope
    let pharmaUnitFilter: any = {};
    let stakeholderFilter: any = {};
    
    if (req.user?.role === 'doctor' && req.user.linkedStakeholderId) {
      stakeholderFilter = {
        stakeholderId: req.user.linkedStakeholderId,
        stakeholderType: 'doctor'
      };
    } else if (req.user?.role === 'partner' && req.user.linkedStakeholderId) {
      stakeholderFilter = {
        stakeholderId: req.user.linkedStakeholderId,
        stakeholderType: 'business_partner'
      };
    } else if (req.user?.role === 'distributor' && req.user.linkedStakeholderId) {
      stakeholderFilter = {
        stakeholderId: req.user.linkedStakeholderId,
        stakeholderType: 'distributor'
      };
    } else if (['operator', 'admin'].includes(req.user?.role || '')) {
      pharmaUnitFilter = { pharmaUnitId: req.user?.pharmaUnitId };
    }
    
    const transactionFilter = { 
      ...pharmaUnitFilter, 
      ...stakeholderFilter,
      category: { in: ['pharmacy_sale', 'consultation_fee'] }
    };
    
    const targetYear = parseInt(year as string);
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
    
    // Get monthly revenue data
    const monthlyData = await prisma.transaction.findMany({
      where: {
        ...transactionFilter,
        date: { gte: startDate, lte: endDate }
      },
      select: {
        amount: true,
        date: true,
        category: true
      }
    });
    
    // Process data by month
    const monthlyRevenue = Array.from({ length: 12 }, (_, index) => ({
      month: new Date(0, index).toLocaleString('default', { month: 'long' }),
      pharmacy_sales: 0,
      consultation_fees: 0,
      total: 0
    }));
    
    monthlyData.forEach(transaction => {
      const month = transaction.date.getMonth();
      const amount = transaction.amount;
      
      if (transaction.category === 'pharmacy_sale') {
        monthlyRevenue[month].pharmacy_sales += amount;
      } else if (transaction.category === 'consultation_fee') {
        monthlyRevenue[month].consultation_fees += amount;
      }
      monthlyRevenue[month].total += amount;
    });
    
    // Get category breakdown
    const categoryBreakdown = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        ...transactionFilter,
        date: { gte: startDate, lte: endDate }
      },
      _sum: {
        amount: true
      }
    });
    
    const formattedBreakdown = categoryBreakdown.map(item => ({
      category: item.category,
      amount: item._sum.amount || 0
    }));
    
    res.json({
      period,
      year: targetYear,
      monthlyRevenue,
      categoryBreakdown: formattedBreakdown
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// Get stakeholder performance
router.get('/stakeholder-performance', requirePermission('dashboard', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { type, period = '30' } = req.query;
    
    // Determine filter scope
    let pharmaUnitFilter: any = {};
    if (['operator', 'admin'].includes(req.user?.role || '')) {
      pharmaUnitFilter = { pharmaUnitId: req.user?.pharmaUnitId };
    }
    // Stakeholder users only see their own performance (handled in frontend)
    
    const daysBack = parseInt(period as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    let performanceData: any[] = [];
    
    if (!type || type === 'doctors') {
      const doctorPerformance = await prisma.transaction.groupBy({
        by: ['stakeholderId'],
        where: {
          ...pharmaUnitFilter,
          stakeholderType: 'doctor',
          category: 'consultation_fee',
          date: { gte: startDate }
        },
        _sum: { amount: true },
        _count: true
      });
      
      // Get doctor names
      const doctorIds = doctorPerformance.map(d => d.stakeholderId).filter(Boolean) as string[];
      const doctors = await prisma.doctor.findMany({
        where: { id: { in: doctorIds } },
        select: { id: true, name: true, consultationFee: true, commissionRate: true }
      });
      
      const doctorMap = new Map(doctors.map(d => [d.id, d]));
      
      performanceData.push({
        type: 'doctors',
        data: doctorPerformance.map(item => {
          const doctor = doctorMap.get(item.stakeholderId!);
          return {
            id: item.stakeholderId,
            name: doctor?.name || 'Unknown Doctor',
            totalRevenue: item._sum.amount || 0,
            transactionCount: item._count,
            consultationFee: doctor?.consultationFee || 0,
            commissionRate: doctor?.commissionRate || 0
          };
        }).sort((a, b) => b.totalRevenue - a.totalRevenue)
      });
    }
    
    if (!type || type === 'distributors') {
      const distributorPerformance = await prisma.transaction.groupBy({
        by: ['stakeholderId'],
        where: {
          ...pharmaUnitFilter,
          stakeholderType: 'distributor',
          date: { gte: startDate }
        },
        _sum: { amount: true },
        _count: true
      });
      
      // Get distributor names
      const distributorIds = distributorPerformance.map(d => d.stakeholderId).filter(Boolean) as string[];
      const distributors = await prisma.distributor.findMany({
        where: { id: { in: distributorIds } },
        select: { id: true, name: true, creditBalance: true, paymentPercentage: true }
      });
      
      const distributorMap = new Map(distributors.map(d => [d.id, d]));
      
      performanceData.push({
        type: 'distributors',
        data: distributorPerformance.map(item => {
          const distributor = distributorMap.get(item.stakeholderId!);
          return {
            id: item.stakeholderId,
            name: distributor?.name || 'Unknown Distributor',
            totalAmount: item._sum.amount || 0,
            transactionCount: item._count,
            creditBalance: distributor?.creditBalance || 0,
            paymentPercentage: distributor?.paymentPercentage || 0
          };
        }).sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount))
      });
    }
    
    res.json({
      period: `${daysBack} days`,
      performance: performanceData
    });
  } catch (error) {
    console.error('Stakeholder performance error:', error);
    res.status(500).json({ error: 'Failed to fetch stakeholder performance' });
  }
});

// Get financial summary
router.get('/financial-summary', requirePermission('dashboard', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Determine filter scope
    let pharmaUnitFilter: any = {};
    let stakeholderFilter: any = {};
    
    if (req.user?.role === 'doctor' && req.user.linkedStakeholderId) {
      stakeholderFilter = {
        stakeholderId: req.user.linkedStakeholderId,
        stakeholderType: 'doctor'
      };
    } else if (req.user?.role === 'partner' && req.user.linkedStakeholderId) {
      stakeholderFilter = {
        stakeholderId: req.user.linkedStakeholderId,
        stakeholderType: 'business_partner'
      };
    } else if (req.user?.role === 'distributor' && req.user.linkedStakeholderId) {
      stakeholderFilter = {
        stakeholderId: req.user.linkedStakeholderId,
        stakeholderType: 'distributor'
      };
    } else if (['operator', 'admin'].includes(req.user?.role || '')) {
      pharmaUnitFilter = { pharmaUnitId: req.user?.pharmaUnitId };
    }
    
    const transactionFilter: any = { ...pharmaUnitFilter, ...stakeholderFilter };
    
    if (startDate || endDate) {
      transactionFilter.date = {};
      if (startDate) transactionFilter.date.gte = new Date(startDate as string);
      if (endDate) transactionFilter.date.lte = new Date(endDate as string);
    }
    
    // Get financial breakdown by category
    const financialBreakdown = await prisma.transaction.groupBy({
      by: ['category'],
      where: transactionFilter,
      _sum: { amount: true },
      _count: true
    });
    
    // Calculate totals
    let totalRevenue = 0;
    let totalExpenses = 0;
    
    const categoryData = financialBreakdown.map(item => {
      const amount = item._sum.amount || 0;
      const isRevenue = ['pharmacy_sale', 'consultation_fee', 'patient_payment'].includes(item.category);
      
      if (isRevenue) {
        totalRevenue += amount;
      } else {
        totalExpenses += Math.abs(amount);
      }
      
      return {
        category: item.category,
        amount,
        count: item._count,
        type: isRevenue ? 'revenue' : 'expense'
      };
    });
    
    const netProfit = totalRevenue - totalExpenses;
    
    res.json({
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      },
      categoryBreakdown: categoryData,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (error) {
    console.error('Financial summary error:', error);
    res.status(500).json({ error: 'Failed to fetch financial summary' });
  }
});

export default router;