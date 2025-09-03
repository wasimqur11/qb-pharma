import React, { useState } from 'react';
import { 
  WifiIcon, 
  ExclamationTriangleIcon, 
  ArrowPathIcon 
} from '@heroicons/react/24/outline';
import { useConnectivity } from '../contexts/ConnectivityContext';

interface ConnectivityIndicatorProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  position?: 'header' | 'floating' | 'inline';
}

export const ConnectivityIndicator: React.FC<ConnectivityIndicatorProps> = ({ 
  showLabel = false, 
  size = 'md',
  position = 'header'
}) => {
  const { status, isConnected, lastChecked, checkConnectivity, retryCount } = useConnectivity();
  const [isManualChecking, setIsManualChecking] = useState(false);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          icon: 'h-4 w-4',
          dot: 'h-2 w-2',
          text: 'text-xs',
          container: 'gap-1'
        };
      case 'lg':
        return {
          icon: 'h-6 w-6',
          dot: 'h-3 w-3',
          text: 'text-sm',
          container: 'gap-2'
        };
      default:
        return {
          icon: 'h-5 w-5',
          dot: 'h-2.5 w-2.5',
          text: 'text-sm',
          container: 'gap-1.5'
        };
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'floating':
        return 'fixed bottom-4 right-4 bg-gray-800/90 backdrop-blur-sm border border-gray-600/30 rounded-lg px-3 py-2 shadow-lg z-40';
      case 'inline':
        return 'inline-flex items-center';
      default:
        return 'flex items-center';
    }
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-400',
          label: 'Connected',
          icon: WifiIcon,
          pulse: false
        };
      case 'checking':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400',
          label: 'Checking...',
          icon: ArrowPathIcon,
          pulse: true
        };
      case 'reconnecting':
        return {
          color: 'text-orange-400',
          bgColor: 'bg-orange-400',
          label: `Reconnecting... (${retryCount > 0 ? `Attempt ${retryCount}` : 'Retrying'})`,
          icon: ArrowPathIcon,
          pulse: true
        };
      case 'disconnected':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-400',
          label: 'Disconnected',
          icon: ExclamationTriangleIcon,
          pulse: false
        };
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-400',
          label: 'Unknown',
          icon: ExclamationTriangleIcon,
          pulse: false
        };
    }
  };

  const handleManualCheck = async () => {
    if (isManualChecking) return;
    
    setIsManualChecking(true);
    try {
      await checkConnectivity();
    } finally {
      setTimeout(() => setIsManualChecking(false), 1000);
    }
  };

  const statusInfo = getStatusInfo();
  const sizeClasses = getSizeClasses();
  const positionClasses = getPositionClasses();
  const IconComponent = statusInfo.icon;

  const formatLastChecked = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s ago`;
    } else {
      return `${seconds}s ago`;
    }
  };

  return (
    <div className={`${positionClasses} ${sizeClasses.container}`}>
      {/* Status indicator */}
      <div className="relative flex items-center gap-2">
        {/* Animated dot indicator */}
        <div className="relative">
          <div 
            className={`${sizeClasses.dot} ${statusInfo.bgColor} rounded-full ${
              statusInfo.pulse ? 'animate-pulse' : ''
            }`}
          />
          {status === 'reconnecting' && (
            <div className={`absolute inset-0 ${sizeClasses.dot} ${statusInfo.bgColor} rounded-full animate-ping opacity-75`} />
          )}
        </div>

        {/* Icon (for larger sizes or when label is shown) */}
        {(size !== 'sm' || showLabel) && (
          <button
            onClick={handleManualCheck}
            disabled={isManualChecking || status === 'checking'}
            className={`${statusInfo.color} hover:${statusInfo.color}/80 transition-colors disabled:opacity-50`}
            title={`${statusInfo.label} - Click to retry connection`}
          >
            <IconComponent 
              className={`${sizeClasses.icon} ${
                (status === 'checking' || isManualChecking) ? 'animate-spin' : ''
              }`} 
            />
          </button>
        )}

        {/* Label */}
        {showLabel && (
          <div className={`${sizeClasses.text} ${statusInfo.color} font-medium`}>
            {statusInfo.label}
          </div>
        )}
      </div>

      {/* Detailed info for floating position */}
      {position === 'floating' && (
        <div className="mt-1 text-xs text-gray-400">
          <div>Last checked: {formatLastChecked(lastChecked)}</div>
          {!isConnected && retryCount > 0 && (
            <div>Retry attempts: {retryCount}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectivityIndicator;