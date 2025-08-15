import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
  
  // Initialize with superadmin user
  const [users, setUsers] = useState<User[]>([
    {
      id: 'user-001',
      username: 'superadmin',
      role: 'super_admin',
      name: 'Super Administrator',
      email: 'admin@qbpharma.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  
  // User credentials storage (in production, this would be handled by backend)
  const [credentials] = useState<{ [username: string]: string }>({
    'superadmin': 'admin123' // Default password for superadmin
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
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check credentials
    const user = users.find(u => u.username === username && u.isActive);
    const isValidPassword = credentials[username] === password;
    
    if (user && isValidPassword) {
      const updatedUser = { ...user, lastLogin: new Date() };
      
      // Save to localStorage for persistence
      localStorage.setItem('qb_pharma_user', JSON.stringify(updatedUser));
      localStorage.setItem('qb_pharma_auth', 'true');
      
      setAuthState({
        isAuthenticated: true,
        user: updatedUser,
        isLoading: false
      });
      
      return true;
    } else {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false
      });
      
      return false;
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('qb_pharma_user');
    localStorage.removeItem('qb_pharma_auth');
    
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
    hasPermission
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};