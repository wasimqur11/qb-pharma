import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, PharmaUnit, AuthState, UserRole, PermissionModule, PermissionAction } from '../types';
import { PermissionChecker, ROLE_TEMPLATES } from '../utils/permissions';

interface AuthContextType extends AuthState {
  // Authentication
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  
  // Permission checking
  hasPermission: (module: PermissionModule, action: PermissionAction, context?: any) => boolean;
  canAccessModule: (module: PermissionModule) => boolean;
  getModuleActions: (module: PermissionModule) => PermissionAction[];
  
  // User management
  switchPharmaUnit: (unitId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Utilities
  permissionChecker: PermissionChecker | null;
  isRole: (role: UserRole) => boolean;
  canManageUsers: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    currentPharmaUnit: null,
  });

  const [permissionChecker, setPermissionChecker] = useState<PermissionChecker | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Update permission checker when user changes
  useEffect(() => {
    if (authState.user) {
      const checker = new PermissionChecker(
        authState.user.permissions,
        authState.user.id,
        authState.user.pharmaUnitId,
        authState.user.linkedStakeholderId
      );
      setPermissionChecker(checker);
    } else {
      setPermissionChecker(null);
    }
  }, [authState.user]);

  const initializeAuth = async () => {
    try {
      // Check for stored session
      const storedUser = localStorage.getItem('qb_pharma_user');
      const storedUnit = localStorage.getItem('qb_pharma_current_unit');
      
      if (storedUser) {
        const user: User = JSON.parse(storedUser);
        const unit: PharmaUnit | null = storedUnit ? JSON.parse(storedUnit) : null;
        
        // Validate session (in real app, verify with backend)
        if (await validateSession(user)) {
          setAuthState({
            isAuthenticated: true,
            user,
            currentPharmaUnit: unit,
            isLoading: false,
          });
          return;
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
    
    setAuthState(prev => ({ ...prev, isLoading: false }));
  };

  const validateSession = async (user: User): Promise<boolean> => {
    // In real implementation, validate with backend
    // For now, just check if user exists and is active
    return user && user.isActive;
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Mock authentication - replace with actual API call
      const mockUsers: User[] = [
        {
          id: 'super_1',
          username: 'superadmin',
          role: 'super_admin',
          name: 'Super Administrator',
          email: 'super@qbpharma.com',
          permissions: ROLE_TEMPLATES.super_admin.defaultPermissions,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'admin_1',
          username: 'admin',
          role: 'admin',
          name: 'Unit Administrator',
          email: 'admin@qbpharma.com',
          pharmaUnitId: 'unit_1',
          pharmaUnitName: 'QB Pharma Main Unit',
          permissions: ROLE_TEMPLATES.admin.defaultPermissions,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'doctor_1',
          username: 'doctor1',
          role: 'doctor',
          name: 'Dr. John Smith',
          email: 'doctor1@qbpharma.com',
          pharmaUnitId: 'unit_1',
          pharmaUnitName: 'QB Pharma Main Unit',
          linkedStakeholderId: 'doc_1',
          linkedStakeholderType: 'doctor',
          permissions: ROLE_TEMPLATES.doctor.defaultPermissions,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'partner_1',
          username: 'partner1',
          role: 'partner',
          name: 'Business Partner 1',
          email: 'partner1@qbpharma.com',
          pharmaUnitId: 'unit_1',
          pharmaUnitName: 'QB Pharma Main Unit',
          linkedStakeholderId: 'partner_1',
          linkedStakeholderType: 'business_partner',
          permissions: ROLE_TEMPLATES.partner.defaultPermissions,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Simple password validation (use proper hashing in production)
      const mockPasswords: Record<string, string> = {
        'superadmin': 'super123',
        'admin': 'admin123',
        'doctor1': 'doctor123',
        'partner1': 'partner123',
      };

      const user = mockUsers.find(u => u.username === username);
      if (!user || mockPasswords[username] !== password) {
        return { success: false, error: 'Invalid credentials' };
      }

      if (!user.isActive) {
        return { success: false, error: 'Account is inactive' };
      }

      // Get current pharma unit
      let currentUnit: PharmaUnit | null = null;
      if (user.pharmaUnitId) {
        // Mock pharma unit - replace with actual API call
        currentUnit = {
          id: user.pharmaUnitId,
          name: user.pharmaUnitName || 'QB Pharma Unit',
          address: '123 Main Street',
          contactEmail: 'contact@qbpharma.com',
          contactPhone: '+1234567890',
          licenseNumber: 'PH123456',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      // Update last login
      user.lastLogin = new Date();

      // Store session
      localStorage.setItem('qb_pharma_user', JSON.stringify(user));
      if (currentUnit) {
        localStorage.setItem('qb_pharma_current_unit', JSON.stringify(currentUnit));
      }

      setAuthState({
        isAuthenticated: true,
        user,
        currentPharmaUnit: currentUnit,
        isLoading: false,
      });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('qb_pharma_user');
    localStorage.removeItem('qb_pharma_current_unit');
    setAuthState({
      isAuthenticated: false,
      user: null,
      currentPharmaUnit: null,
      isLoading: false,
    });
  };

  const hasPermission = (
    module: PermissionModule, 
    action: PermissionAction, 
    context?: any
  ): boolean => {
    if (!permissionChecker) return false;
    return permissionChecker.hasPermission(module, action, context);
  };

  const canAccessModule = (module: PermissionModule): boolean => {
    if (!permissionChecker) return false;
    return permissionChecker.canAccessModule(module);
  };

  const getModuleActions = (module: PermissionModule): PermissionAction[] => {
    if (!permissionChecker) return [];
    return permissionChecker.getModuleActions(module);
  };

  const switchPharmaUnit = async (unitId: string): Promise<void> => {
    if (!authState.user || authState.user.role !== 'super_admin') {
      throw new Error('Insufficient permissions');
    }
    
    // In real implementation, fetch unit details from backend
    // For now, just update local state
    console.log('Switching to unit:', unitId);
  };

  const refreshUser = async (): Promise<void> => {
    if (!authState.user) return;
    
    // In real implementation, refetch user data from backend
    // For now, just reload from localStorage
    await initializeAuth();
  };

  const isRole = (role: UserRole): boolean => {
    return authState.user?.role === role;
  };

  const canManageUsers = (): boolean => {
    if (!authState.user) return false;
    const template = ROLE_TEMPLATES[authState.user.role];
    return template.canCreateUsers;
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    hasPermission,
    canAccessModule,
    getModuleActions,
    switchPharmaUnit,
    refreshUser,
    permissionChecker,
    isRole,
    canManageUsers: canManageUsers(),
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for route protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredModule?: PermissionModule,
  requiredAction?: PermissionAction
) {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, isLoading, hasPermission } = useAuth();
    
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return <LoginComponent />;
    }
    
    if (requiredModule && requiredAction && !hasPermission(requiredModule, requiredAction)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}

// Simple login component
const LoginComponent: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const result = await login(username, password);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    setIsLoading(false);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            QB Pharma Login
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          <div className="text-sm text-gray-600">
            <p><strong>Demo Accounts:</strong></p>
            <p>Super Admin: superadmin / super123</p>
            <p>Unit Admin: admin / admin123</p>
            <p>Doctor: doctor1 / doctor123</p>
            <p>Partner: partner1 / partner123</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthProvider;