/**
 * Common Components Export Barrel
 *
 * This file exports all common/shared components used throughout the application.
 * Includes:
 * - Layout components
 * - Form components
 * - UI utilities
 * - Demo components
 */

// Export demo components
export { UserPreferencesDemo } from './user-preferences-demo';
export { EnhancedPreferencesDemo } from './enhanced-preferences-demo';
export { AuthStateDemo } from './auth-state-demo';

// TODO: Export additional common components when they are created
// export { Header } from './Header';
// export { Footer } from './Footer';
// export { Sidebar } from './Sidebar';
// export { Navigation } from './Navigation';
// export { LoadingSpinner } from './LoadingSpinner';
// export { ErrorBoundary } from './ErrorBoundary';
// export { Modal } from './Modal';
// export { Toast } from './Toast';
// export { ConfirmDialog } from './ConfirmDialog';

// Placeholder exports to prevent import errors
export const CommonComponents = {
  // This object will be replaced with actual component exports
  placeholder: true,
};

/**
 * Available Common Components:
 *
 * Demo Components:
 * - UserPreferencesDemo - Interactive demo of user context functionality
 * - EnhancedPreferencesDemo - Advanced demo of the persistence system with all features
 * - AuthStateDemo - Demo of authentication state change management and cleanup
 *
 * Planned Components:
 *
 * 1. Layout Components:
 *    - Header - Application header with navigation
 *    - Footer - Application footer
 *    - Sidebar - Collapsible sidebar navigation
 *    - Navigation - Main navigation component
 *
 * 2. UI Components:
 *    - LoadingSpinner - Loading indicator
 *    - ErrorBoundary - Error handling wrapper
 *    - Modal - Modal dialog component
 *    - Toast - Notification toast
 *    - ConfirmDialog - Confirmation dialog
 *
 * 3. Form Components:
 *    - FormField - Reusable form field wrapper
 *    - FormButton - Styled form button
 *    - FormValidation - Form validation utilities
 *
 * 4. Utility Components:
 *    - ConditionalWrapper - Conditionally wrap children
 *    - ProtectedRoute - Route protection wrapper
 *    - ThemeProvider - Theme management
 */
