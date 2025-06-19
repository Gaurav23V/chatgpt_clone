/**
 * Authentication Redirect Utilities
 *
 * Handles storing, retrieving, and validating redirect URLs for authentication flows.
 * Ensures users return to their intended destination after authentication while
 * maintaining security against open redirect vulnerabilities.
 */

// Constants for storage and URL handling
const REDIRECT_STORAGE_KEY = 'chatgpt_clone_redirect_url';
const DEFAULT_POST_AUTH_URL = '/chat';
const ALLOWED_ORIGINS = [
  'localhost:3000',
  'localhost:3001',
  '127.0.0.1:3000',
  '127.0.0.1:3001',
  // Add your production domains here
  // 'yourdomain.com',
  // 'www.yourdomain.com'
];

// Routes that should redirect to a different default after auth
const SPECIAL_ROUTE_MAPPINGS: Record<string, string> = {
  '/c/new': '/chat',
  '/': '/chat',
  '/sign-in': '/chat',
  '/sign-up': '/chat',
};

/**
 * Validates if a URL is safe for internal redirects
 */
export function isValidRedirectUrl(url: string): boolean {
  try {
    const urlObj = new URL(url, window.location.origin);

    // Must be same origin (internal redirect only)
    if (urlObj.origin !== window.location.origin) {
      return false;
    }

    // Check if hostname is in allowed list (for development/staging)
    const hostname = urlObj.hostname;
    const port = urlObj.port;
    const hostWithPort = port ? `${hostname}:${port}` : hostname;

    if (
      !ALLOWED_ORIGINS.includes(hostWithPort) &&
      hostname !== window.location.hostname
    ) {
      return false;
    }

    // Block certain paths for security
    const blockedPaths = [
      '/api/webhooks',
      '/api/auth',
      '/_next',
      '/admin/system',
    ];

    if (blockedPaths.some((blocked) => urlObj.pathname.startsWith(blocked))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes a URL by removing potentially dangerous parameters
 */
export function sanitizeRedirectUrl(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);

    // Remove potentially dangerous query parameters
    const dangerousParams = [
      'javascript:',
      'data:',
      'vbscript:',
      'file:',
      'ftp:',
    ];
    const searchParams = new URLSearchParams(urlObj.search);

    for (const [key, value] of searchParams.entries()) {
      if (
        dangerousParams.some(
          (dangerous) =>
            key.toLowerCase().includes(dangerous) ||
            value.toLowerCase().includes(dangerous)
        )
      ) {
        searchParams.delete(key);
      }
    }

    urlObj.search = searchParams.toString();
    return urlObj.pathname + urlObj.search + urlObj.hash;
  } catch {
    return DEFAULT_POST_AUTH_URL;
  }
}

/**
 * Stores the intended destination URL in sessionStorage
 */
export function storeRedirectUrl(url: string): void {
  try {
    // Only store if it's a valid internal URL
    if (isValidRedirectUrl(url)) {
      const sanitizedUrl = sanitizeRedirectUrl(url);
      sessionStorage.setItem(REDIRECT_STORAGE_KEY, sanitizedUrl);
    }
  } catch (error) {
    console.warn('Failed to store redirect URL:', error);
  }
}

/**
 * Retrieves the stored redirect URL from sessionStorage
 */
export function getStoredRedirectUrl(): string | null {
  try {
    const storedUrl = sessionStorage.getItem(REDIRECT_STORAGE_KEY);
    if (!storedUrl) return null;

    // Validate the stored URL is still safe
    if (isValidRedirectUrl(storedUrl)) {
      return storedUrl;
    } else {
      // Clean up invalid stored URL
      clearStoredRedirectUrl();
      return null;
    }
  } catch (error) {
    console.warn('Failed to retrieve redirect URL:', error);
    return null;
  }
}

/**
 * Clears the stored redirect URL from sessionStorage
 */
export function clearStoredRedirectUrl(): void {
  try {
    sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear redirect URL:', error);
  }
}

/**
 * Builds an authentication URL with return parameter
 */
export function buildAuthUrl(authPage: string, returnUrl?: string): string {
  const baseUrl = authPage.startsWith('/') ? authPage : `/${authPage}`;

  if (!returnUrl) {
    return baseUrl;
  }

  // Validate and sanitize the return URL
  if (!isValidRedirectUrl(returnUrl)) {
    return baseUrl;
  }

  const sanitizedUrl = sanitizeRedirectUrl(returnUrl);
  const searchParams = new URLSearchParams();
  searchParams.set('redirect_url', sanitizedUrl);

  return `${baseUrl}?${searchParams.toString()}`;
}

/**
 * Gets the redirect URL from query parameters
 */
export function getRedirectUrlFromQuery(): string | null {
  try {
    if (typeof window === 'undefined') return null;

    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect_url');

    if (!redirectUrl) return null;

    // Validate the redirect URL
    if (isValidRedirectUrl(redirectUrl)) {
      return sanitizeRedirectUrl(redirectUrl);
    }

    return null;
  } catch (error) {
    console.warn('Failed to get redirect URL from query:', error);
    return null;
  }
}

/**
 * Determines the appropriate redirect URL after authentication
 */
export function getPostAuthRedirectUrl(currentPath?: string): string {
  // First check for stored redirect URL
  const storedUrl = getStoredRedirectUrl();
  if (storedUrl) {
    clearStoredRedirectUrl();
    return storedUrl;
  }

  // Check for URL in query parameters
  const queryUrl = getRedirectUrlFromQuery();
  if (queryUrl) {
    return queryUrl;
  }

  // Handle special route mappings
  if (currentPath && SPECIAL_ROUTE_MAPPINGS[currentPath]) {
    return SPECIAL_ROUTE_MAPPINGS[currentPath];
  }

  // Default fallback
  return DEFAULT_POST_AUTH_URL;
}

/**
 * Handles post-authentication redirect navigation
 */
export function handlePostAuthRedirect(): void {
  try {
    const redirectUrl = getPostAuthRedirectUrl(window.location.pathname);

    // Clear any stored redirect URL
    clearStoredRedirectUrl();

    // Perform the redirect
    if (redirectUrl !== window.location.pathname) {
      window.location.href = redirectUrl;
    }
  } catch (error) {
    console.warn('Failed to handle post-auth redirect:', error);
    // Fallback to default
    window.location.href = DEFAULT_POST_AUTH_URL;
  }
}

/**
 * Stores current location before redirecting to auth
 */
export function storeCurrentLocationAndRedirect(authPage: string): void {
  const currentUrl = window.location.pathname + window.location.search;
  storeRedirectUrl(currentUrl);

  const authUrl = buildAuthUrl(authPage);
  window.location.href = authUrl;
}

/**
 * Hook for handling redirects in React components
 */
export function useAuthRedirect() {
  const getCurrentRedirectUrl = () => getPostAuthRedirectUrl();

  const redirectToAuth = (authPage: string = 'sign-in') => {
    storeCurrentLocationAndRedirect(authPage);
  };

  const handleSuccessfulAuth = () => {
    handlePostAuthRedirect();
  };

  return {
    getCurrentRedirectUrl,
    redirectToAuth,
    handleSuccessfulAuth,
    storeRedirectUrl,
    clearStoredRedirectUrl,
  };
}

/**
 * Server-side utilities for Next.js middleware and API routes
 */
export const serverRedirectUtils = {
  /**
   * Validates redirect URL on server-side
   */
  isValidRedirectUrl: (url: string, origin: string): boolean => {
    try {
      const urlObj = new URL(url, origin);
      return urlObj.origin === origin;
    } catch {
      return false;
    }
  },

  /**
   * Builds auth redirect URL for middleware
   */
  buildAuthRedirect: (
    authPage: string,
    returnUrl: string,
    origin: string
  ): string => {
    const baseUrl = `${origin}/${authPage.replace(/^\//, '')}`;

    if (
      !returnUrl ||
      !serverRedirectUtils.isValidRedirectUrl(returnUrl, origin)
    ) {
      return baseUrl;
    }

    const searchParams = new URLSearchParams();
    searchParams.set('redirect_url', returnUrl);

    return `${baseUrl}?${searchParams.toString()}`;
  },

  /**
   * Extracts clean pathname for redirect URLs
   */
  getCleanPathname: (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      return url.split('?')[0] || '/';
    }
  },
};

// Export types for TypeScript
export interface RedirectConfig {
  defaultUrl: string;
  allowedOrigins: string[];
  specialMappings: Record<string, string>;
}

export interface RedirectHookReturn {
  getCurrentRedirectUrl: () => string;
  redirectToAuth: (authPage?: string) => void;
  handleSuccessfulAuth: () => void;
  storeRedirectUrl: (url: string) => void;
  clearStoredRedirectUrl: () => void;
}
