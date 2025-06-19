/**
 * Authentication Guard Components
 *
 * These components provide component-level authentication protection beyond
 * route middleware. They handle different protection levels, loading states,
 * and smooth transitions for a better user experience.
 */

'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import type { ReactNode } from 'react';

// Types
export interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  showLoading?: boolean;
  requireRole?: string[];
  loadingComponent?: ReactNode;
}

interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  hasRole: boolean;
}

// Default loading component with skeleton and fade effects
const DefaultLoadingComponent = () => (
  <div className='flex h-screen items-center justify-center'>
    <div className='w-full max-w-md animate-pulse space-y-4'>
      <div className='h-12 rounded-lg bg-gray-200 dark:bg-gray-700'></div>
      <div className='space-y-3'>
        <div className='h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700'></div>
        <div className='h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700'></div>
        <div className='h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700'></div>
      </div>
    </div>
  </div>
);

// Default fallback component for unauthenticated users
const DefaultFallback = () => {
  // Import redirect utilities dynamically to avoid SSR issues
  const handleSignInClick = () => {
    import('@/lib/auth/redirect-utils')
      .then(({ storeCurrentLocationAndRedirect }) => {
        storeCurrentLocationAndRedirect('sign-in');
      })
      .catch(() => {
        // Fallback if import fails
        window.location.href = '/sign-in';
      });
  };

  return (
    <div className='flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
      <div className='mx-auto max-w-md space-y-4 p-6 text-center'>
        <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900'>
          <svg
            className='h-8 w-8 text-blue-600 dark:text-blue-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
            />
          </svg>
        </div>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
          Authentication Required
        </h2>
        <p className='text-gray-600 dark:text-gray-400'>
          Please sign in to access this content.
        </p>
        <button
          onClick={handleSignInClick}
          className='inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
        >
          Sign In
        </button>
      </div>
    </div>
  );
};

// Hook to determine auth state with role checking
const useAuthState = (requireRole?: string[]): AuthState => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [hasRole, setHasRole] = useState(true); // Default to true if no role required

  useEffect(() => {
    if (!requireRole || !user) {
      setHasRole(true);
      return;
    }

    // Check if user has required role
    // This assumes roles are stored in user.publicMetadata.roles or similar
    const userRoles = (user.publicMetadata?.roles as string[]) || [];
    const hasRequiredRole = requireRole.some((role) =>
      userRoles.includes(role)
    );
    setHasRole(hasRequiredRole);
  }, [user, requireRole]);

  return {
    isLoaded,
    isSignedIn: isSignedIn || false,
    hasRole,
  };
};

/**
 * Main AuthGuard Component
 *
 * Provides authentication protection with customizable fallbacks,
 * loading states, and role-based access control.
 */
export const AuthGuard = ({
  children,
  fallback,
  redirectTo,
  showLoading = true,
  requireRole,
  loadingComponent,
}: AuthGuardProps) => {
  const router = useRouter();
  const authState = useAuthState(requireRole);
  const [fadeIn, setFadeIn] = useState(false);

  // Handle redirect for unauthenticated users
  useEffect(() => {
    if (authState.isLoaded && !authState.isSignedIn && redirectTo) {
      router.push(redirectTo);
    }
  }, [authState.isLoaded, authState.isSignedIn, redirectTo, router]);

  // Handle fade-in animation
  useEffect(() => {
    if (authState.isLoaded && authState.isSignedIn && authState.hasRole) {
      const timer = setTimeout(() => setFadeIn(true), 50);
      return () => clearTimeout(timer);
    }
  }, [authState.isLoaded, authState.isSignedIn, authState.hasRole]);

  // Show loading state
  if (!authState.isLoaded && showLoading) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // Show fallback for unauthenticated users (if not redirecting)
  if (!authState.isSignedIn && !redirectTo) {
    return fallback || <DefaultFallback />;
  }

  // Show fallback for users without required role
  if (authState.isSignedIn && !authState.hasRole) {
    return (
      <div className='flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <div className='mx-auto max-w-md space-y-4 p-6 text-center'>
          <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900'>
            <svg
              className='h-8 w-8 text-red-600 dark:text-red-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636'
              />
            </svg>
          </div>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Access Denied
          </h2>
          <p className='text-gray-600 dark:text-gray-400'>
            You don&apos;t have permission to access this content.
          </p>
        </div>
      </div>
    );
  }

  // don&apos;t render children if not authenticated (when redirecting)
  if (!authState.isSignedIn || !authState.hasRole) {
    return null;
  }

  // Render children with fade-in animation
  return (
    <div
      className={`transition-opacity duration-300 ${
        fadeIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  );
};

export default AuthGuard;
