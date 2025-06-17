/**
 * Clerk Authentication Configuration for ChatGPT Clone
 *
 * This file contains Clerk authentication settings and configuration constants.
 * Clerk provides secure user authentication with features like:
 * - Social sign-in (Google, GitHub, Discord, etc.)
 * - Email/password authentication
 * - Multi-factor authentication
 * - User management dashboard
 * - Session management
 */

/**
 * Required Environment Variables for Clerk
 * Add these to your .env.local file:
 *
 * NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key-here
 * CLERK_SECRET_KEY=sk_test_your-secret-key-here
 *
 * Optional Clerk Environment Variables:
 * NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
 * NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
 * NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/chat
 * NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
 *
 * Get your keys from: https://dashboard.clerk.com/
 */

/**
 * Clerk configuration constants
 */
export const CLERK_CONFIG = {
  // Authentication routes
  ROUTES: {
    SIGN_IN: '/sign-in',
    SIGN_UP: '/sign-up',
    AFTER_SIGN_IN: '/chat',
    AFTER_SIGN_UP: '/onboarding',
    USER_PROFILE: '/profile',
  },

  // Protected routes that require authentication
  PROTECTED_ROUTES: [
    '/chat',
    '/chat/(.*)',
    '/history',
    '/settings',
    '/profile',
    '/api/chat',
    '/api/history',
  ],

  // Public routes that don't require authentication
  PUBLIC_ROUTES: [
    '/',
    '/sign-in',
    '/sign-up',
    '/about',
    '/pricing',
    '/api/health',
  ],

  // Social sign-in providers to enable
  SOCIAL_PROVIDERS: [
    'google',
    'github',
    'discord',
  ],

  // User profile fields to collect
  USER_PROFILE_FIELDS: {
    firstName: true,
    lastName: true,
    emailAddress: true,
    imageUrl: true,
    username: false, // Optional
  },
} as const;

/**
 * Authentication Flow Strategy
 *
 * 1. User Authentication:
 *    - Users can sign in via email/password or social providers
 *    - Clerk handles all authentication logic and security
 *    - Sessions are managed automatically by Clerk
 *
 * 2. User Onboarding:
 *    - New users are redirected to /onboarding after sign-up
 *    - Collect additional preferences (AI model, theme, etc.)
 *    - Create user profile in MongoDB with Clerk user ID
 *
 * 3. Protected Routes:
 *    - All chat routes require authentication
 *    - API routes are protected with Clerk middleware
 *    - Unauthorized users are redirected to sign-in
 *
 * 4. User Sync with MongoDB:
 *    - Clerk user ID is used as primary key in MongoDB
 *    - User data is synced on first sign-in and profile updates
 *    - Chat history is associated with Clerk user ID
 *    - Webhooks handle user lifecycle events (create, update, delete)
 */

/**
 * Clerk Provider Setup Location
 *
 * The ClerkProvider should be added to:
 * - src/app/layout.tsx (wrapping the entire app)
 *
 * Example implementation:
 * ```tsx
 * import { ClerkProvider } from '@clerk/nextjs'
 *
 * export default function RootLayout({
 *   children,
 * }: {
 *   children: React.ReactNode
 * }) {
 *   return (
 *     <ClerkProvider>
 *       <html lang="en">
 *         <body>{children}</body>
 *       </html>
 *     </ClerkProvider>
 *   )
 * }
 * ```
 */

/**
 * MongoDB User Schema Integration
 *
 * User documents in MongoDB will include:
 * - clerkId: string (primary key from Clerk)
 * - email: string
 * - firstName: string
 * - lastName: string
 * - imageUrl: string
 * - preferences: {
 *     aiModel: string
 *     theme: 'light' | 'dark'
 *     language: string
 *   }
 * - subscription: {
 *     plan: 'free' | 'pro' | 'enterprise'
 *     status: 'active' | 'cancelled' | 'expired'
 *     expiresAt: Date
 *   }
 * - chatHistory: ObjectId[] (references to chat sessions)
 * - createdAt: Date
 * - updatedAt: Date
 */

/**
 * Utility function to get current user ID from Clerk
 */
export const getCurrentUserId = async () => {
  // This will be implemented when we add Clerk hooks
  // Example: const { userId } = auth();
  // return userId;
};

/**
 * Utility function to check if user is authenticated
 */
export const isUserAuthenticated = async () => {
  // This will be implemented when we add Clerk hooks
  // Example: const { userId } = auth();
  // return !!userId;
};

/**
 * User role and permission configuration
 */
export const USER_ROLES = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export const ROLE_PERMISSIONS = {
  [USER_ROLES.FREE]: {
    maxChatsPerDay: 10,
    maxTokensPerChat: 1000,
    models: ['gpt-3.5-turbo'],
    features: ['basic-chat'],
  },
  [USER_ROLES.PRO]: {
    maxChatsPerDay: 100,
    maxTokensPerChat: 4000,
    models: ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o'],
    features: ['basic-chat', 'chat-history', 'export-chats'],
  },
  [USER_ROLES.ENTERPRISE]: {
    maxChatsPerDay: -1, // unlimited
    maxTokensPerChat: 8000,
    models: ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o', 'gpt-4'],
    features: ['basic-chat', 'chat-history', 'export-chats', 'team-sharing', 'priority-support'],
  },
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type RolePermissions = typeof ROLE_PERMISSIONS[UserRole];
