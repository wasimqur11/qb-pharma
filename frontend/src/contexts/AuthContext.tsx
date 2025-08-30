import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthState, UserRole } from '../types';

interface AuthContextType {
  // Auth state
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  
  // Auth operations
  login: (username: string, password: string) => Promise<boolean>;
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
  
  // Initialize with demo users for different roles
  const [users, setUsers] = useState<User[]>([
    {
      id: 'user-001',
      username: 'superadmin',
      role: 'super_admin',
      name: 'Super Administrator',
      email: 'super@qbpharma.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'user-002',
      username: 'admin',
      role: 'admin',
      name: 'Unit Administrator',
      email: 'admin@qbpharma.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'user-003',
      username: 'operator1',
      role: 'operator',
      name: 'Data Entry Operator',
      email: 'operator@qbpharma.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'user-004',
      username: 'doctor1',
      role: 'doctor',
      name: 'Dr. Ahmed Hassan',
      email: 'ahmed.hassan@qbpharma.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'user-005',
      username: 'wasim',
      role: 'partner',
      name: 'Wasim Qureshi',
      email: 'wasim.qureshi@qbpharma.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'user-006', 
      username: 'sarah',
      role: 'partner',
      name: 'Sarah Khan',
      email: 'sarah.khan@qbpharma.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'user-007',
      username: 'ali',
      role: 'partner', 
      name: 'Ali Ahmed',
      email: 'ali.ahmed@qbpharma.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'user-008',
      username: 'fatima',
      role: 'partner',
      name: 'Fatima Sheikh', 
      email: 'fatima.sheikh@qbpharma.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'user-009',
      username: 'karachi_med',
      role: 'distributor',
      name: 'Karachi Medical Store',
      email: 'info@karachimedical.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'user-010',
      username: 'lahore_pharma',
      role: 'distributor',
      name: 'Lahore Pharma Distributors',
      email: 'contact@lahorepharma.com', 
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  
  // User credentials storage (in production, this would be handled by backend)
  const [credentials] = useState<{ [username: string]: string }>({
    'superadmin': 'admin123',
    'admin': 'admin123', 
    'operator1': 'operator123',
    'doctor1': 'doctor123',
    'wasim': 'wasim123',
    'sarah': 'sarah123',
    'ali': 'ali123', 
    'fatima': 'fatima123',
    'karachi_med': 'karachi123',
    'lahore_pharma': 'lahore123'
  });

  // Stakeholder linking - maps user IDs to stakeholder IDs
  const [stakeholderLinks] = useState<{ [userId: string]: { stakeholderId: string; type: 'doctor' | 'business_partner' | 'distributor' } }>({
    'user-004': { stakeholderId: 'doc-001', type: 'doctor' },           // Dr. Ahmed Hassan
    'user-005': { stakeholderId: 'bp-001', type: 'business_partner' },   // Wasim Qureshi
    'user-006': { stakeholderId: 'bp-002', type: 'business_partner' },   // Sarah Khan
    'user-007': { stakeholderId: 'bp-003', type: 'business_partner' },   // Ali Ahmed
    'user-008': { stakeholderId: 'bp-004', type: 'business_partner' },   // Fatima Sheikh
    'user-009': { stakeholderId: 'dist-001', type: 'distributor' },      // Karachi Medical Store
    'user-010': { stakeholderId: 'dist-002', type: 'distributor' }       // Lahore Pharma Distributors
  });

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

  const login = async (username: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Import apiClient dynamically to avoid circular dependency
      const { default: apiClient } = await import('../utils/apiClient');
      
      // Call backend API
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
        
        return true;
      } else {
        console.error('Login failed:', response.error);
        
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false
        });
        
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Fallback to mock authentication for development
      const user = users.find(u => u.username === username && u.isActive);
      const isValidPassword = credentials[username] === password;
      
      if (user && isValidPassword) {
        const updatedUser = { ...user, lastLogin: new Date() };
        
        localStorage.setItem('qb_pharma_user', JSON.stringify(updatedUser));
        localStorage.setItem('qb_pharma_auth', 'true');
        
        setAuthState({
          isAuthenticated: true,
          user: updatedUser,
          isLoading: false
        });
        
        return true;
      }
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false
      });
      
      return false;
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

  const createUser = (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id 
        ? { ...user, ...updates, updatedAt: new Date() }
        : user
    ));
    
    // Update current user if it's the same
    if (authState.user?.id === id) {
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates, updatedAt: new Date() } : null
      }));
    }
  };

  const deleteUser = (id: string) => {
    // Prevent deleting superadmin
    if (id === 'user-001') {
      throw new Error('Cannot delete super administrator');
    }
    
    setUsers(prev => prev.filter(user => user.id !== id));
    
    // Logout if current user is being deleted
    if (authState.user?.id === id) {
      logout();
    }
  };

  const getAllUsers = (): User[] => {
    return users;
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
    if (!authState.user) return null;
    return stakeholderLinks[authState.user.id] || null;
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