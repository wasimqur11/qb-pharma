import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = express.Router();

router.use(authenticateToken);

/**
 * Returns a per-type "last changed" epoch (ms) used by the frontend auto-sync hook.
 *
 * Strategy per model:
 *   - Patient: MAX(updatedAt)  — has @updatedAt, covers creates, edits, and soft-deletes
 *   - All others: MAX(createdAt, deletedAt) — covers creates and soft-deletes
 *     (edits are not detectable without updatedAt; adding @updatedAt to those models is a separate task)
 *
 * The frontend compares these values poll-to-poll — any increase triggers a data reload.
 */
router.get('/last-update', async (req: AuthenticatedRequest, res) => {
  try {
    const pharmaUnitFilter: any =
      req.user?.role !== 'super_admin' && req.user?.pharmaUnitId
        ? { pharmaUnitId: req.user.pharmaUnitId }
        : {};

    const [
      txMax,
      doctorMax,
      partnerMax,
      employeeMax,
      distributorMax,
      patientMax
    ] = await Promise.all([
      prisma.transaction.aggregate({
        _max: { createdAt: true, deletedAt: true },
        where: pharmaUnitFilter
      }),
      prisma.doctor.aggregate({
        _max: { createdAt: true, deletedAt: true },
        where: pharmaUnitFilter
      }),
      prisma.businessPartner.aggregate({
        _max: { createdAt: true, deletedAt: true },
        where: pharmaUnitFilter
      }),
      prisma.employee.aggregate({
        _max: { createdAt: true, deletedAt: true },
        where: pharmaUnitFilter
      }),
      prisma.distributor.aggregate({
        _max: { createdAt: true, deletedAt: true },
        where: pharmaUnitFilter
      }),
      prisma.patient.aggregate({
        _max: { updatedAt: true },
        where: pharmaUnitFilter
      })
    ]);

    // Take the largest epoch across any number of nullable Date values
    const latest = (...dates: (Date | null | undefined)[]): number =>
      dates.reduce<number>((max, d) => Math.max(max, d?.getTime() ?? 0), 0);

    res.json({
      timestamps: {
        transactions:     latest(txMax._max.createdAt, txMax._max.deletedAt),
        doctors:          latest(doctorMax._max.createdAt, doctorMax._max.deletedAt),
        businessPartners: latest(partnerMax._max.createdAt, partnerMax._max.deletedAt),
        employees:        latest(employeeMax._max.createdAt, employeeMax._max.deletedAt),
        distributors:     latest(distributorMax._max.createdAt, distributorMax._max.deletedAt),
        patients:         latest(patientMax._max.updatedAt)
      },
      serverTime: Date.now()
    });
  } catch (error) {
    console.error('Sync last-update error:', error);
    res.status(500).json({ error: 'Failed to get last update timestamps' });
  }
});

export default router;
