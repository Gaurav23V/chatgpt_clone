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

// Placeholder middleware - currently does nothing
export function middleware() {
  // No authentication logic yet
  // This will be implemented when Clerk is fully configured
}

/**
 * Middleware configuration
 *
 * The matcher determines which routes the middleware should run on.
 * This configuration will match:
 * - All routes except static files (images, css, js, etc.)
 * - All API routes
 * - The root path
 *
 * When Clerk middleware is implemented, this matcher will ensure
 * authentication checks run on all relevant routes.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
