import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertMessage {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  details?: any;
  duration?: number; // Auto-dismiss after this many milliseconds (default: 5000)
  persistent?: boolean; // Don't auto-dismiss
}

interface AlertProps {
  alert: AlertMessage;
  onDismiss: (id: string) => void;
}

const Alert: React.FC<AlertProps> = ({ alert, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!alert.persistent && alert.duration !== 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(alert.id), 300); // Wait for fade-out animation
      }, alert.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [alert, onDismiss]);

  const getAlertStyles = () => {
    switch (alert.type) {
      case 'success':
        return {
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-400/30',
          textColor: 'text-green-200',
          iconColor: 'text-green-300',
          icon: CheckCircleIcon
        };
      case 'error':
        return {
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-400/30',
          textColor: 'text-red-200',
          iconColor: 'text-red-300',
          icon: XCircleIcon
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-400/30',
          textColor: 'text-yellow-200',
          iconColor: 'text-yellow-300',
          icon: ExclamationTriangleIcon
        };
      case 'info':
        return {
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-400/30',
          textColor: 'text-blue-200',
          iconColor: 'text-blue-300',
          icon: InformationCircleIcon
        };
      default:
        return {
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-400/30',
          textColor: 'text-gray-200',
          iconColor: 'text-gray-300',
          icon: InformationCircleIcon
        };
    }
  };

  const styles = getAlertStyles();
  const IconComponent = styles.icon;

  return (
    <div
      className={`${styles.bgColor} backdrop-blur-sm border ${styles.borderColor} rounded-xl p-4 space-y-3 transition-all duration-300 ${
        isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <IconComponent className={`h-5 w-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-semibold ${styles.textColor} mb-1`}>
              {alert.title}
            </h4>
            <p className={`text-sm ${styles.textColor}/90`}>
              {alert.message}
            </p>
          </div>
        </div>
        <button
          onClick={() => onDismiss(alert.id)}
          className={`${styles.iconColor} hover:${styles.iconColor}/80 transition-colors flex-shrink-0 ml-2`}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Error Details */}
      {alert.details && (
        <div className={`ml-8 text-xs ${styles.textColor}/80 space-y-1`}>
          {alert.details.details && (
            <p className="font-medium">{alert.details.details}</p>
          )}
          {alert.details.fields && (
            <div>
              <p className="font-medium mb-1">Field errors:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                {alert.details.fields.map((field: any, index: number) => (
                  <li key={index}>
                    <span className="font-medium">{field.field}:</span> {field.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {alert.details.code && (
            <p>Error code: <span className="font-mono">{alert.details.code}</span></p>
          )}
          {alert.details.availableUsers && (
            <div>
              <p className="font-medium mb-1">Available users:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                {alert.details.availableUsers.map((user: string) => (
                  <li key={user}>{user}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface AlertSystemProps {
  alerts: AlertMessage[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxAlerts?: number;
}

export const AlertSystem: React.FC<AlertSystemProps> = ({
  alerts,
  onDismiss,
  position = 'top-right',
  maxAlerts = 5
}) => {
  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  // Limit the number of visible alerts
  const visibleAlerts = alerts.slice(0, maxAlerts);

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className={`fixed ${getPositionStyles()} z-50 space-y-3 max-w-md w-full pointer-events-none`}>
      <div className="pointer-events-auto space-y-3">
        {visibleAlerts.map((alert) => (
          <Alert key={alert.id} alert={alert} onDismiss={onDismiss} />
        ))}
      </div>
      {alerts.length > maxAlerts && (
        <div className="pointer-events-auto bg-gray-800/80 backdrop-blur-sm border border-gray-600/30 rounded-xl p-2 text-center">
          <p className="text-xs text-gray-300">
            +{alerts.length - maxAlerts} more alert{alerts.length - maxAlerts > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

// Hook for managing alerts
export const useAlerts = () => {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  const addAlert = (alert: Omit<AlertMessage, 'id'>) => {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setAlerts(prev => [{ ...alert, id }, ...prev]);
    return id;
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  // Helper functions for common alert types
  const showSuccess = (title: string, message: string, options?: Partial<AlertMessage>) => {
    return addAlert({ type: 'success', title, message, ...options });
  };

  const showError = (title: string, message: string, details?: any, options?: Partial<AlertMessage>) => {
    return addAlert({ type: 'error', title, message, details, persistent: true, ...options });
  };

  const showWarning = (title: string, message: string, options?: Partial<AlertMessage>) => {
    return addAlert({ type: 'warning', title, message, ...options });
  };

  const showInfo = (title: string, message: string, options?: Partial<AlertMessage>) => {
    return addAlert({ type: 'info', title, message, ...options });
  };

  // Helper function for API error handling
  const handleApiError = (operation: string, error: any, context?: string) => {
    let title = `${operation} Failed`;
    let message = 'An unexpected error occurred. Please try again.';
    let details = null;

    if (typeof error === 'string') {
      message = error;
    } else if (error?.error) {
      message = error.error;
      details = error;
    } else if (error?.message) {
      message = error.message;
      details = error;
    }

    if (context) {
      title = `${context} - ${title}`;
    }

    return showError(title, message, details);
  };

  return {
    alerts,
    addAlert,
    removeAlert,
    clearAlerts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    handleApiError
  };
};

export default AlertSystem;