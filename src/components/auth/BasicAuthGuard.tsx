/**
 * Basic Authentication Guard
 *
 * A simplified version of AuthGuard for basic authentication checks.
 * Perfect for simple pages that just need to verify user authentication.
 */

import type { ReactNode } from 'react';

import { AuthGuard } from './AuthGuard';

interface BasicAuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  showLoading?: boolean;
}

/**
 * BasicAuthGuard Component
 *
 * Simple authentication check without role-based access control.
 * Automatically redirects to sign-in if user is not authenticated.
 */
export const BasicAuthGuard = ({
  children,
  fallback,
  redirectTo = '/sign-in',
  showLoading = true,
}: BasicAuthGuardProps) => {
  return (
    <AuthGuard
      redirectTo={redirectTo}
      showLoading={showLoading}
      fallback={fallback}
    >
      {children}
    </AuthGuard>
  );
};

export default BasicAuthGuard;
