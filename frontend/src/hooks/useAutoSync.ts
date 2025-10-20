import { useEffect, useRef, useState, useCallback } from 'react';
import apiClient from '../utils/apiClient';

interface SyncTimestamps {
  transactions: number;
  doctors: number;
  businessPartners: number;
  employees: number;
  distributors: number;
  patients: number;
}

interface UseAutoSyncOptions {
  enabled?: boolean;
  pollInterval?: number; // in milliseconds
  onDataChange?: (changedTypes: string[]) => void;
}

/**
 * Hook to automatically detect data changes and trigger refresh
 * Polls the backend for last update timestamps and compares with local state
 */
export const useAutoSync = (options: UseAutoSyncOptions = {}) => {
  const {
    enabled = true,
    pollInterval = 10000, // Default: poll every 10 seconds
    onDataChange
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const lastTimestamps = useRef<SyncTimestamps | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const checkForUpdates = useCallback(async () => {
    try {
      const response = await apiClient.get<{ timestamps: SyncTimestamps; serverTime: number }>('/api/sync/last-update');

      if (response.success && response.data?.timestamps) {
        const newTimestamps = response.data.timestamps;

        // On first check, just save timestamps
        if (!lastTimestamps.current) {
          lastTimestamps.current = newTimestamps;
          return;
        }

        // Compare timestamps to detect changes
        const changedTypes: string[] = [];
        const keys = Object.keys(newTimestamps) as Array<keyof SyncTimestamps>;

        keys.forEach(key => {
          if (newTimestamps[key] > (lastTimestamps.current?.[key] || 0)) {
            changedTypes.push(key);
          }
        });

        // If changes detected, update timestamps and notify
        if (changedTypes.length > 0) {
          console.log('[AutoSync] Data changes detected:', changedTypes);
          lastTimestamps.current = newTimestamps;
          onDataChange?.(changedTypes);
        }
      }
    } catch (error) {
      // Silently fail - don't disrupt user experience
      console.warn('[AutoSync] Failed to check for updates:', error);
    }
  }, [onDataChange]);

  // Start/stop polling based on enabled flag
  useEffect(() => {
    if (!enabled) {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
      setIsPolling(false);
      return;
    }

    // Initial check
    checkForUpdates();

    // Start polling
    setIsPolling(true);
    pollingInterval.current = setInterval(checkForUpdates, pollInterval);

    // Cleanup on unmount
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
      setIsPolling(false);
    };
  }, [enabled, pollInterval, checkForUpdates]);

  // Manual trigger function
  const trigger = useCallback(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  // Reset timestamps (useful after manual refresh)
  const reset = useCallback(() => {
    lastTimestamps.current = null;
  }, []);

  return {
    isPolling,
    trigger,
    reset
  };
};
