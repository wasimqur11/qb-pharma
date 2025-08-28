import type { 
  UserRole, 
  UserPermission, 
  RoleTemplate, 
  PermissionModule, 
  PermissionAction, 
  PermissionScope 
} from '../types';

// Role Templates with Default Permissions
export const ROLE_TEMPLATES: Record<UserRole, RoleTemplate> = {
  super_admin: {
    role: 'super_admin',
    displayName: 'Super Administrator',
    description: 'System-wide access, can create pharma units',
    requiresLinking: false,
    canCreateUsers: true,
    sessionTimeout: 480, // 8 hours
    defaultPermissions: [
      { module: 'pharma_units', actions: ['create', 'read', 'update', 'delete'], scope: 'all' },
      { module: 'users', actions: ['create', 'read', 'update', 'delete'], scope: 'all' },
      { module: 'system_settings', actions: ['read', 'update'], scope: 'all' },
      { module: 'reports', actions: ['read', 'export'], scope: 'all' },
      { module: 'dashboard', actions: ['read'], scope: 'all' },
      { module: 'transactions', actions: ['create', 'read', 'update', 'delete', 'approve'], scope: 'all' },
      { module: 'stakeholders', actions: ['create', 'read', 'update', 'delete'], scope: 'all' },
      { module: 'settlements', actions: ['create', 'read', 'update', 'delete', 'approve'], scope: 'all' },
    ]
  },
  
  admin: {
    role: 'admin',
    displayName: 'Unit Administrator', 
    description: 'Full access within pharma unit, can manage users',
    requiresLinking: false,
    canCreateUsers: true,
    sessionTimeout: 360, // 6 hours
    defaultPermissions: [
      { module: 'users', actions: ['create', 'read', 'update', 'delete'], scope: 'unit' },
      { module: 'transactions', actions: ['create', 'read', 'update', 'delete', 'approve'], scope: 'unit' },
      { module: 'stakeholders', actions: ['create', 'read', 'update', 'delete'], scope: 'unit' },
      { module: 'reports', actions: ['read', 'export'], scope: 'unit' },
      { module: 'settlements', actions: ['create', 'read', 'update', 'approve'], scope: 'unit' },
      { module: 'dashboard', actions: ['read'], scope: 'unit' },
    ]
  },

  manager: {
    role: 'manager',
    displayName: 'Department Manager',
    description: 'Manage specific departments and view reports',
    requiresLinking: false,
    canCreateUsers: true,
    sessionTimeout: 300, // 5 hours
    defaultPermissions: [
      { module: 'users', actions: ['create', 'read', 'update'], scope: 'department' },
      { module: 'transactions', actions: ['create', 'read', 'update', 'approve'], scope: 'department' },
      { module: 'stakeholders', actions: ['read', 'update'], scope: 'unit' },
      { module: 'reports', actions: ['read', 'export'], scope: 'department' },
      { module: 'dashboard', actions: ['read'], scope: 'department' },
    ]
  },

  operator: {
    role: 'operator',
    displayName: 'Data Entry Operator',
    description: 'Data entry and basic reporting access',
    requiresLinking: false,
    canCreateUsers: false,
    sessionTimeout: 240, // 4 hours
    defaultPermissions: [
      { module: 'transactions', actions: ['create', 'read', 'update'], scope: 'unit' },
      { module: 'stakeholders', actions: ['create', 'read', 'update'], scope: 'unit' },
      { module: 'reports', actions: ['read'], scope: 'unit' },
      { module: 'dashboard', actions: ['read'], scope: 'unit' },
    ]
  },

  doctor: {
    role: 'doctor',
    displayName: 'Doctor',
    description: 'Access to own consultation reports and commission statements',
    requiresLinking: true,
    canCreateUsers: false,
    sessionTimeout: 180, // 3 hours
    defaultPermissions: [
      { 
        module: 'transactions', 
        actions: ['read'], 
        scope: 'own',
        conditions: { stakeholder_type: 'doctor' }
      },
      { 
        module: 'reports', 
        actions: ['read', 'export'], 
        scope: 'own',
        conditions: { stakeholder_type: 'doctor' }
      },
      { module: 'dashboard', actions: ['read'], scope: 'own' },
    ]
  },

  partner: {
    role: 'partner',
    displayName: 'Business Partner',
    description: 'Access to own profit share and settlement reports',
    requiresLinking: true,
    canCreateUsers: false,
    sessionTimeout: 180, // 3 hours
    defaultPermissions: [
      { 
        module: 'transactions', 
        actions: ['read'], 
        scope: 'own',
        conditions: { stakeholder_type: 'business_partner' }
      },
      { 
        module: 'reports', 
        actions: ['read', 'export'], 
        scope: 'own',
        conditions: { stakeholder_type: 'business_partner' }
      },
      { 
        module: 'settlements', 
        actions: ['read'], 
        scope: 'own'
      },
      { module: 'dashboard', actions: ['read'], scope: 'own' },
    ]
  },

  distributor: {
    role: 'distributor',
    displayName: 'Distributor',
    description: 'Access to own transaction history and credit status',
    requiresLinking: true,
    canCreateUsers: false,
    sessionTimeout: 180, // 3 hours
    defaultPermissions: [
      { 
        module: 'transactions', 
        actions: ['read'], 
        scope: 'own',
        conditions: { stakeholder_type: 'distributor' }
      },
      { 
        module: 'reports', 
        actions: ['read', 'export'], 
        scope: 'own',
        conditions: { stakeholder_type: 'distributor' }
      },
      { module: 'dashboard', actions: ['read'], scope: 'own' },
    ]
  }
};

// Permission Checking Utilities
export class PermissionChecker {
  private userPermissions: UserPermission[];
  private userId: string;
  private pharmaUnitId?: string;
  private linkedStakeholderId?: string;

  constructor(
    permissions: UserPermission[], 
    userId: string, 
    pharmaUnitId?: string,
    linkedStakeholderId?: string
  ) {
    this.userPermissions = permissions;
    this.userId = userId;
    this.pharmaUnitId = pharmaUnitId;
    this.linkedStakeholderId = linkedStakeholderId;
  }

  hasPermission(
    module: PermissionModule, 
    action: PermissionAction, 
    context?: {
      targetUserId?: string;
      targetPharmaUnitId?: string;
      targetStakeholderId?: string;
      stakeholderType?: string;
    }
  ): boolean {
    const modulePermissions = this.userPermissions.filter(p => p.module === module);
    
    for (const permission of modulePermissions) {
      // Check if action is allowed
      if (!permission.actions.includes(action)) continue;
      
      // Check scope
      if (!this.checkScope(permission.scope, context)) continue;
      
      // Check additional conditions
      if (!this.checkConditions(permission.conditions, context)) continue;
      
      return true;
    }
    
    return false;
  }

  private checkScope(
    scope: PermissionScope, 
    context?: {
      targetUserId?: string;
      targetPharmaUnitId?: string;
      targetStakeholderId?: string;
    }
  ): boolean {
    switch (scope) {
      case 'all':
        return true;
        
      case 'unit':
        return !context?.targetPharmaUnitId || 
               context.targetPharmaUnitId === this.pharmaUnitId;
        
      case 'own':
        if (context?.targetUserId) {
          return context.targetUserId === this.userId;
        }
        if (context?.targetStakeholderId) {
          return context.targetStakeholderId === this.linkedStakeholderId;
        }
        return true;
        
      case 'department':
        // TODO: Implement department-based checking
        return true;
        
      case 'none':
        return false;
        
      default:
        return false;
    }
  }

  private checkConditions(
    conditions?: Record<string, any>, 
    context?: { stakeholderType?: string }
  ): boolean {
    if (!conditions) return true;
    
    // Check stakeholder type condition
    if (conditions.stakeholder_type && context?.stakeholderType) {
      return conditions.stakeholder_type === context.stakeholderType;
    }
    
    return true;
  }

  canAccessModule(module: PermissionModule): boolean {
    return this.userPermissions.some(p => p.module === module);
  }

  getModuleActions(module: PermissionModule): PermissionAction[] {
    const modulePermissions = this.userPermissions.filter(p => p.module === module);
    const actions = new Set<PermissionAction>();
    
    modulePermissions.forEach(p => {
      p.actions.forEach(action => actions.add(action));
    });
    
    return Array.from(actions);
  }
}

// Helper Functions
export function createUserWithRole(role: UserRole, pharmaUnitId?: string): Partial<UserPermission[]> {
  const template = ROLE_TEMPLATES[role];
  return template.defaultPermissions;
}

export function canUserManageRole(userRole: UserRole, targetRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    super_admin: 7,
    admin: 6, 
    manager: 5,
    operator: 4,
    doctor: 3,
    partner: 2,
    distributor: 1
  };
  
  return hierarchy[userRole] > hierarchy[targetRole];
}

export function getAvailableRoles(userRole: UserRole): UserRole[] {
  switch (userRole) {
    case 'super_admin':
      return ['admin', 'manager', 'operator', 'doctor', 'partner', 'distributor'];
    case 'admin':
      return ['manager', 'operator', 'doctor', 'partner', 'distributor'];
    case 'manager':
      return ['operator'];
    default:
      return [];
  }
}

export function isStakeholderRole(role: UserRole): boolean {
  return ['doctor', 'partner', 'distributor'].includes(role);
}