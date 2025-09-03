import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import apiClient from '../utils/apiClient';
import { useAlert } from './AlertContext';

export type ConnectivityStatus = 'connected' | 'disconnected' | 'checking' | 'reconnecting';

interface ConnectivityContextType {
  status: ConnectivityStatus;
  isConnected: boolean;
  lastChecked: Date | null;
  checkConnectivity: () => Promise<boolean>;
  retryCount: number;
}

const ConnectivityContext = createContext<ConnectivityContextType | undefined>(undefined);

export const useConnectivity = () => {
  const context = useContext(ConnectivityContext);
  if (context === undefined) {
    throw new Error('useConnectivity must be used within a ConnectivityProvider');
  }
  return context;
};

interface ConnectivityProviderProps {
  children: ReactNode;
  checkInterval?: number; // in milliseconds, default 30 seconds
  maxRetries?: number; // max retry attempts, default 5
}

export const ConnectivityProvider: React.FC<ConnectivityProviderProps> = ({ 
  children, 
  checkInterval = 30000,
  maxRetries = 5
}) => {
  const [status, setStatus] = useState<ConnectivityStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [backoffMultiplier, setBackoffMultiplier] = useState(1);
  
  const { showError, showSuccess, showWarning } = useAlert();

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      setStatus('checking');
      const response = await apiClient.healthCheck();
      const isConnected = response.success;
      
      setLastChecked(new Date());
      
      if (isConnected) {
        // Reset retry count and backoff on successful connection
        if (status === 'disconnected' || status === 'reconnecting') {
          showSuccess(
            'Connection Restored', 
            'Successfully reconnected to the server.',
            { duration: 3000 }
          );
        }
        setStatus('connected');
        setRetryCount(0);
        setBackoffMultiplier(1);
        return true;
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      setLastChecked(new Date());
      
      if (status === 'connected') {
        // First time detecting disconnection
        showError(
          'Connection Lost',
          'Lost connection to the server. Attempting to reconnect...',
          null,
          { persistent: true }
        );
      }
      
      setStatus('disconnected');
      setRetryCount(prev => prev + 1);
      return false;
    }
  }, [status, showError, showSuccess]);

  const scheduleNextCheck = useCallback((immediate = false) => {
    if (intervalId) {
      clearTimeout(intervalId);
    }
    
    const delay = immediate ? 0 : Math.min(checkInterval * backoffMultiplier, 300000); // Max 5 minutes
    
    const newIntervalId = setTimeout(async () => {
      const isConnected = await checkConnectivity();
      
      if (!isConnected && retryCount < maxRetries) {
        setStatus('reconnecting');
        setBackoffMultiplier(prev => Math.min(prev * 1.5, 10)); // Exponential backoff, max 10x
        scheduleNextCheck();
      } else if (!isConnected && retryCount >= maxRetries) {
        showWarning(
          'Connection Issues',
          `Unable to reach the server after ${maxRetries} attempts. Will keep trying in the background.`,
          { persistent: true }
        );
        // Continue trying but with longer intervals
        scheduleNextCheck();
      } else {
        // Connected, schedule regular check
        scheduleNextCheck();
      }
    }, delay);
    
    setIntervalId(newIntervalId);
  }, [checkInterval, backoffMultiplier, retryCount, maxRetries, checkConnectivity, showWarning]);

  // Initial connectivity check and setup
  useEffect(() => {
    checkConnectivity().then(isConnected => {
      if (isConnected) {
        scheduleNextCheck();
      } else {
        setStatus('reconnecting');
        scheduleNextCheck();
      }
    });

    return () => {
      if (intervalId) {
        clearTimeout(intervalId);
      }
    };
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (status === 'disconnected' || status === 'reconnecting') {
        checkConnectivity();
      }
    };

    const handleOffline = () => {
      setStatus('disconnected');
      showWarning(
        'No Internet Connection',
        'Your device appears to be offline. Please check your internet connection.',
        { persistent: true }
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [status, checkConnectivity, showWarning]);

  // Manual retry function
  const manualCheck = useCallback(async () => {
    const isConnected = await checkConnectivity();
    if (!isConnected) {
      setStatus('reconnecting');
      scheduleNextCheck(true); // Immediate retry
    }
    return isConnected;
  }, [checkConnectivity, scheduleNextCheck]);

  const contextValue: ConnectivityContextType = {
    status,
    isConnected: status === 'connected',
    lastChecked,
    checkConnectivity: manualCheck,
    retryCount
  };

  return (
    <ConnectivityContext.Provider value={contextValue}>
      {children}
    </ConnectivityContext.Provider>
  );
};

export default ConnectivityContext;