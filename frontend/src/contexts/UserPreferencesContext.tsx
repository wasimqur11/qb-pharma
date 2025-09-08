import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface UserPreferences {
  // Personal Information
  email: string;
  phone?: string;
  
  // Interface Preferences
  defaultDashboardTab: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  defaultPeriod: '7days' | '30days' | '90days' | '1year';
  
  // Business Preferences  
  defaultStakeholderFilter: 'all' | 'active' | 'inactive';
  exportFormat: 'csv' | 'excel' | 'pdf';
  
  // Notification Settings
  emailNotifications: boolean;
  systemNotifications: boolean;
  paymentAlerts: boolean;
  highActivityAlerts: boolean;
  notificationFrequency: 'immediate' | 'daily' | 'weekly';
  
  // Regional Settings
  language: 'en' | 'ur' | 'hi';
  timezone: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  
  // Dashboard Widget Preferences
  showRevenueCard: boolean;
  showPharmacyCard: boolean;
  showDoctorCard: boolean;
  showProfitCard: boolean;
  showChartsSection: boolean;
  showNotificationsPanel: boolean;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<boolean>;
  resetToDefaults: () => void;
  isLoading: boolean;
}

const defaultPreferences: UserPreferences = {
  email: '',
  phone: '',
  defaultDashboardTab: 'dashboard',
  dateFormat: 'DD/MM/YYYY',
  defaultPeriod: '30days',
  defaultStakeholderFilter: 'all',
  exportFormat: 'excel',
  emailNotifications: true,
  systemNotifications: true,
  paymentAlerts: true,
  highActivityAlerts: true,
  notificationFrequency: 'immediate',
  language: 'en',
  timezone: 'Asia/Karachi',
  workingHoursStart: '09:00',
  workingHoursEnd: '17:00',
  showRevenueCard: true,
  showPharmacyCard: true,
  showDoctorCard: true,
  showProfitCard: true,
  showChartsSection: true,
  showNotificationsPanel: true,
};

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};

interface UserPreferencesProviderProps {
  children: ReactNode;
}

export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('qb-pharma-user-preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  const saveToLocalStorage = useCallback((prefs: UserPreferences) => {
    try {
      localStorage.setItem('qb-pharma-user-preferences', JSON.stringify(prefs));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  }, []);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);
      saveToLocalStorage(newPreferences);
      
      // TODO: In a real app, you'd also save to backend API here
      // await apiClient.updateUserPreferences(updates);
      
      return true;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [preferences, saveToLocalStorage]);

  const resetToDefaults = useCallback(() => {
    setPreferences(defaultPreferences);
    saveToLocalStorage(defaultPreferences);
  }, [saveToLocalStorage]);

  const contextValue: UserPreferencesContextType = {
    preferences,
    updatePreferences,
    resetToDefaults,
    isLoading,
  };

  return (
    <UserPreferencesContext.Provider value={contextValue}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export default UserPreferencesContext;