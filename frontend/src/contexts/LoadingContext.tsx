import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useTransactions } from './TransactionContext';
import { useStakeholders } from './StakeholderContext';

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  setCustomLoading: (loading: boolean, message?: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [customLoading, setCustomLoading] = useState(false);
  const [customMessage, setCustomMessage] = useState('Loading...');
  
  // Get loading states from various contexts
  const { user, isLoading: authLoading } = useAuth();
  const { isLoading: transactionsLoading } = useTransactions();
  const { isLoading: stakeholdersLoading } = useStakeholders();

  // Determine overall loading state and message
  const isLoading = customLoading || authLoading || transactionsLoading || stakeholdersLoading;
  
  const getLoadingMessage = (): string => {
    if (customLoading) return customMessage;
    if (authLoading) return "Authenticating...";
    if (transactionsLoading) return "Loading transactions...";
    if (stakeholdersLoading) return "Loading stakeholders...";
    return "Loading QB Pharma...";
  };

  const setCustomLoadingState = (loading: boolean, message = 'Loading...') => {
    setCustomLoading(loading);
    setCustomMessage(message);
  };

  const contextValue: LoadingContextType = {
    isLoading,
    loadingMessage: getLoadingMessage(),
    setCustomLoading: setCustomLoadingState
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
};