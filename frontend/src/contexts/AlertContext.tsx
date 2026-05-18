import React, { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { AlertSystem, useAlerts, type AlertMessage } from '../components/AlertSystem';

interface AlertContextType {
  // Alert management
  addAlert: (alert: Omit<AlertMessage, 'id'>) => string;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
  
  // Helper functions for common alert types
  showSuccess: (title: string, message: string, options?: Partial<AlertMessage>) => string;
  showError: (title: string, message: string, details?: any, options?: Partial<AlertMessage>) => string;
  showWarning: (title: string, message: string, options?: Partial<AlertMessage>) => string;
  showInfo: (title: string, message: string, options?: Partial<AlertMessage>) => string;
  
  // API error handler
  handleApiError: (operation: string, error: any, context?: string) => string;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxAlerts?: number;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ 
  children, 
  position = 'top-right',
  maxAlerts = 5 
}) => {
  const alertManager = useAlerts();

  const contextValue = useMemo((): AlertContextType => ({
    addAlert: alertManager.addAlert,
    removeAlert: alertManager.removeAlert,
    clearAlerts: alertManager.clearAlerts,
    showSuccess: alertManager.showSuccess,
    showError: alertManager.showError,
    showWarning: alertManager.showWarning,
    showInfo: alertManager.showInfo,
    handleApiError: alertManager.handleApiError
  }), [alertManager]);

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      <AlertSystem
        alerts={alertManager.alerts}
        onDismiss={alertManager.removeAlert}
        position={position}
        maxAlerts={maxAlerts}
      />
    </AlertContext.Provider>
  );
};

export default AlertContext;