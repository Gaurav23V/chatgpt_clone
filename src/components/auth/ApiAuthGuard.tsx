/**
 * API Authentication Guard
 *
 * Lightweight authentication guard for client-side API call protection.
 * Designed to protect components that make API calls without heavy UI fallbacks.
 */

'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '@clerk/nextjs';
import type { ReactNode } from 'react';

interface ApiAuthGuardProps {
  children: ReactNode;
  onUnauthenticated?: () => void;
  fallback?: ReactNode;
  showMinimalLoading?: boolean;
}

// Minimal loading indicator for API guards
const MinimalLoadingComponent = () => (
  <div className='flex items-center justify-center p-4'>
    <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600'></div>
  </div>
);

// Minimal fallback for unauthenticated state
const MinimalFallback = () => (
  <div className='flex items-center justify-center p-4'>
    <div className='text-center'>
      <p className='mb-2 text-sm text-gray-500 dark:text-gray-400'>
        Authentication required
      </p>
      <button
        onClick={() => (window.location.href = '/sign-in')}
        className='rounded bg-blue-600 px-3 py-1 text-xs text-white transition-colors duration-200 hover:bg-blue-700'
      >
        Sign In
      </button>
    </div>
  </div>
);

/**
 * ApiAuthGuard Component
 *
 * Lightweight guard for protecting components that make API calls.
 * Provides minimal UI impact while ensuring authentication.
 */
export const ApiAuthGuard = ({
  children,
  onUnauthenticated,
  fallback,
  showMinimalLoading = true,
}: ApiAuthGuardProps) => {
  const { isLoaded, isSignedIn } = useAuth();
  const [fadeIn, setFadeIn] = useState(false);

  // Handle unauthenticated callback
  useEffect(() => {
    if (isLoaded && !isSignedIn && onUnauthenticated) {
      onUnauthenticated();
    }
  }, [isLoaded, isSignedIn, onUnauthenticated]);

  // Handle fade-in animation
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const timer = setTimeout(() => setFadeIn(true), 10);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, isSignedIn]);

  // Show minimal loading state
  if (!isLoaded && showMinimalLoading) {
    return <MinimalLoadingComponent />;
  }

  // Show fallback for unauthenticated users
  if (isLoaded && !isSignedIn) {
    return fallback || <MinimalFallback />;
  }

  // don&apos;t render if not loaded or not signed in
  if (!isLoaded || !isSignedIn) {
    return null;
  }

  // Render children with subtle fade-in
  return (
    <div
      className={`transition-opacity duration-150 ${
        fadeIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  );
};

/**
 * Hook for API authentication checking
 *
 * Use this hook in components that need to check authentication
 * before making API calls without rendering auth UI.
 */
export const useApiAuth = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const checkAuth = async (): Promise<boolean> => {
    if (!isLoaded) {
      return false;
    }
    return isSignedIn;
  };

  const getAuthToken = async (): Promise<string | null> => {
    if (!isSignedIn) {
      return null;
    }
    return await getToken();
  };

  return {
    isLoaded,
    isSignedIn,
    checkAuth,
    getAuthToken,
  };
};

export default ApiAuthGuard;
