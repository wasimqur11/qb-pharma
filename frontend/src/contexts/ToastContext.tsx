import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ToastContainer, ToastData } from '../components/Toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    console.error('useToast must be used within a ToastProvider');
    // Return dummy functions to prevent crashes
    return {
      showToast: () => {},
      showSuccess: () => {},
      showError: () => {},
      showWarning: () => {},
      showInfo: () => {},
      removeToast: () => {},
      clearAllToasts: () => {}
    };
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  
  console.log('ToastProvider rendered, toasts count:', toasts.length);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const showToast = useCallback((toastData: Omit<ToastData, 'id'>) => {
    const id = generateId();
    const newToast: ToastData = {
      ...toastData,
      id,
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast({
      type: 'success',
      title,
      message,
      duration: 4000
    });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    showToast({
      type: 'error',
      title,
      message,
      duration: 6000
    });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    showToast({
      type: 'warning',
      title,
      message,
      duration: 5000
    });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast({
      type: 'info',
      title,
      message,
      duration: 4000
    });
  }, [showToast]);

  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;