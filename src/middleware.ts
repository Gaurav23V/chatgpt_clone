/**
 * Next.js Middleware for Clerk Authentication
 *
 * This middleware will handle authentication for protected routes using Clerk.
 * It runs before requests are processed and can redirect unauthenticated users
 * to the sign-in page or allow access to public routes.
 *
 * TODO: Implement Clerk middleware when ready to enable authentication
 *
 * Example implementation:
 * ```typescript
 * import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
 *
 * const isProtectedRoute = createRouteMatcher([
 *   '/chat(.*)',
 *   '/history',
 *   '/settings',
 *   '/profile',
 *   '/api/chat',
 *   '/api/history'
 * ])
 *
 * export default clerkMiddleware((auth, req) => {
 *   if (isProtectedRoute(req)) auth().protect()
 * })
 *
 * export const config = {
 *   matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
 * }
 * ```
 *
 * For now, this middleware is disabled to allow development without authentication.
 * Uncomment and implement the above code when ready to enable Clerk authentication.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

import { serverRedirectUtils } from '@/lib/auth/redirect-utils';

/**
 * Clerk + Next.js Middleware with Sophisticated Redirect Logic
 * --------------------------------------------------
 * The middleware runs on every request that matches the `config.matcher` below.
 * Enhanced with redirect logic that remembers where users were trying to go
 * before authentication and returns them there afterward.
 *
 * 1. Public routes (no authentication required)
 *    •   `/`                 – marketing / landing page
 *    •   `/sign-in(.*)`      – multi-step sign-in flow handled by Clerk
 *    •   `/sign-up(.*)`      – multi-step sign-up flow handled by Clerk
 *    •   `/api/webhooks/clerk` – endpoint used by Clerk webhooks (must stay open)
 *
 * 2. Protected routes (session required)
 *    •   `/c/:path*`                 – chat UI & thread pages
 *    •   `/api/chat/:path*`          – chat completion endpoint
 *    •   `/api/conversations/:path*` – CRUD endpoints for conversation history
 *
 * For protected routes, unauthenticated users are redirected to `/sign-in` with
 * a `redirect_url` parameter containing their intended destination.
 */

// Route matcher helpers --------------------------------------------------
const isPublicRoute = createRouteMatcher([
  '/', // landing page – publicly accessible
  '/sign-in(.*)', // Clerk sign-in flow
  '/sign-up(.*)', // Clerk sign-up flow
  '/api/webhooks/clerk', // Webhooks must remain public so Clerk can reach them
  '/api/health', // Health check endpoint should be public for monitoring
  '/api/test-mongo', // MongoDB test endpoint for debugging
  '/api/debug-env', // Environment debug endpoint for debugging
]);

// Special routes that need custom redirect handling
const isSpecialChatRoute = createRouteMatcher([
  '/c/new', // New chat creation
  '/c/(.*)', // Existing chat routes
]);

/**
 * Builds a secure redirect URL for authentication
 */
function buildSecureAuthRedirect(
  req: NextRequest,
  authPage: string = 'sign-in'
): string {
  const origin = req.nextUrl.origin;
  const currentPath = serverRedirectUtils.getCleanPathname(req.nextUrl.href);

  // Handle special route mappings
  const specialMappings: Record<string, string> = {
    '/c/new': '/chat',
    '/': '/chat',
  };

  let redirectUrl = currentPath;
  if (specialMappings[currentPath]) {
    redirectUrl = specialMappings[currentPath];
  }

  // Build auth URL with redirect parameter
  return serverRedirectUtils.buildAuthRedirect(authPage, redirectUrl, origin);
}

// Export Clerk middleware -------------------------------------------------
export default clerkMiddleware(
  async (auth, req) => {
    // Skip auth checks for explicitly-public routes
    if (isPublicRoute(req)) return;

    // Check if user is authenticated
    const session = await auth();

    if (!session.userId) {
      // User is not authenticated - redirect to sign-in with return URL
      const redirectUrl = buildSecureAuthRedirect(req);

      // For API routes, return JSON response instead of redirect
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            error: 'Authentication required',
            redirectUrl: '/sign-in',
          },
          { status: 401 }
        );
      }

      // For page routes, redirect to sign-in with return URL
      return NextResponse.redirect(redirectUrl);
    }

    // User is authenticated - continue
    return;
  },
  {
    // Enhanced configuration
    debug: process.env.NODE_ENV === 'development',

    // Custom redirect URLs for Clerk
    signInUrl: '/sign-in',
    signUpUrl: '/sign-up',
    afterSignInUrl: '/chat',
    afterSignUpUrl: '/chat',
  }
);

/**
 * Next.js matcher configuration
 * --------------------------------------------------
 * We run the middleware on **all** application & API routes except for:
 *   – Next.js internals (`_next/static`, `_next/image`)
 *   – the favicon
 *   – any route that points directly to a static asset by extension.
 *
 * The heavy-lifting regex below is adapted from Clerk docs & excludes most
 * common static asset extensions. Feel free to tweak if you add additional
 * asset types (e.g. `mp4`, `pdf`, etc.).
 */
export const config = {
  matcher: [
    // Skip static files and Next.js internals, but include everything else
    '/((?!_next/static|_next/image|favicon.ico|[^/]*\\.[^/]*$).*)',
  ],
};
