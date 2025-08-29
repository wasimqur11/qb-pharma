import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    pharmaUnitId?: string;
    linkedStakeholderId?: string;
    linkedStakeholderType?: string;
    permissions: Array<{
      module: string;
      actions: string[];
      scope: string;
      conditions?: any;
    }>;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    // Fetch user with permissions from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userPermissions: true,
        pharmaUnit: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      pharmaUnitId: user.pharmaUnitId || undefined,
      linkedStakeholderId: user.linkedStakeholderId || undefined,
      linkedStakeholderType: user.linkedStakeholderType || undefined,
      permissions: user.userPermissions.map(p => ({
        module: p.module,
        actions: p.actions,
        scope: p.scope,
        conditions: p.conditions || undefined
      }))
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (requiredRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredRoles,
        current: req.user.role
      });
    }

    next();
  };
};

export const requirePermission = (module: string, action: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasPermission = req.user.permissions.some(permission => 
      permission.module === module && permission.actions.includes(action)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: { module, action },
        userPermissions: req.user.permissions
      });
    }

    next();
  };
};

export const requireSameUserOrAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const targetUserId = req.params.userId || req.params.id;
  
  if (req.user.id === targetUserId || ['super_admin', 'admin'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ error: 'Can only access your own data or admin required' });
  }
};

export const requireSameStakeholderOrAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const targetStakeholderId = req.params.stakeholderId || req.params.id;
  
  if (req.user.linkedStakeholderId === targetStakeholderId || ['super_admin', 'admin', 'operator'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ error: 'Can only access your own stakeholder data or admin required' });
  }
};