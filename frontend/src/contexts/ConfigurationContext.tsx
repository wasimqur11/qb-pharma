import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Department, SystemConfiguration, ConfigurationState, TransactionCategory } from '../types';
import apiClient from '../utils/apiClient';
import { useAuth } from './AuthContext';

// Transaction shortcut configuration - exported at bottom of file
interface TransactionShortcut {
  id: string;
  shortcut: string; // e.g., "Ctrl+1", "Ctrl+Shift+S"
  category: TransactionCategory;
  label: string; // Display label for the shortcut
}

// Default shortcuts
const DEFAULT_SHORTCUTS: TransactionShortcut[] = [
  { id: '1', shortcut: 'Ctrl+1', category: 'pharmacy_sale', label: 'Pharmacy Sale' },
  { id: '2', shortcut: 'Ctrl+2', category: 'consultation_fee', label: 'Consultation Fee' },
  { id: '3', shortcut: 'Ctrl+3', category: 'distributor_payment', label: 'Distributor Payment' },
];

const SHORTCUTS_STORAGE_KEY = 'qb-pharma-transaction-shortcuts';

interface ConfigurationContextType {
  departments: Department[];
  activeDepartments: Department[];
  addDepartment: (department: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  toggleDepartmentStatus: (id: string) => Promise<void>;
  getDepartmentById: (id: string) => Department | undefined;
  isLoading: boolean;
  lastUpdated: Date | null;
  // Transaction shortcuts
  transactionShortcuts: TransactionShortcut[];
  addTransactionShortcut: (shortcut: Omit<TransactionShortcut, 'id'>) => boolean;
  updateTransactionShortcut: (id: string, updates: Partial<TransactionShortcut>) => boolean;
  removeTransactionShortcut: (id: string) => void;
  getShortcutByKeys: (shortcut: string) => TransactionShortcut | undefined;
  resetShortcutsToDefault: () => void;
}

const ConfigurationContext = createContext<ConfigurationContextType | undefined>(undefined);

export const useConfiguration = () => {
  const context = useContext(ConfigurationContext);
  if (context === undefined) {
    throw new Error('useConfiguration must be used within a ConfigurationProvider');
  }
  return context;
};

interface ConfigurationProviderProps {
  children: ReactNode;
}

// Defaults seeded into the DB if the departments table is empty on first load
const DEFAULT_DEPARTMENTS: Array<{ name: string; description: string }> = [
  { name: 'Pharmacy',   description: 'Main pharmacy operations and medicine dispensing' },
  { name: 'Reception',  description: 'Front desk and customer service' },
  { name: 'Assistant',  description: 'General assistance and support' },
  { name: 'Accounts',   description: 'Financial management and bookkeeping' },
  { name: 'Cleaning',   description: 'Maintenance and cleaning services' },
  { name: 'Security',   description: 'Security and safety management' },
];

const parseDepartment = (raw: any): Department => ({
  ...raw,
  createdAt: new Date(raw.createdAt),
  updatedAt: new Date(raw.updatedAt)
});

export const ConfigurationProvider: React.FC<ConfigurationProviderProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // ── Shortcuts (still stored in localStorage — user-specific, not shared data) ──

  const [transactionShortcuts, setTransactionShortcuts] = useState<TransactionShortcut[]>(() => {
    const stored = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { return DEFAULT_SHORTCUTS; }
    }
    return DEFAULT_SHORTCUTS;
  });

  useEffect(() => {
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(transactionShortcuts));
  }, [transactionShortcuts]);

  const addTransactionShortcut = (shortcut: Omit<TransactionShortcut, 'id'>): boolean => {
    if (transactionShortcuts.some(s => s.shortcut.toLowerCase() === shortcut.shortcut.toLowerCase())) return false;
    setTransactionShortcuts(prev => [...prev, { ...shortcut, id: Date.now().toString() }]);
    return true;
  };

  const updateTransactionShortcut = (id: string, updates: Partial<TransactionShortcut>): boolean => {
    if (updates.shortcut) {
      const conflict = transactionShortcuts.some(
        s => s.id !== id && s.shortcut.toLowerCase() === updates.shortcut!.toLowerCase()
      );
      if (conflict) return false;
    }
    setTransactionShortcuts(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    return true;
  };

  const removeTransactionShortcut = (id: string): void => {
    setTransactionShortcuts(prev => prev.filter(s => s.id !== id));
  };

  const getShortcutByKeys = (shortcut: string): TransactionShortcut | undefined =>
    transactionShortcuts.find(s => s.shortcut.toLowerCase() === shortcut.toLowerCase());

  const resetShortcutsToDefault = (): void => setTransactionShortcuts(DEFAULT_SHORTCUTS);

  // ── Departments (persisted in the database via /api/departments) ──

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDepartments = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getDepartments();
      if (response.success) {
        const depts: Department[] = ((response.data as any)?.departments ?? []).map(parseDepartment);

        // One-time seed: if the table is empty (fresh install), create the defaults
        if (depts.length === 0) {
          const seedResponse = await apiClient.batchCreateDepartments(DEFAULT_DEPARTMENTS);
          if (seedResponse.success) {
            const seeded: Department[] = ((seedResponse.data as any)?.departments ?? []).map(parseDepartment);
            setDepartments(seeded);
          }
        } else {
          setDepartments(depts);
        }

        setLastUpdated(new Date());
      } else {
        console.error('Failed to load departments:', response.error);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadDepartments();
    }
  }, [isAuthenticated, authLoading]);

  const activeDepartments = departments.filter(dept => dept.isActive);

  const addDepartment = async (data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await apiClient.createDepartment(data);
    if (response.success) {
      const created = parseDepartment((response.data as any).department);
      setDepartments(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setLastUpdated(new Date());
    } else {
      throw new Error((response.error as string) || 'Failed to create department');
    }
  };

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    const response = await apiClient.updateDepartment(id, updates);
    if (response.success) {
      const updated = parseDepartment((response.data as any).department);
      setDepartments(prev => prev.map(d => (d.id === id ? updated : d)));
      setLastUpdated(new Date());
    } else {
      throw new Error((response.error as string) || 'Failed to update department');
    }
  };

  const deleteDepartment = async (id: string) => {
    const response = await apiClient.deleteDepartment(id);
    if (response.success) {
      setDepartments(prev => prev.filter(d => d.id !== id));
      setLastUpdated(new Date());
    } else {
      throw new Error((response.error as string) || 'Failed to delete department');
    }
  };

  const toggleDepartmentStatus = async (id: string) => {
    const dept = departments.find(d => d.id === id);
    if (!dept) return;
    await updateDepartment(id, { isActive: !dept.isActive });
  };

  const getDepartmentById = (id: string) => departments.find(d => d.id === id);

  const contextValue: ConfigurationContextType = {
    departments,
    activeDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    toggleDepartmentStatus,
    getDepartmentById,
    isLoading,
    lastUpdated,
    // Transaction shortcuts
    transactionShortcuts,
    addTransactionShortcut,
    updateTransactionShortcut,
    removeTransactionShortcut,
    getShortcutByKeys,
    resetShortcutsToDefault
  };

  return (
    <ConfigurationContext.Provider value={contextValue}>
      {children}
    </ConfigurationContext.Provider>
  );
};

export type { TransactionShortcut };