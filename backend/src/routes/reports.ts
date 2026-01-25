import express from 'express';
import {
  authenticateToken,
  requirePermission,
  AuthenticatedRequest
} from '../middleware/auth';
import {
  generateWeeklyInsights,
  getDistributorBreakdown,
  getTrendData,
  getCreditProjection,
  getWeekComparisons,
  getSeasonalPatterns
} from '../services/weeklyInsightsService';

const router = express.Router();

// Apply authentication to all report routes
router.use(authenticateToken);

/**
 * GET /api/reports/weekly-insights
 * Generate weekly business insights report
 * Query params:
 *   - date: ISO date string (optional, defaults to current week)
 *   - pharmaUnitId: string (optional for super_admin, required for others)
 */
router.get(
  '/weekly-insights',
  requirePermission('reports', 'read'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { date, pharmaUnitId } = req.query;

      // Determine pharma unit ID
      let targetPharmaUnitId: string;

      if (req.user?.role === 'super_admin') {
        // Super admin can query any pharma unit
        if (!pharmaUnitId) {
          return res.status(400).json({
            error: 'pharmaUnitId is required for super admin queries'
          });
        }
        targetPharmaUnitId = pharmaUnitId as string;
      } else {
        // Other users use their assigned pharma unit
        if (!req.user?.pharmaUnitId) {
          return res.status(403).json({
            error: 'User is not associated with a pharma unit'
          });
        }
        targetPharmaUnitId = req.user.pharmaUnitId;
      }

      // Parse target date
      const targetDate = date ? new Date(date as string) : new Date();

      // Validate date
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      // Generate the report
      const report = await generateWeeklyInsights(targetPharmaUnitId, targetDate);

      res.json(report);
    } catch (error) {
      console.error('Weekly insights error:', error);
      res.status(500).json({ error: 'Failed to generate weekly insights report' });
    }
  }
);

/**
 * GET /api/reports/weekly-insights/historical
 * Get multiple weeks of insights for trend analysis
 * Query params:
 *   - weeksBack: number (default: 4, max: 52)
 *   - pharmaUnitId: string (optional for super_admin, required for others)
 */
router.get(
  '/weekly-insights/historical',
  requirePermission('reports', 'read'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { weeksBack = '4', pharmaUnitId } = req.query;

      // Determine pharma unit ID
      let targetPharmaUnitId: string;

      if (req.user?.role === 'super_admin') {
        if (!pharmaUnitId) {
          return res.status(400).json({
            error: 'pharmaUnitId is required for super admin queries'
          });
        }
        targetPharmaUnitId = pharmaUnitId as string;
      } else {
        if (!req.user?.pharmaUnitId) {
          return res.status(403).json({
            error: 'User is not associated with a pharma unit'
          });
        }
        targetPharmaUnitId = req.user.pharmaUnitId;
      }

      // Parse weeks back (max 52 weeks = 1 year)
      const weeks = Math.min(Math.max(parseInt(weeksBack as string) || 4, 1), 52);

      // Generate reports for multiple weeks
      const reports = [];
      const now = new Date();

      for (let i = 0; i < weeks; i++) {
        const weekDate = new Date(now);
        weekDate.setDate(now.getDate() - i * 7);

        const report = await generateWeeklyInsights(targetPharmaUnitId, weekDate);
        reports.push(report);
      }

      // Sort by week (most recent first)
      reports.sort((a, b) => b.weekInfo.weekStart.getTime() - a.weekInfo.weekStart.getTime());

      res.json({
        weeks,
        reports
      });
    } catch (error) {
      console.error('Historical weekly insights error:', error);
      res.status(500).json({ error: 'Failed to generate historical insights' });
    }
  }
);

/**
 * GET /api/reports/weekly-insights/distributor-breakdown
 * Get distributor-level breakdown with payment history
 * Query params:
 *   - date: ISO date string (optional, defaults to current week)
 *   - pharmaUnitId: string (optional for super_admin, required for others)
 */
router.get(
  '/weekly-insights/distributor-breakdown',
  requirePermission('reports', 'read'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { date, pharmaUnitId } = req.query;

      // Determine pharma unit ID
      let targetPharmaUnitId: string;

      if (req.user?.role === 'super_admin') {
        if (!pharmaUnitId) {
          return res.status(400).json({
            error: 'pharmaUnitId is required for super admin queries'
          });
        }
        targetPharmaUnitId = pharmaUnitId as string;
      } else {
        if (!req.user?.pharmaUnitId) {
          return res.status(403).json({
            error: 'User is not associated with a pharma unit'
          });
        }
        targetPharmaUnitId = req.user.pharmaUnitId;
      }

      const targetDate = date ? new Date(date as string) : new Date();

      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      const breakdown = await getDistributorBreakdown(targetPharmaUnitId, targetDate);

      res.json(breakdown);
    } catch (error) {
      console.error('Distributor breakdown error:', error);
      res.status(500).json({ error: 'Failed to generate distributor breakdown' });
    }
  }
);

/**
 * GET /api/reports/weekly-insights/trends
 * Get multi-week trend data (up to 12 weeks)
 * Query params:
 *   - weeksBack: number (default: 12, max: 52)
 *   - pharmaUnitId: string (optional for super_admin, required for others)
 */
router.get(
  '/weekly-insights/trends',
  requirePermission('reports', 'read'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { weeksBack = '12', pharmaUnitId } = req.query;

      // Determine pharma unit ID
      let targetPharmaUnitId: string;

      if (req.user?.role === 'super_admin') {
        if (!pharmaUnitId) {
          return res.status(400).json({
            error: 'pharmaUnitId is required for super admin queries'
          });
        }
        targetPharmaUnitId = pharmaUnitId as string;
      } else {
        if (!req.user?.pharmaUnitId) {
          return res.status(403).json({
            error: 'User is not associated with a pharma unit'
          });
        }
        targetPharmaUnitId = req.user.pharmaUnitId;
      }

      const weeks = Math.min(Math.max(parseInt(weeksBack as string) || 12, 1), 52);

      const trendData = await getTrendData(targetPharmaUnitId, weeks);

      res.json(trendData);
    } catch (error) {
      console.error('Trend data error:', error);
      res.status(500).json({ error: 'Failed to generate trend data' });
    }
  }
);

/**
 * GET /api/reports/weekly-insights/projection
 * Get credit projection with multiple scenarios
 * Query params:
 *   - date: ISO date string (optional, defaults to current week)
 *   - pharmaUnitId: string (optional for super_admin, required for others)
 */
router.get(
  '/weekly-insights/projection',
  requirePermission('reports', 'read'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { date, pharmaUnitId } = req.query;

      // Determine pharma unit ID
      let targetPharmaUnitId: string;

      if (req.user?.role === 'super_admin') {
        if (!pharmaUnitId) {
          return res.status(400).json({
            error: 'pharmaUnitId is required for super admin queries'
          });
        }
        targetPharmaUnitId = pharmaUnitId as string;
      } else {
        if (!req.user?.pharmaUnitId) {
          return res.status(403).json({
            error: 'User is not associated with a pharma unit'
          });
        }
        targetPharmaUnitId = req.user.pharmaUnitId;
      }

      const targetDate = date ? new Date(date as string) : new Date();

      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      const projection = await getCreditProjection(targetPharmaUnitId, targetDate);

      res.json(projection);
    } catch (error) {
      console.error('Credit projection error:', error);
      res.status(500).json({ error: 'Failed to generate credit projection' });
    }
  }
);

/**
 * GET /api/reports/weekly-insights/comparisons
 * Get week-over-week metric comparisons
 * Query params:
 *   - date: ISO date string (optional, defaults to current week)
 *   - pharmaUnitId: string (optional for super_admin, required for others)
 */
router.get(
  '/weekly-insights/comparisons',
  requirePermission('reports', 'read'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { date, pharmaUnitId } = req.query;

      // Determine pharma unit ID
      let targetPharmaUnitId: string;

      if (req.user?.role === 'super_admin') {
        if (!pharmaUnitId) {
          return res.status(400).json({
            error: 'pharmaUnitId is required for super admin queries'
          });
        }
        targetPharmaUnitId = pharmaUnitId as string;
      } else {
        if (!req.user?.pharmaUnitId) {
          return res.status(403).json({
            error: 'User is not associated with a pharma unit'
          });
        }
        targetPharmaUnitId = req.user.pharmaUnitId;
      }

      const targetDate = date ? new Date(date as string) : new Date();

      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      const comparisons = await getWeekComparisons(targetPharmaUnitId, targetDate);

      res.json(comparisons);
    } catch (error) {
      console.error('Week comparisons error:', error);
      res.status(500).json({ error: 'Failed to generate week comparisons' });
    }
  }
);

/**
 * GET /api/reports/weekly-insights/seasonal
 * Get seasonal pattern analysis
 * Query params:
 *   - monthsBack: number (default: 12, max: 24)
 *   - pharmaUnitId: string (optional for super_admin, required for others)
 */
router.get(
  '/weekly-insights/seasonal',
  requirePermission('reports', 'read'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { monthsBack = '12', pharmaUnitId } = req.query;

      // Determine pharma unit ID
      let targetPharmaUnitId: string;

      if (req.user?.role === 'super_admin') {
        if (!pharmaUnitId) {
          return res.status(400).json({
            error: 'pharmaUnitId is required for super admin queries'
          });
        }
        targetPharmaUnitId = pharmaUnitId as string;
      } else {
        if (!req.user?.pharmaUnitId) {
          return res.status(403).json({
            error: 'User is not associated with a pharma unit'
          });
        }
        targetPharmaUnitId = req.user.pharmaUnitId;
      }

      const months = Math.min(Math.max(parseInt(monthsBack as string) || 12, 6), 24);

      const patterns = await getSeasonalPatterns(targetPharmaUnitId, months);

      res.json(patterns);
    } catch (error) {
      console.error('Seasonal patterns error:', error);
      res.status(500).json({ error: 'Failed to generate seasonal patterns' });
    }
  }
);

export default router;
