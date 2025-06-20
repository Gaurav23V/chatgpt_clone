/**
 * Offline Indicator Component
 *
 * Detects network status and displays appropriate UI for offline scenarios.
 * Shows connection status, attempts to reconnect, and provides offline feedback.
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';

import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Network Status
 */
export type NetworkStatus = 'online' | 'offline' | 'reconnecting' | 'slow';

/**
 * Offline Indicator Props
 */
export interface OfflineIndicatorProps {
  className?: string;
  variant?: 'banner' | 'badge' | 'toast' | 'overlay';
  showWhenOnline?: boolean;
  autoReconnect?: boolean;
  onStatusChange?: (status: NetworkStatus) => void;
  onRetry?: () => void;
}

/**
 * Network State
 */
interface NetworkState {
  status: NetworkStatus;
  lastOnline: number;
  reconnectAttempts: number;
  isRetrying: boolean;
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

/**
 * Detect slow connection
 */
function isSlowConnection(): boolean {
  if (!isBrowser()) return false;

  // Type assertion for experimental navigator properties
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;
  if (connection) {
    return (
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g'
    );
  }
  return false;
}

/**
 * Test network connectivity
 */
async function testConnectivity(): Promise<boolean> {
  if (!isBrowser()) return true;

  try {
    // Try to fetch a small resource
    const response = await fetch('/api/health', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Custom hook for network status
 */
export function useNetworkStatus(): {
  status: NetworkStatus;
  isOnline: boolean;
  isOffline: boolean;
  retry: () => Promise<void>;
} {
  const [state, setState] = useState<NetworkState>({
    status: 'online',
    lastOnline: Date.now(),
    reconnectAttempts: 0,
    isRetrying: false,
  });

  // Check initial status
  useEffect(() => {
    if (!isBrowser()) return;

    const initialStatus = navigator.onLine ? 'online' : 'offline';
    const isSlowConn = isSlowConnection();

    setState((prev) => ({
      ...prev,
      status: isSlowConn ? 'slow' : initialStatus,
      lastOnline: initialStatus === 'online' ? Date.now() : prev.lastOnline,
    }));
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    if (!isBrowser()) return;

    const handleOnline = () => {
      setState((prev) => ({
        ...prev,
        status: isSlowConnection() ? 'slow' : 'online',
        lastOnline: Date.now(),
        reconnectAttempts: 0,
      }));
    };

    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        status: 'offline',
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Retry connection
  const retry = useCallback(async () => {
    if (state.isRetrying) return;

    setState((prev) => ({
      ...prev,
      status: 'reconnecting',
      isRetrying: true,
      reconnectAttempts: prev.reconnectAttempts + 1,
    }));

    try {
      const isConnected = await testConnectivity();

      setState((prev) => ({
        ...prev,
        status: isConnected ? 'online' : 'offline',
        isRetrying: false,
        lastOnline: isConnected ? Date.now() : prev.lastOnline,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        status: 'offline',
        isRetrying: false,
      }));
    }
  }, [state.isRetrying]);

  return {
    status: state.status,
    isOnline: state.status === 'online' || state.status === 'slow',
    isOffline: state.status === 'offline',
    retry,
  };
}

/**
 * Format time since last online
 */
function formatTimeSince(timestamp: number): string {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Offline Indicator Component
 */
export function OfflineIndicator({
  className = '',
  variant = 'banner',
  showWhenOnline = false,
  autoReconnect = true,
  onStatusChange,
  onRetry,
}: OfflineIndicatorProps) {
  const { status, isOnline, isOffline, retry } = useNetworkStatus();
  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());

  // Track last online time
  useEffect(() => {
    if (isOnline) {
      setLastOnlineTime(Date.now());
    }
  }, [isOnline]);

  // Call status change callback
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status, onStatusChange]);

  // Auto-reconnect logic
  useEffect(() => {
    if (!autoReconnect || !isOffline) return;

    const retryDelay = Math.min(1000 * Math.pow(2, Math.min(5, 1)), 30000); // Max 30s
    const timeout = setTimeout(() => {
      retry();
    }, retryDelay);

    return () => clearTimeout(timeout);
  }, [autoReconnect, isOffline, retry]);

  // Handle manual retry
  const handleRetry = useCallback(async () => {
    if (onRetry) {
      onRetry();
    }
    await retry();
  }, [onRetry, retry]);

  // Don't show if online and showWhenOnline is false
  if (isOnline && !showWhenOnline) return null;

  // Get status icon
  const getStatusIcon = () => {
    const iconClass = 'h-4 w-4';

    switch (status) {
      case 'online':
        return <Wifi className={`${iconClass} text-green-500`} />;
      case 'slow':
        return <Wifi className={`${iconClass} text-yellow-500`} />;
      case 'reconnecting':
        return (
          <RefreshCw className={`${iconClass} animate-spin text-blue-500`} />
        );
      case 'offline':
        return <WifiOff className={`${iconClass} text-red-500`} />;
      default:
        return <WifiOff className={`${iconClass} text-gray-500`} />;
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Connected';
      case 'slow':
        return 'Slow connection';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'offline':
        return 'No connection';
      default:
        return 'Unknown status';
    }
  };

  // Get status colors
  const getStatusColors = () => {
    switch (status) {
      case 'online':
        return {
          bg: 'bg-green-50 dark:bg-green-950/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-800 dark:text-green-200',
        };
      case 'slow':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-800 dark:text-yellow-200',
        };
      case 'reconnecting':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-200',
        };
      case 'offline':
        return {
          bg: 'bg-red-50 dark:bg-red-950/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          border: 'border-gray-200 dark:border-gray-600',
          text: 'text-gray-800 dark:text-gray-200',
        };
    }
  };

  const colors = getStatusColors();

  // Badge variant
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center space-x-2 rounded-full px-2 py-1 text-xs ${colors.bg} ${colors.text} ${className}`}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
    );
  }

  // Toast variant
  if (variant === 'toast') {
    return (
      <div
        className={`fixed right-4 bottom-4 z-50 max-w-sm rounded-lg shadow-lg ${colors.bg} ${colors.border} ${colors.text} border p-4 ${className} `}
      >
        <div className='flex items-start space-x-3'>
          <div className='flex-shrink-0'>{getStatusIcon()}</div>
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-medium'>{getStatusText()}</p>
            {isOffline && (
              <>
                <p className='mt-1 text-xs opacity-75'>
                  Last online {formatTimeSince(lastOnlineTime)}
                </p>
                <Button
                  onClick={handleRetry}
                  size='sm'
                  variant='ghost'
                  className='mt-2 h-6 px-2 text-xs'
                >
                  <RefreshCw className='mr-1 h-3 w-3' />
                  Retry
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Overlay variant
  if (variant === 'overlay') {
    if (isOnline) return null;

    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className} `}
      >
        <div className='mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800'>
          <div className='text-center'>
            <div className='mb-4 flex justify-center'>{getStatusIcon()}</div>
            <h3 className='mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100'>
              {getStatusText()}
            </h3>
            <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>
              {status === 'offline'
                ? 'Please check your internet connection and try again.'
                : 'Attempting to reconnect...'}
            </p>
            {isOffline && (
              <Button onClick={handleRetry} className='w-full'>
                <RefreshCw className='mr-2 h-4 w-4' />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Banner variant (default)
  return (
    <div
      className={` ${colors.bg} ${colors.border} ${colors.text} border-l-4 p-4 ${className} `}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <div className='flex-shrink-0'>{getStatusIcon()}</div>
          <div>
            <p className='text-sm font-medium'>{getStatusText()}</p>
            {isOffline && (
              <p className='text-xs opacity-75'>
                Last online {formatTimeSince(lastOnlineTime)}
              </p>
            )}
          </div>
        </div>
        {isOffline && (
          <Button
            onClick={handleRetry}
            size='sm'
            variant='ghost'
            className='text-xs'
          >
            <RefreshCw className='mr-1 h-3 w-3' />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

export default OfflineIndicator;
