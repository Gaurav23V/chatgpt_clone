/**
 * Protected Page Wrapper
 *
 * A comprehensive wrapper for pages requiring authentication that provides:
 * - Route protection with proper loading states
 * - Error boundary integration
 * - SEO-friendly metadata even when protected
 * - ChatGPT-style loading screens
 * - Development debugging helpers
 */

'use client';

import { useEffect, useState } from 'react';

import { useAuth, useUser } from '@clerk/nextjs';
import type { ReactNode } from 'react';

import { ChatPageSkeleton } from '@/components/layout';
import { useAuthError } from '@/hooks';
import { createAuthError } from '@/lib/auth/error-utils';
import type { UserRole } from '@/types/auth';

import { AuthErrorBoundary } from './AuthErrorBoundary';

// Page protection levels
export type ProtectionLevel = 'basic' | 'chat' | 'premium' | 'admin';

// Loading component variants
export type LoadingVariant = 'skeleton' | 'spinner' | 'chat' | 'minimal';

// Auth requirements interface
export interface AuthRequirements {
  level: ProtectionLevel;
  requireRole?: UserRole[];
  requireVerified?: boolean;
  requireComplete?: boolean;
}

// Protected page wrapper props
export interface ProtectedPageWrapperProps {
  children: ReactNode;
  requirements?: AuthRequirements;
  loadingComponent?: ReactNode;
  loadingVariant?: LoadingVariant;
  errorFallback?: ReactNode;
  enableErrorBoundary?: boolean;
  enableDevTools?: boolean;
  pageTitle?: string;
  pageDescription?: string;
  className?: string;
  showLoadingProgress?: boolean;
  transitionDuration?: number;
}

// Development timing interface
interface AuthTiming {
  startTime: number;
  authCheckTime?: number;
  userLoadTime?: number;
  totalTime?: number;
}

// Default auth requirements
const DEFAULT_REQUIREMENTS: AuthRequirements = {
  level: 'basic',
  requireVerified: false,
  requireComplete: false,
};

/**
 * General skeleton loading component
 */
const GeneralSkeleton = () => (
  <div className='min-h-screen bg-gray-50 p-6 dark:bg-gray-900'>
    <div className='mx-auto max-w-4xl space-y-6'>
      {/* Header Skeleton */}
      <div className='rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800'>
        <div className='h-8 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
        <div className='mt-3 h-4 w-2/3 animate-pulse rounded bg-gray-100 dark:bg-gray-600'></div>
      </div>

      {/* Content Skeleton */}
      <div className='space-y-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className='space-y-2'>
            <div className='h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
            <div className='h-4 w-4/5 animate-pulse rounded bg-gray-100 dark:bg-gray-600'></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Minimal loading spinner
 */
const MinimalSpinner = () => (
  <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
    <div className='flex items-center space-x-3'>
      <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
      <span className='text-gray-600 dark:text-gray-400'>Loading...</span>
    </div>
  </div>
);

/**
 * Standard loading spinner
 */
const StandardSpinner = () => (
  <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
    <div className='text-center'>
      <div className='mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
      <p className='mt-4 text-gray-600 dark:text-gray-400'>Authenticating...</p>
    </div>
  </div>
);

/**
 * Development tools component
 */
const DevTools = ({
  isAuthenticated,
  isLoaded,
  user,
  requirements,
  timing,
}: {
  isAuthenticated: boolean;
  isLoaded: boolean;
  user: { id?: string } | null | undefined;
  requirements: AuthRequirements;
  timing: AuthTiming;
}) => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className='bg-opacity-80 fixed right-4 bottom-4 z-50 max-w-sm rounded-lg bg-black p-3 font-mono text-xs text-white'>
      <div className='space-y-1'>
        <div className='font-bold text-green-400'>🔧 Auth Dev Tools</div>
        <div>
          Protection:{' '}
          <span className='text-blue-300'>{requirements.level}</span>
        </div>
        <div>
          Auth State:{' '}
          <span className={isAuthenticated ? 'text-green-300' : 'text-red-300'}>
            {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
          </span>
        </div>
        <div>
          Loaded:{' '}
          <span className={isLoaded ? 'text-green-300' : 'text-yellow-300'}>
            {isLoaded ? '✅ Yes' : '⏳ Loading'}
          </span>
        </div>
        <div>
          User ID: <span className='text-gray-300'>{user?.id || 'None'}</span>
        </div>
        {requirements.requireRole && (
          <div>
            Required Roles:{' '}
            <span className='text-purple-300'>
              {requirements.requireRole.join(', ')}
            </span>
          </div>
        )}
        {timing.totalTime && (
          <div>
            Auth Time:{' '}
            <span className='text-cyan-300'>{timing.totalTime}ms</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main Protected Page Wrapper Component
 */
export function ProtectedPageWrapper({
  children,
  requirements = DEFAULT_REQUIREMENTS,
  loadingComponent,
  loadingVariant = 'skeleton',
  errorFallback,
  enableErrorBoundary = true,
  enableDevTools = true,
  pageTitle,
  pageDescription: _pageDescription,
  className = '',
  showLoadingProgress: _showLoadingProgress = false,
  transitionDuration = 300,
}: ProtectedPageWrapperProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { reportError } = useAuthError();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [timing, setTiming] = useState<AuthTiming>({ startTime: Date.now() });

  // Update timing measurements
  useEffect(() => {
    if (isLoaded && !timing.authCheckTime) {
      setTiming((prev) => ({
        ...prev,
        authCheckTime: Date.now() - prev.startTime,
      }));
    }
  }, [isLoaded, timing.authCheckTime]);

  useEffect(() => {
    if (user && !timing.userLoadTime) {
      setTiming((prev) => ({
        ...prev,
        userLoadTime: Date.now() - prev.startTime,
        totalTime: Date.now() - prev.startTime,
      }));
    }
  }, [user, timing.userLoadTime]);

  // Handle transitions
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setIsTransitioning(true);
      const timer = setTimeout(
        () => setIsTransitioning(false),
        transitionDuration
      );
      return () => clearTimeout(timer);
    }
  }, [isLoaded, isSignedIn, transitionDuration]);

  // Check role requirements
  const hasRequiredRole = () => {
    if (!requirements.requireRole || requirements.requireRole.length === 0) {
      return true;
    }

    const userRoles = (user?.publicMetadata?.roles as UserRole[]) || [];
    return requirements.requireRole.some((role) => userRoles.includes(role));
  };

  // Check verification requirements
  const meetsVerificationRequirements = () => {
    if (!requirements.requireVerified) return true;
    return user?.emailAddresses?.[0]?.verification?.status === 'verified';
  };

  // Check profile completion requirements
  const meetsCompletionRequirements = () => {
    if (!requirements.requireComplete) return true;
    return user?.firstName && user?.lastName;
  };

  // Handle authentication errors
  const handleAuthError = (errorType: string, message: string) => {
    const authError = createAuthError(
      errorType as 'INSUFFICIENT_PERMISSIONS',
      message,
      'PAGE_PROTECTION_ERROR',
      { requirements, page: pageTitle }
    );
    reportError(authError);
  };

  // Get loading component based on variant
  const getLoadingComponent = () => {
    if (loadingComponent) return loadingComponent;

    switch (loadingVariant) {
      case 'chat':
        return <ChatPageSkeleton variant='existing-chat' />;
      case 'skeleton':
        return <GeneralSkeleton />;
      case 'minimal':
        return <MinimalSpinner />;
      case 'spinner':
      default:
        return <StandardSpinner />;
    }
  };

  // Loading state
  if (!isLoaded || isTransitioning) {
    return (
      <div
        className={`transition-opacity duration-${transitionDuration} ${className}`}
      >
        {getLoadingComponent()}
        {enableDevTools && (
          <DevTools
            isAuthenticated={isSignedIn || false}
            isLoaded={isLoaded}
            user={user}
            requirements={requirements}
            timing={timing}
          />
        )}
      </div>
    );
  }

  // Not authenticated
  if (!isSignedIn) {
    handleAuthError(
      'UNAUTHENTICATED',
      'User must be authenticated to access this page'
    );
    return getLoadingComponent(); // AuthErrorBoundary will handle the redirect
  }

  // Check role requirements
  if (!hasRequiredRole()) {
    handleAuthError(
      'INSUFFICIENT_PERMISSIONS',
      'User does not have required role permissions'
    );
    return (
      errorFallback || (
        <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
          <div className='text-center'>
            <h1 className='mb-4 text-2xl font-bold text-gray-900 dark:text-white'>
              Access Denied
            </h1>
            <p className='text-gray-600 dark:text-gray-400'>
              You don&apos;t have permission to access this page.
            </p>
          </div>
        </div>
      )
    );
  }

  // Check verification requirements
  if (!meetsVerificationRequirements()) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <div className='text-center'>
          <h1 className='mb-4 text-2xl font-bold text-gray-900 dark:text-white'>
            Email Verification Required
          </h1>
          <p className='mb-4 text-gray-600 dark:text-gray-400'>
            Please verify your email address to continue.
          </p>
          <button
            onClick={() =>
              user?.emailAddresses?.[0]?.prepareVerification({
                strategy: 'email_code',
              })
            }
            className='rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700'
          >
            Send Verification Email
          </button>
        </div>
      </div>
    );
  }

  // Check completion requirements
  if (!meetsCompletionRequirements()) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <div className='text-center'>
          <h1 className='mb-4 text-2xl font-bold text-gray-900 dark:text-white'>
            Complete Your Profile
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Please complete your profile to continue.
          </p>
        </div>
      </div>
    );
  }

  // Render protected content
  const content = (
    <div
      className={`transition-opacity duration-${transitionDuration} ${className}`}
    >
      {children}
      {enableDevTools && (
        <DevTools
          isAuthenticated={isSignedIn}
          isLoaded={isLoaded}
          user={user}
          requirements={requirements}
          timing={timing}
        />
      )}
    </div>
  );

  // Wrap with error boundary if enabled
  if (enableErrorBoundary) {
    return (
      <AuthErrorBoundary enableLogging={true} autoRetry={true} maxRetries={3}>
        {content}
      </AuthErrorBoundary>
    );
  }

  return content;
}

/**
 * HOC for wrapping pages with protection
 */
export function withProtectedPage<P extends object>(
  Component: React.ComponentType<P>,
  wrapperProps?: Partial<ProtectedPageWrapperProps>
) {
  const WrappedComponent = (props: P) => (
    <ProtectedPageWrapper {...wrapperProps}>
      <Component {...props} />
    </ProtectedPageWrapper>
  );

  WrappedComponent.displayName = `withProtectedPage(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default ProtectedPageWrapper;
