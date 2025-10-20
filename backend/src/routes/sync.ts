import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = express.Router();

// Apply authentication to all sync routes
router.use(authenticateToken);

/**
 * Get last update timestamps for all data types
 * This endpoint is used by frontend to detect changes and trigger auto-refresh
 */
router.get('/last-update', async (req: AuthenticatedRequest, res) => {
  try {
    // Determine filter scope based on user role
    let pharmaUnitFilter: any = {};

    if (req.user?.role !== 'super_admin' && req.user?.pharmaUnitId) {
      pharmaUnitFilter = { pharmaUnitId: req.user.pharmaUnitId };
    }

    // Get row counts for each data type (changes in count indicate data changes)
    const [
      transactionCount,
      doctorCount,
      businessPartnerCount,
      employeeCount,
      distributorCount,
      patientCount
    ] = await Promise.all([
      prisma.transaction.count({ where: pharmaUnitFilter }),
      prisma.doctor.count({ where: pharmaUnitFilter }),
      prisma.businessPartner.count({ where: pharmaUnitFilter }),
      prisma.employee.count({ where: pharmaUnitFilter }),
      prisma.distributor.count({ where: pharmaUnitFilter }),
      prisma.patient.count({ where: pharmaUnitFilter })
    ]);

    // Return counts as change detection mechanism
    // When counts change, data has been added/deleted
    res.json({
      timestamps: {
        transactions: transactionCount,
        doctors: doctorCount,
        businessPartners: businessPartnerCount,
        employees: employeeCount,
        distributors: distributorCount,
        patients: patientCount
      },
      serverTime: Date.now()
    });
  } catch (error) {
    console.error('Sync last-update error:', error);
    res.status(500).json({ error: 'Failed to get last update timestamps' });
  }
});

export default router;
