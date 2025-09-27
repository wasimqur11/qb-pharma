import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthState, UserRole } from '../types';

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  // Auth state
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;

  // Auth operations
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  
  // User management
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getAllUsers: () => User[];
  
  // Permissions
  hasPermission: (requiredRole: UserRole) => boolean;
  
  // Stakeholder linking
  getCurrentUserStakeholder: () => { stakeholderId: string; type: 'doctor' | 'business_partner' | 'distributor' } | null;
  isStakeholderUser: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true
  });
  
  // Users are now managed by backend - no local state needed
  const [users, setUsers] = useState<User[]>([]);
  
  // Credentials are now handled by backend authentication

  // Stakeholder linking is now handled by backend (user.linkedStakeholderId)

  // Check for existing session on app load
  useEffect(() => {
    const checkExistingSession = () => {
      const savedUser = localStorage.getItem('qb_pharma_user');
      const savedAuth = localStorage.getItem('qb_pharma_auth');
      
      if (savedUser && savedAuth === 'true') {
        try {
          const user: User = JSON.parse(savedUser);
          setAuthState({
            isAuthenticated: true,
            user: { ...user, lastLogin: new Date() },
            isLoading: false
          });
        } catch (error) {
          // Clear corrupted data
          localStorage.removeItem('qb_pharma_user');
          localStorage.removeItem('qb_pharma_auth');
          setAuthState({ isAuthenticated: false, user: null, isLoading: false });
        }
      } else {
        setAuthState({ isAuthenticated: false, user: null, isLoading: false });
      }
    };

    checkExistingSession();
  }, []);

  const login = async (username: string, password: string): Promise<LoginResult> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Import apiClient dynamically to avoid circular dependency
      const { default: apiClient } = await import('../utils/apiClient');

      // Call backend API for authentication
      const response = await apiClient.login({ username, password });

      if (response.success && response.data) {
        const { user, token } = response.data;

        // Save to localStorage for persistence
        localStorage.setItem('qb_pharma_user', JSON.stringify(user));
        localStorage.setItem('qb_pharma_auth', 'true');
        localStorage.setItem('qb_pharma_token', token);

        setAuthState({
          isAuthenticated: true,
          user: { ...user, lastLogin: new Date() },
          isLoading: false
        });

        return { success: true };
      } else {
        console.error('Login failed:', response.error);

        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false
        });

        // Return specific error message from backend
        return {
          success: false,
          error: response.error || 'Login failed. Please try again.'
        };
      }
    } catch (error) {
      console.error('Login error:', error);

      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false
      });

      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  };

  const logout = () => {
    // Clear localStorage and API client token
    localStorage.removeItem('qb_pharma_user');
    localStorage.removeItem('qb_pharma_auth');
    localStorage.removeItem('qb_pharma_token');
    
    // Clear API client token
    import('../utils/apiClient').then(({ default: apiClient }) => {
      apiClient.clearToken();
    });
    
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false
    });
  };

  // User management functions - should be implemented to use backend API
  const createUser = (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>): User => {
    throw new Error('User creation should be handled by backend API');
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    throw new Error('User updates should be handled by backend API');
  };

  const deleteUser = (id: string) => {
    throw new Error('User deletion should be handled by backend API');
  };

  const getAllUsers = (): User[] => {
    // Return empty array - users should be fetched from backend when needed
    return [];
  };

  // Role hierarchy for permissions
  const roleHierarchy: { [key in UserRole]: number } = {
    'user': 1,
    'manager': 2,
    'admin': 3,
    'super_admin': 4
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!authState.user) return false;
    return roleHierarchy[authState.user.role] >= roleHierarchy[requiredRole];
  };

  // Get current user's linked stakeholder information
  const getCurrentUserStakeholder = () => {
    if (!authState.user || !authState.user.linkedStakeholderId) return null;
    return {
      stakeholderId: authState.user.linkedStakeholderId,
      type: authState.user.linkedStakeholderType as 'doctor' | 'business_partner' | 'distributor'
    };
  };

  // Check if current user is a stakeholder-linked user
  const isStakeholderUser = (): boolean => {
    if (!authState.user) return false;
    return ['doctor', 'partner', 'distributor'].includes(authState.user.role);
  };


  const contextValue: AuthContextType = {
    // Auth state
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    isLoading: authState.isLoading,
    
    // Auth operations
    login,
    logout,
    
    // User management
    createUser,
    updateUser,
    deleteUser,
    getAllUsers,
    
    // Permissions
    hasPermission,
    
    // Stakeholder linking
    getCurrentUserStakeholder,
    isStakeholderUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};