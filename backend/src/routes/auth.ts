import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

const RegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  role: z.enum(['super_admin', 'admin', 'manager', 'operator', 'doctor', 'partner', 'distributor']),
  pharmaUnitId: z.string().optional(),
  linkedStakeholderId: z.string().optional(),
  linkedStakeholderType: z.enum(['doctor', 'business_partner', 'employee', 'distributor', 'patient']).optional()
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

// Generate JWT token
const generateToken = (userId: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }
  
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = LoginSchema.parse(req.body);

    // Find user with permissions
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        userPermissions: true,
        pharmaUnit: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate token
    const token = generateToken(user.id);

    // Return user data (without password hash)
    res.json({
      message: 'Login successful',
      token,
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
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register endpoint (admin only)
router.post('/register', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !['super_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userData = RegisterSchema.parse(req.body);

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: userData.username },
          { email: userData.email }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: existingUser.username === userData.username 
          ? 'Username already exists' 
          : 'Email already exists' 
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        passwordHash,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        pharmaUnitId: userData.pharmaUnitId,
        linkedStakeholderId: userData.linkedStakeholderId,
        linkedStakeholderType: userData.linkedStakeholderType,
        createdBy: req.user.id
      },
      include: {
        pharmaUnit: true
      }
    });

    // TODO: Create default permissions based on role
    // This would involve implementing the role templates from frontend

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
        pharmaUnitId: newUser.pharmaUnitId,
        pharmaUnitName: newUser.pharmaUnit?.name,
        linkedStakeholderId: newUser.linkedStakeholderId,
        linkedStakeholderType: newUser.linkedStakeholderType,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        userPermissions: true,
        pharmaUnit: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

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
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { currentPassword, newPassword } = ChangePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidCurrentPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Logout (client-side token removal, but we can log it)
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // In a more advanced implementation, you might want to blacklist the token
    // For now, just log the logout
    console.log(`User ${req.user?.username} logged out at ${new Date().toISOString()}`);
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;