import express from 'express';
import { z } from 'zod';
import { authenticateToken, requirePermission, requireSameStakeholderOrAdmin, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = express.Router();

// Apply authentication to all stakeholder routes
router.use(authenticateToken);

// Validation schemas for different stakeholder types
const DoctorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  consultationFee: z.number().positive('Consultation fee must be positive'),
  commissionRate: z.number().min(0).max(100, 'Commission rate must be between 0 and 100'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  pharmaUnitId: z.string().optional()
});

const BusinessPartnerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  ownershipPercentage: z.number().min(0).max(100, 'Ownership percentage must be between 0 and 100'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  pharmaUnitId: z.string().optional()
});

const EmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  salary: z.number().positive('Salary must be positive'),
  department: z.string().min(1, 'Department is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  salaryDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  lastPaidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  salaryFrequency: z.enum(['monthly', 'bi_weekly', 'weekly']).default('monthly'),
  pharmaUnitId: z.string().optional()
});

const DistributorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  creditBalance: z.number().default(0),
  initialBalanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  paymentSchedule: z.enum(['weekly', 'bi_weekly', 'monthly']),
  paymentPercentage: z.number().min(0).max(100, 'Payment percentage must be between 0 and 100'),
  nextPaymentDue: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  lastPaymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  pharmaUnitId: z.string().optional()
});

const PatientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  creditLimit: z.number().default(0),
  currentCredit: z.number().default(0),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  pharmaUnitId: z.string().optional()
});

// Get all stakeholders by type
router.get('/:type', requirePermission('stakeholders', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { type } = req.params;
    const { page = '1', limit = '50', search } = req.query;
    
    const validTypes = ['doctors', 'business-partners', 'employees', 'distributors', 'patients'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid stakeholder type' });
    }
    
    // Determine pharma unit filter
    let pharmaUnitFilter: any = {};
    if (req.user?.role !== 'super_admin') {
      if (!req.user?.pharmaUnitId) {
        return res.status(400).json({ error: 'User must be associated with a pharma unit' });
      }
      pharmaUnitFilter = { pharmaUnitId: req.user.pharmaUnitId };
    }
    
    // Add search filter
    let searchFilter: any = {};
    if (search && typeof search === 'string') {
      searchFilter = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      };
    }
    
    const whereClause = { ...pharmaUnitFilter, ...searchFilter };
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;
    
    let stakeholders: any[] = [];
    let totalCount = 0;
    
    // Fetch stakeholders based on type
    switch (type) {
      case 'doctors':
        [stakeholders, totalCount] = await Promise.all([
          prisma.doctor.findMany({
            where: whereClause,
            include: { pharmaUnit: true },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum
          }),
          prisma.doctor.count({ where: whereClause })
        ]);
        break;
      case 'business-partners':
        [stakeholders, totalCount] = await Promise.all([
          prisma.businessPartner.findMany({
            where: whereClause,
            include: { pharmaUnit: true },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum
          }),
          prisma.businessPartner.count({ where: whereClause })
        ]);
        break;
      case 'employees':
        [stakeholders, totalCount] = await Promise.all([
          prisma.employee.findMany({
            where: whereClause,
            include: { pharmaUnit: true },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum
          }),
          prisma.employee.count({ where: whereClause })
        ]);
        break;
      case 'distributors':
        [stakeholders, totalCount] = await Promise.all([
          prisma.distributor.findMany({
            where: whereClause,
            include: { pharmaUnit: true },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum
          }),
          prisma.distributor.count({ where: whereClause })
        ]);
        break;
      case 'patients':
        [stakeholders, totalCount] = await Promise.all([
          prisma.patient.findMany({
            where: whereClause,
            include: { pharmaUnit: true },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum
          }),
          prisma.patient.count({ where: whereClause })
        ]);
        break;
    }
    
    // Format response
    const formattedStakeholders = stakeholders.map(stakeholder => ({
      ...stakeholder,
      pharmaUnitName: stakeholder.pharmaUnit?.name
    }));
    
    res.json({
      stakeholders: formattedStakeholders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('Get stakeholders error:', error);
    res.status(500).json({ error: 'Failed to fetch stakeholders' });
  }
});

// Create stakeholder
router.post('/:type', requirePermission('stakeholders', 'create'), async (req: AuthenticatedRequest, res) => {
  try {
    const { type } = req.params;
    
    const validTypes = ['doctors', 'business-partners', 'employees', 'distributors', 'patients'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid stakeholder type' });
    }
    
    // Determine pharma unit
    let pharmaUnitId = req.user?.pharmaUnitId;
    if (req.user?.role === 'super_admin' && req.body.pharmaUnitId) {
      pharmaUnitId = req.body.pharmaUnitId;
    }
    
    if (!pharmaUnitId) {
      return res.status(400).json({ error: 'Pharma unit is required' });
    }
    
    let stakeholder: any;
    let validationSchema: any;
    
    // Validate and create based on type
    switch (type) {
      case 'doctors':
        validationSchema = DoctorSchema;
        break;
      case 'business-partners':
        validationSchema = BusinessPartnerSchema;
        break;
      case 'employees':
        validationSchema = EmployeeSchema;
        break;
      case 'distributors':
        validationSchema = DistributorSchema;
        break;
      case 'patients':
        validationSchema = PatientSchema;
        break;
    }
    
    const validatedData = validationSchema.parse({ ...req.body, pharmaUnitId });
    
    // Create stakeholder
    switch (type) {
      case 'doctors':
        stakeholder = await prisma.doctor.create({
          data: validatedData,
          include: { pharmaUnit: true }
        });
        break;
      case 'business-partners':
        stakeholder = await prisma.businessPartner.create({
          data: validatedData,
          include: { pharmaUnit: true }
        });
        break;
      case 'employees':
        stakeholder = await prisma.employee.create({
          data: validatedData,
          include: { pharmaUnit: true }
        });
        break;
      case 'distributors':
        stakeholder = await prisma.distributor.create({
          data: validatedData,
          include: { pharmaUnit: true }
        });
        break;
      case 'patients':
        stakeholder = await prisma.patient.create({
          data: validatedData,
          include: { pharmaUnit: true }
        });
        break;
    }
    
    res.status(201).json({
      message: `${type.slice(0, -1)} created successfully`,
      stakeholder: {
        ...stakeholder,
        pharmaUnitName: stakeholder.pharmaUnit?.name
      }
    });
  } catch (error) {
    console.error('Create stakeholder error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    res.status(500).json({ error: 'Failed to create stakeholder' });
  }
});

// Get stakeholder by ID
router.get('/:type/:id', requirePermission('stakeholders', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { type, id } = req.params;
    
    const validTypes = ['doctors', 'business-partners', 'employees', 'distributors', 'patients'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid stakeholder type' });
    }
    
    let stakeholder: any;
    
    // Fetch stakeholder based on type
    switch (type) {
      case 'doctors':
        stakeholder = await prisma.doctor.findUnique({
          where: { id },
          include: { pharmaUnit: true }
        });
        break;
      case 'business-partners':
        stakeholder = await prisma.businessPartner.findUnique({
          where: { id },
          include: { pharmaUnit: true }
        });
        break;
      case 'employees':
        stakeholder = await prisma.employee.findUnique({
          where: { id },
          include: { pharmaUnit: true }
        });
        break;
      case 'distributors':
        stakeholder = await prisma.distributor.findUnique({
          where: { id },
          include: { pharmaUnit: true }
        });
        break;
      case 'patients':
        stakeholder = await prisma.patient.findUnique({
          where: { id },
          include: { pharmaUnit: true }
        });
        break;
    }
    
    if (!stakeholder) {
      return res.status(404).json({ error: 'Stakeholder not found' });
    }
    
    // Check access permissions
    if (req.user?.role !== 'super_admin' && stakeholder.pharmaUnitId !== req.user?.pharmaUnitId) {
      return res.status(403).json({ error: 'Access denied to stakeholders from other pharma units' });
    }
    
    res.json({
      stakeholder: {
        ...stakeholder,
        pharmaUnitName: stakeholder.pharmaUnit?.name
      }
    });
  } catch (error) {
    console.error('Get stakeholder error:', error);
    res.status(500).json({ error: 'Failed to fetch stakeholder' });
  }
});

// Update stakeholder
router.put('/:type/:id', requirePermission('stakeholders', 'update'), async (req: AuthenticatedRequest, res) => {
  try {
    const { type, id } = req.params;
    
    const validTypes = ['doctors', 'business-partners', 'employees', 'distributors', 'patients'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid stakeholder type' });
    }
    
    // Check if stakeholder exists and get current data
    let existingStakeholder: any;
    switch (type) {
      case 'doctors':
        existingStakeholder = await prisma.doctor.findUnique({ where: { id } });
        break;
      case 'business-partners':
        existingStakeholder = await prisma.businessPartner.findUnique({ where: { id } });
        break;
      case 'employees':
        existingStakeholder = await prisma.employee.findUnique({ where: { id } });
        break;
      case 'distributors':
        existingStakeholder = await prisma.distributor.findUnique({ where: { id } });
        break;
      case 'patients':
        existingStakeholder = await prisma.patient.findUnique({ where: { id } });
        break;
    }
    
    if (!existingStakeholder) {
      return res.status(404).json({ error: 'Stakeholder not found' });
    }
    
    // Check access permissions
    if (req.user?.role !== 'super_admin' && existingStakeholder.pharmaUnitId !== req.user?.pharmaUnitId) {
      return res.status(403).json({ error: 'Access denied to stakeholders from other pharma units' });
    }
    
    // Validate update data (make all fields optional)
    let validationSchema: any;
    switch (type) {
      case 'doctors':
        validationSchema = DoctorSchema.partial();
        break;
      case 'business-partners':
        validationSchema = BusinessPartnerSchema.partial();
        break;
      case 'employees':
        validationSchema = EmployeeSchema.partial();
        break;
      case 'distributors':
        validationSchema = DistributorSchema.partial();
        break;
      case 'patients':
        validationSchema = PatientSchema.partial();
        break;
    }
    
    const updateData = validationSchema.parse(req.body);
    
    // Update stakeholder
    let updatedStakeholder: any;
    switch (type) {
      case 'doctors':
        updatedStakeholder = await prisma.doctor.update({
          where: { id },
          data: updateData,
          include: { pharmaUnit: true }
        });
        break;
      case 'business-partners':
        updatedStakeholder = await prisma.businessPartner.update({
          where: { id },
          data: updateData,
          include: { pharmaUnit: true }
        });
        break;
      case 'employees':
        updatedStakeholder = await prisma.employee.update({
          where: { id },
          data: updateData,
          include: { pharmaUnit: true }
        });
        break;
      case 'distributors':
        updatedStakeholder = await prisma.distributor.update({
          where: { id },
          data: updateData,
          include: { pharmaUnit: true }
        });
        break;
      case 'patients':
        updatedStakeholder = await prisma.patient.update({
          where: { id },
          data: updateData,
          include: { pharmaUnit: true }
        });
        break;
    }
    
    res.json({
      message: `${type.slice(0, -1)} updated successfully`,
      stakeholder: {
        ...updatedStakeholder,
        pharmaUnitName: updatedStakeholder.pharmaUnit?.name
      }
    });
  } catch (error) {
    console.error('Update stakeholder error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    res.status(500).json({ error: 'Failed to update stakeholder' });
  }
});

// Delete stakeholder
router.delete('/:type/:id', requirePermission('stakeholders', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const { type, id } = req.params;
    
    const validTypes = ['doctors', 'business-partners', 'employees', 'distributors', 'patients'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid stakeholder type' });
    }
    
    // Check if stakeholder exists
    let existingStakeholder: any;
    switch (type) {
      case 'doctors':
        existingStakeholder = await prisma.doctor.findUnique({ where: { id } });
        break;
      case 'business-partners':
        existingStakeholder = await prisma.businessPartner.findUnique({ where: { id } });
        break;
      case 'employees':
        existingStakeholder = await prisma.employee.findUnique({ where: { id } });
        break;
      case 'distributors':
        existingStakeholder = await prisma.distributor.findUnique({ where: { id } });
        break;
      case 'patients':
        existingStakeholder = await prisma.patient.findUnique({ where: { id } });
        break;
    }
    
    if (!existingStakeholder) {
      return res.status(404).json({ error: 'Stakeholder not found' });
    }
    
    // Check access permissions
    if (req.user?.role !== 'super_admin' && existingStakeholder.pharmaUnitId !== req.user?.pharmaUnitId) {
      return res.status(403).json({ error: 'Access denied to stakeholders from other pharma units' });
    }
    
    // Check if stakeholder has transactions
    const transactionCount = await prisma.transaction.count({
      where: { stakeholderId: id }
    });
    
    if (transactionCount > 0) {
      // For patients, we can deactivate them instead of hard delete
      if (type === 'patients') {
        await prisma.patient.update({
          where: { id },
          data: { isActive: false }
        });
        
        return res.json({ 
          message: 'Patient deactivated successfully (has transaction history)',
          deleted: false,
          deactivated: true
        });
      } else {
        return res.status(400).json({ 
          error: 'Cannot delete stakeholder with transaction history',
          transactionCount
        });
      }
    }
    
    // Delete stakeholder
    switch (type) {
      case 'doctors':
        await prisma.doctor.delete({ where: { id } });
        break;
      case 'business-partners':
        await prisma.businessPartner.delete({ where: { id } });
        break;
      case 'employees':
        await prisma.employee.delete({ where: { id } });
        break;
      case 'distributors':
        await prisma.distributor.delete({ where: { id } });
        break;
      case 'patients':
        await prisma.patient.delete({ where: { id } });
        break;
    }
    
    res.json({ 
      message: `${type.slice(0, -1)} deleted successfully`,
      deleted: true,
      deactivated: false
    });
  } catch (error) {
    console.error('Delete stakeholder error:', error);
    res.status(500).json({ error: 'Failed to delete stakeholder' });
  }
});

export default router;