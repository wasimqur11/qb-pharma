import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole, requireSameUserOrAdmin, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = express.Router();

// Apply authentication to all user routes
router.use(authenticateToken);

// Validation schemas
const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(['super_admin', 'admin', 'manager', 'operator', 'doctor', 'partner', 'distributor']).optional(),
  pharmaUnitId: z.string().optional(),
  linkedStakeholderId: z.string().optional(),
  linkedStakeholderType: z.enum(['doctor', 'business_partner', 'employee', 'distributor', 'patient']).optional(),
  isActive: z.boolean().optional()
});

// Get all users (admin only)
router.get('/', requireRole(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { pharmaUnitId, role, isActive } = req.query;
    
    // Build filter conditions
    const whereClause: any = {};
    
    if (pharmaUnitId && typeof pharmaUnitId === 'string') {
      whereClause.pharmaUnitId = pharmaUnitId;
    }
    
    if (role && typeof role === 'string') {
      whereClause.role = role;
    }
    
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }
    
    // For admin users, only show users from their pharma unit
    if (req.user?.role === 'admin' && req.user?.pharmaUnitId) {
      whereClause.pharmaUnitId = req.user.pharmaUnitId;
    }
    
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        pharmaUnit: true,
        userPermissions: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Remove password hashes from response
    const safeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      pharmaUnitId: user.pharmaUnitId,
      pharmaUnitName: user.pharmaUnit?.name,
      linkedStakeholderId: user.linkedStakeholderId,
      linkedStakeholderType: user.linkedStakeholderType,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      permissions: user.userPermissions.map(p => ({
        module: p.module,
        actions: p.actions,
        scope: p.scope,
        conditions: p.conditions
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    res.json({ users: safeUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', requireSameUserOrAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        pharmaUnit: true,
        userPermissions: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // For admin users, only allow access to users from their pharma unit
    if (req.user?.role === 'admin' && req.user?.pharmaUnitId && user.pharmaUnitId !== req.user.pharmaUnitId) {
      return res.status(403).json({ error: 'Access denied to users from other pharma units' });
    }
    
    // Return user data (without password hash)
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        pharmaUnitId: user.pharmaUnitId,
        pharmaUnitName: user.pharmaUnit?.name,
        linkedStakeholderId: user.linkedStakeholderId,
        linkedStakeholderType: user.linkedStakeholderType,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        permissions: user.userPermissions.map(p => ({
          module: p.module,
          actions: p.actions,
          scope: p.scope,
          conditions: p.conditions
        })),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Check permissions
    const isOwnAccount = req.user?.id === id;
    const isAdmin = req.user && ['super_admin', 'admin'].includes(req.user.role);
    
    if (!isOwnAccount && !isAdmin) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const updateData = UpdateUserSchema.parse(req.body);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // For admin users, only allow updates to users from their pharma unit
    if (req.user?.role === 'admin' && req.user?.pharmaUnitId && existingUser.pharmaUnitId !== req.user.pharmaUnitId) {
      return res.status(403).json({ error: 'Access denied to users from other pharma units' });
    }
    
    // Non-admin users can only update certain fields on their own account
    if (!isAdmin && isOwnAccount) {
      const allowedFields = ['name', 'email', 'phone'];
      const restrictedFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));
      if (restrictedFields.length > 0) {
        return res.status(403).json({ 
          error: 'You can only update name, email, and phone on your own account',
          restrictedFields 
        });
      }
    }
    
    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: { 
          email: updateData.email,
          id: { not: id }
        }
      });
      if (emailExists) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        pharmaUnit: true,
        userPermissions: true
      }
    });
    
    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        pharmaUnitId: updatedUser.pharmaUnitId,
        pharmaUnitName: updatedUser.pharmaUnit?.name,
        linkedStakeholderId: updatedUser.linkedStakeholderId,
        linkedStakeholderType: updatedUser.linkedStakeholderType,
        isActive: updatedUser.isActive,
        lastLogin: updatedUser.lastLogin,
        permissions: updatedUser.userPermissions.map(p => ({
          module: p.module,
          actions: p.actions,
          scope: p.scope,
          conditions: p.conditions
        })),
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', requireRole(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // For admin users, only allow deletion of users from their pharma unit
    if (req.user?.role === 'admin' && req.user?.pharmaUnitId && existingUser.pharmaUnitId !== req.user.pharmaUnitId) {
      return res.status(403).json({ error: 'Access denied to users from other pharma units' });
    }
    
    // Check if user has created transactions (soft delete if they have)
    const transactionCount = await prisma.transaction.count({
      where: { createdBy: id }
    });
    
    if (transactionCount > 0) {
      // Soft delete - deactivate user instead of hard delete
      await prisma.user.update({
        where: { id },
        data: { isActive: false }
      });
      
      res.json({ 
        message: 'User deactivated successfully (user has transaction history)',
        deleted: false,
        deactivated: true
      });
    } else {
      // Hard delete - user has no transaction history
      await prisma.user.delete({ where: { id } });
      
      res.json({ 
        message: 'User deleted successfully',
        deleted: true,
        deactivated: false
      });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;