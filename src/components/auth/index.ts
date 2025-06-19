/**
 * Authentication Components Export Barrel
 *
 * This file exports all authentication guard components and utilities.
 * Components provide component-level protection beyond route middleware:
 *
 * - AuthGuard: Main authentication guard with full customization
 * - BasicAuthGuard: Simple authentication check
 * - ChatAuthGuard: Chat-specific guard with custom loading states
 * - ApiAuthGuard: Lightweight guard for API call protection
 */

// Main authentication guard components
export { ApiAuthGuard, useApiAuth } from './ApiAuthGuard';
export { AuthGuard, type AuthGuardProps } from './AuthGuard';
export { BasicAuthGuard } from './BasicAuthGuard';
export { ChatAuthGuard } from './ChatAuthGuard';

// Error handling components
export { AuthErrorAlert, SimpleErrorAlert } from './AuthErrorAlert';
export {
  default as AuthErrorBoundary,
  withAuthErrorBoundary,
} from './AuthErrorBoundary';
export { AuthErrorPage } from './AuthErrorPage';
export { AuthRetryButton, SimpleRetryButton } from './AuthRetryButton';

// Protected page wrapper
export {
  type AuthRequirements,
  type LoadingVariant,
  ProtectedPageWrapper,
  type ProtectedPageWrapperProps,
  type ProtectionLevel,
  withProtectedPage,
} from './ProtectedPageWrapper';

// Re-export commonly used types for convenience
export type { ReactNode } from 'react';

/**
 * Usage Examples:
 *
 * 1. Basic Authentication Protection:
 * ```tsx
 * import { BasicAuthGuard } from '@/components/auth';
 *
 * export default function ProtectedPage() {
 *   return (
 *     <BasicAuthGuard>
 *       <div>Protected content here</div>
 *     </BasicAuthGuard>
 *   );
 * }
 * ```
 *
 * 2. Chat Interface Protection:
 * ```tsx
 * import { ChatAuthGuard } from '@/components/auth';
 *
 * export default function ChatPage() {
 *   return (
 *     <ChatAuthGuard showSidebar={true}>
 *       <ChatInterface />
 *     </ChatAuthGuard>
 *   );
 * }
 * ```
 *
 * 3. API Component Protection:
 * ```tsx
 * import { ApiAuthGuard } from '@/components/auth';
 *
 * function DataComponent() {
 *   return (
 *     <ApiAuthGuard onUnauthenticated={() => console.log('Not authenticated')}>
 *       <DataDisplay />
 *     </ApiAuthGuard>
 *   );
 * }
 * ```
 *
 * 4. Custom Authentication Guard:
 * ```tsx
 * import { AuthGuard } from '@/components/auth';
 *
 * function AdminPanel() {
 *   return (
 *     <AuthGuard
 *       requireRole={['admin', 'moderator']}
 *       redirectTo="/unauthorized"
 *       loadingComponent={<CustomLoader />}
 *     >
 *       <AdminContent />
 *     </AuthGuard>
 *   );
 * }
 * ```
 *
 * 5. Using the API Auth Hook:
 * ```tsx
 * import { useApiAuth } from '@/components/auth';
 *
 * function DataFetcher() {
 *   const { isSignedIn, getAuthToken } = useApiAuth();
 *
 *   const fetchData = async () => {
 *     if (!isSignedIn) return;
 *
 *     const token = await getAuthToken();
 *     // Make authenticated API call
 *   };
 *
 *   return <div>...</div>;
 * }
 * ```
 */
