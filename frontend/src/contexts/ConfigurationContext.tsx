import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Department, SystemConfiguration, ConfigurationState } from '../types';

interface ConfigurationContextType {
  departments: Department[];
  activeDepartments: Department[];
  addDepartment: (department: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  toggleDepartmentStatus: (id: string) => void;
  getDepartmentById: (id: string) => Department | undefined;
  isLoading: boolean;
  lastUpdated: Date | null;
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

export const ConfigurationProvider: React.FC<ConfigurationProviderProps> = ({ children }) => {
  const [state, setState] = useState<ConfigurationState>({
    departments: [
      {
        id: '1',
        name: 'Pharmacy',
        description: 'Main pharmacy operations and medicine dispensing',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Reception',
        description: 'Front desk and customer service',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        name: 'Assistant',
        description: 'General assistance and support',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '4',
        name: 'Accounts',
        description: 'Financial management and bookkeeping',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '5',
        name: 'Cleaning',
        description: 'Maintenance and cleaning services',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '6',
        name: 'Security',
        description: 'Security and safety management',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    isLoading: false,
    lastUpdated: new Date()
  });

  const activeDepartments = state.departments.filter(dept => dept.isActive);

  const addDepartment = (departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDepartment: Department = {
      ...departmentData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setState(prev => ({
      ...prev,
      departments: [...prev.departments, newDepartment],
      lastUpdated: new Date()
    }));
  };

  const updateDepartment = (id: string, updates: Partial<Department>) => {
    setState(prev => ({
      ...prev,
      departments: prev.departments.map(dept =>
        dept.id === id
          ? { ...dept, ...updates, updatedAt: new Date() }
          : dept
      ),
      lastUpdated: new Date()
    }));
  };

  const deleteDepartment = (id: string) => {
    setState(prev => ({
      ...prev,
      departments: prev.departments.filter(dept => dept.id !== id),
      lastUpdated: new Date()
    }));
  };

  const toggleDepartmentStatus = (id: string) => {
    setState(prev => ({
      ...prev,
      departments: prev.departments.map(dept =>
        dept.id === id
          ? { ...dept, isActive: !dept.isActive, updatedAt: new Date() }
          : dept
      ),
      lastUpdated: new Date()
    }));
  };

  const getDepartmentById = (id: string) => {
    return state.departments.find(dept => dept.id === id);
  };

  const contextValue: ConfigurationContextType = {
    departments: state.departments,
    activeDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    toggleDepartmentStatus,
    getDepartmentById,
    isLoading: state.isLoading,
    lastUpdated: state.lastUpdated
  };

  return (
    <ConfigurationContext.Provider value={contextValue}>
      {children}
    </ConfigurationContext.Provider>
  );
};