import express from 'express';
import { z } from 'zod';
import { authenticateToken, requirePermission, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = express.Router();

router.use(authenticateToken);

const DepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true)
});

// GET /api/departments
router.get('/', async (_req, res) => {
  try {
    const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
    res.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// POST /api/departments
router.post('/', requirePermission('configurations', 'create'), async (req: AuthenticatedRequest, res) => {
  try {
    const data = DepartmentSchema.parse(req.body);
    const department = await prisma.department.create({
      data: { name: data.name, description: data.description, isActive: data.isActive }
    });
    res.status(201).json({ department });
  } catch (error) {
    if ((error as any).code === 'P2002') {
      return res.status(409).json({ error: 'A department with this name already exists' });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// POST /api/departments/batch — create multiple at once (used for initial seeding)
router.post('/batch', requirePermission('configurations', 'create'), async (req: AuthenticatedRequest, res) => {
  try {
    const items = z.array(DepartmentSchema).parse(req.body.departments);

    // Use upsert so re-running is safe (unique constraint on name)
    const results = await Promise.all(
      items.map(data =>
        prisma.department.upsert({
          where: { name: data.name },
          update: {},
          create: { name: data.name, description: data.description, isActive: data.isActive }
        })
      )
    );

    res.status(201).json({ departments: results, created: results.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error batch-creating departments:', error);
    res.status(500).json({ error: 'Failed to create departments' });
  }
});

// PUT /api/departments/:id
router.put('/:id', requirePermission('configurations', 'update'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const data = DepartmentSchema.partial().parse(req.body);
    const department = await prisma.department.update({ where: { id }, data });
    res.json({ department });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Department not found' });
    }
    if ((error as any).code === 'P2002') {
      return res.status(409).json({ error: 'A department with this name already exists' });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// DELETE /api/departments/:id
router.delete('/:id', requirePermission('configurations', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.department.delete({ where: { id } });
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Department not found' });
    }
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

export default router;
