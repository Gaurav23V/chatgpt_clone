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

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Clerk + Next.js Middleware
 * --------------------------------------------------
 * The middleware runs on every request that matches the `config.matcher` below.
 * Using Clerk's `authMiddleware` helper keeps the implementation small and
 * declarative while still giving us fine-grained control over which routes are
 * public vs. protected.
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
 * Any request that is NOT matched by the `publicRoutes` array is considered
 * "protected". For pages, unauthenticated users are automatically redirected to
 * `/sign-in` and, once the flow is complete, returned to their original URL via
 * Clerk's built-in `redirect_url` query parameter.
 *
 * For API routes, Clerk will return a 401/403 style JSON response so client code
 * can handle it gracefully.
 */

// Route matcher helpers --------------------------------------------------
const isPublicRoute = createRouteMatcher([
  '/', // landing page – publicly accessible
  '/sign-in(.*)', // Clerk sign-in flow
  '/sign-up(.*)', // Clerk sign-up flow
  '/api/webhooks/clerk', // Webhooks must remain public so Clerk can reach them
]);

// Export Clerk middleware -------------------------------------------------
export default clerkMiddleware(
  async (auth, req) => {
    // Skip auth checks for explicitly-public routes
    if (isPublicRoute(req)) return;

    // All other paths require a valid session (will redirect or 401/403 automatically)
    await auth.protect();
  },
  {
    // Helpful request-time logs during local development
    debug: process.env.NODE_ENV === 'development',
  },
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
