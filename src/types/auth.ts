/**
 * Authentication Types
 *
 * TypeScript types and interfaces for the authentication system.
 * Includes types for auth guards, user roles, and authentication states.
 */

import type { ReactNode } from 'react';

// Base authentication guard props
export interface BaseAuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showLoading?: boolean;
}

// Extended authentication guard props with role-based access
export interface AuthGuardProps extends BaseAuthGuardProps {
  redirectTo?: string;
  requireRole?: string[];
  loadingComponent?: ReactNode;
}

// Basic authentication guard props
export interface BasicAuthGuardProps extends BaseAuthGuardProps {
  redirectTo?: string;
}

// Chat authentication guard props
export interface ChatAuthGuardProps {
  children: ReactNode;
  showSidebar?: boolean;
}

// API authentication guard props
export interface ApiAuthGuardProps extends BaseAuthGuardProps {
  onUnauthenticated?: () => void;
  showMinimalLoading?: boolean;
}

// Authentication state interface
export interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  hasRole: boolean;
}

// User role types (aligned with CLERK_CONFIG in lib/auth/clerk-config.ts)
export type UserRole = 'free' | 'pro' | 'enterprise';

// Role permissions interface
export interface RolePermissions {
  maxChatsPerDay: number;
  maxTokensPerChat: number;
  models: string[];
  features: string[];
}

// Extended user metadata interface
export interface UserMetadata {
  roles?: UserRole[];
  subscription?: {
    plan: UserRole;
    status: 'active' | 'cancelled' | 'expired';
    expiresAt: Date;
  };
  preferences?: {
    aiModel: string;
    theme: 'light' | 'dark';
    language: string;
  };
}

// Auth guard component types
export type AuthGuardComponent = React.ComponentType<AuthGuardProps>;
export type BasicAuthGuardComponent = React.ComponentType<BasicAuthGuardProps>;
export type ChatAuthGuardComponent = React.ComponentType<ChatAuthGuardProps>;
export type ApiAuthGuardComponent = React.ComponentType<ApiAuthGuardProps>;

// Auth hook return types
export interface UseApiAuthReturn {
  isLoaded: boolean;
  isSignedIn: boolean;
  checkAuth: () => Promise<boolean>;
  getAuthToken: () => Promise<string | null>;
}

// Guard configuration types
export interface GuardConfig {
  redirectTo?: string;
  fallbackComponent?: ReactNode;
  loadingComponent?: ReactNode;
  requireRole?: UserRole[];
  onUnauthenticated?: () => void;
}

// Auth context types (for future context implementation)
export interface AuthContextValue {
  isAuthenticated: boolean;
  user: any; // Clerk user type
  userRole: UserRole | null;
  permissions: RolePermissions | null;
  isLoading: boolean;
}

// Error types for authentication
export type AuthError =
  | 'UNAUTHENTICATED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'ROLE_REQUIRED'
  | 'TOKEN_EXPIRED'
  | 'UNKNOWN_ERROR';

export interface AuthErrorInfo {
  type: AuthError;
  message: string;
  redirectTo?: string;
}

// Component protection levels
export type ProtectionLevel = 'none' | 'basic' | 'role-based' | 'premium-only';

export interface ComponentProtection {
  level: ProtectionLevel;
  requiredRoles?: UserRole[];
  fallbackComponent?: ReactNode;
  redirectTo?: string;
}

// Export utility types
export type AuthGuardType = 'basic' | 'chat' | 'api' | 'custom';

export interface AuthGuardRegistry {
  basic: BasicAuthGuardComponent;
  chat: ChatAuthGuardComponent;
  api: ApiAuthGuardComponent;
  custom: AuthGuardComponent;
}
