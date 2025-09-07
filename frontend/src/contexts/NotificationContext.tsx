import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useTransactions } from './TransactionContext';
import { useStakeholders } from './StakeholderContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { getDistributorPaymentsDue, transactions } = useTransactions();
  const { distributors } = useStakeholders();

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isRead: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep max 50 notifications
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Generate system notifications based on business logic
  useEffect(() => {
    const checkSystemNotifications = () => {
      try {
        // Check for payments due
        const paymentsDue = getDistributorPaymentsDue();
        if (paymentsDue.length > 0) {
          // Only add notification if we don't already have one for payments due
          const hasPaymentNotification = notifications.some(n => 
            n.metadata?.type === 'payments_due' && !n.isRead
          );

          if (!hasPaymentNotification) {
            addNotification({
              title: 'Distributor Payments Due',
              message: `${paymentsDue.length} distributor${paymentsDue.length > 1 ? 's have' : ' has'} outstanding payments due`,
              type: 'warning',
              priority: 'high',
              actionUrl: '/distributor_statement',
              metadata: { type: 'payments_due', count: paymentsDue.length }
            });
          }
        }

        // Check for recent transactions (last 24 hours)
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        
        const recentTransactions = transactions.filter(t => 
          new Date(t.date) > twentyFourHoursAgo
        );

        if (recentTransactions.length > 10) {
          const hasActivityNotification = notifications.some(n => 
            n.metadata?.type === 'high_activity' && !n.isRead
          );

          if (!hasActivityNotification) {
            addNotification({
              title: 'High Transaction Activity',
              message: `${recentTransactions.length} transactions processed in the last 24 hours`,
              type: 'info',
              priority: 'medium',
              metadata: { type: 'high_activity', count: recentTransactions.length }
            });
          }
        }

        // Check for inactive distributors (no transactions in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const activeDistributorIds = new Set(
          transactions
            .filter(t => new Date(t.date) > thirtyDaysAgo)
            .map(t => t.distributorId)
        );
        
        const inactiveDistributors = distributors.filter(d => 
          d.isActive && !activeDistributorIds.has(d.id)
        );

        if (inactiveDistributors.length > 0) {
          const hasInactivityNotification = notifications.some(n => 
            n.metadata?.type === 'inactive_distributors' && !n.isRead
          );

          if (!hasInactivityNotification) {
            addNotification({
              title: 'Inactive Distributors',
              message: `${inactiveDistributors.length} distributor${inactiveDistributors.length > 1 ? 's have' : ' has'} been inactive for 30+ days`,
              type: 'warning',
              priority: 'low',
              actionUrl: '/stakeholders',
              metadata: { type: 'inactive_distributors', count: inactiveDistributors.length }
            });
          }
        }

      } catch (error) {
        console.error('Error checking system notifications:', error);
      }
    };

    // Check immediately and then every 5 minutes
    checkSystemNotifications();
    const interval = setInterval(checkSystemNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [transactions, distributors, getDistributorPaymentsDue, addNotification, notifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;