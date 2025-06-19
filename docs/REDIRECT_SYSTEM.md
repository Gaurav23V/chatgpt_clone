# Sophisticated Redirect System

This document explains the sophisticated redirect system that remembers where users were trying to
go before authentication and returns them there afterward.

## Overview

The redirect system provides seamless authentication flows by:

- **Storing intended destinations** before redirecting to auth pages
- **Validating URLs** to prevent open redirect vulnerabilities
- **Handling edge cases** like special routes and invalid URLs
- **Integrating with middleware** for automatic redirect parameter injection
- **Supporting both server and client-side** redirect handling

## Core Components

### 1. Redirect Utilities (`src/lib/auth/redirect-utils.ts`)

The core utility functions that handle all redirect logic:

```typescript
// Store current location before auth
storeRedirectUrl(url: string): void

// Retrieve stored redirect URL
getStoredRedirectUrl(): string | null

// Clear stored redirect URL
clearStoredRedirectUrl(): void

// Build auth URL with return parameter
buildAuthUrl(authPage: string, returnUrl?: string): string

// Handle post-auth navigation
handlePostAuthRedirect(): void

// Store current location and redirect to auth
storeCurrentLocationAndRedirect(authPage: string): void
```

### 2. Security Features

#### URL Validation

```typescript
// Validates URLs are internal and safe
isValidRedirectUrl(url: string): boolean

// Sanitizes URLs by removing dangerous parameters
sanitizeRedirectUrl(url: string): string
```

#### Allowed Origins

```typescript
const ALLOWED_ORIGINS = [
  'localhost:3000',
  'localhost:3001',
  // Add your production domains here
];
```

#### Blocked Paths

```typescript
const blockedPaths = ['/api/webhooks', '/api/auth', '/_next', '/admin/system'];
```

### 3. Middleware Integration

The middleware automatically includes return URLs in auth redirects:

```typescript
// src/middleware.ts
import { serverRedirectUtils } from '@/lib/auth/redirect-utils';

// Builds secure redirect URLs
const redirectUrl = serverRedirectUtils.buildAuthRedirect('sign-in', currentPath, origin);
```

### 4. Auth Page Integration

Both sign-in and sign-up pages handle redirect parameters:

```typescript
// src/app/(auth)/sign-in/[[...sign-in]]/sign-in-with-redirect.tsx
const queryRedirectUrl = searchParams.get('redirect_url');

if (queryRedirectUrl) {
  storeRedirectUrl(queryRedirectUrl);
  setRedirectUrl(queryRedirectUrl);
}
```

## Usage Examples

### 1. Basic Usage in Components

```typescript
import { useAuthRedirect } from '@/lib/auth/redirect-utils';

function ProtectedComponent() {
  const { redirectToAuth } = useAuthRedirect();

  const handleSignInRequired = () => {
    redirectToAuth('sign-in'); // Stores current location and redirects
  };

  return (
    <button onClick={handleSignInRequired}>
      Sign In Required
    </button>
  );
}
```

### 2. Manual Redirect Handling

```typescript
import { storeRedirectUrl, buildAuthUrl, handlePostAuthRedirect } from '@/lib/auth/redirect-utils';

// Store specific URL for after auth
storeRedirectUrl('/chat/important-conversation');

// Build auth URL with return parameter
const authUrl = buildAuthUrl('sign-in', '/dashboard');

// Handle post-auth redirect (usually in auth callbacks)
handlePostAuthRedirect();
```

### 3. Server-Side Redirect Building

```typescript
import { serverRedirectUtils } from '@/lib/auth/redirect-utils';

// In middleware or API routes
const authRedirect = serverRedirectUtils.buildAuthRedirect(
  'sign-in',
  '/protected-page',
  'https://yourdomain.com'
);
```

## Flow Examples

### 1. User Visits Protected Chat

```
1. User visits: /c/abc123 (protected chat)
2. Middleware detects unauthenticated user
3. Middleware redirects to: /sign-in?redirect_url=%2Fc%2Fabc123
4. Sign-in page stores /c/abc123 in sessionStorage
5. User completes authentication
6. Clerk redirects to stored URL: /c/abc123
7. User continues where they left off
```

### 2. User Clicks "New Chat" While Logged Out

```
1. User visits: /c/new (special route)
2. Middleware maps /c/new → /chat (better default)
3. Middleware redirects to: /sign-in?redirect_url=%2Fchat
4. After auth, user goes to /chat instead of /c/new
```

### 3. Auth Guard Component Usage

```typescript
// Component automatically handles redirect
<AuthGuard>
  <ProtectedContent />
</AuthGuard>

// Guard fallback includes redirect logic
<ChatAuthGuard>
  <ChatInterface />
</ChatAuthGuard>
```

## Special Route Mappings

Some routes are mapped to better defaults after authentication:

```typescript
const SPECIAL_ROUTE_MAPPINGS = {
  '/c/new': '/chat', // New chat → chat home
  '/': '/chat', // Home → chat home
  '/sign-in': '/chat', // Sign-in → chat home
  '/sign-up': '/chat', // Sign-up → chat home
};
```

## Security Considerations

### 1. Open Redirect Prevention

```typescript
// Only internal URLs are allowed
if (urlObj.origin !== window.location.origin) {
  return false;
}

// Hostname validation for dev/staging
if (!ALLOWED_ORIGINS.includes(hostWithPort)) {
  return false;
}
```

### 2. Path Blocking

```typescript
// Dangerous paths are blocked
const blockedPaths = ['/api/webhooks', '/api/auth', '/_next', '/admin/system'];
```

### 3. Parameter Sanitization

```typescript
// Dangerous parameters are removed
const dangerousParams = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
```

## Error Handling

The system includes comprehensive error handling:

```typescript
// Graceful fallbacks
try {
  storeRedirectUrl(url);
} catch (error) {
  console.warn('Failed to store redirect URL:', error);
}

// Default redirects on failure
return DEFAULT_POST_AUTH_URL; // '/chat'
```

## Best Practices

1. **Always validate URLs** before storing or redirecting
2. **Use special route mappings** for better UX
3. **Handle errors gracefully** with fallback URLs
4. **Clear stored URLs** after successful redirect
5. **Test edge cases** like external URLs and blocked paths
6. **Consider mobile users** who might have different navigation patterns
7. **Log redirect attempts** for security monitoring

The sophisticated redirect system ensures users never lose their intended destination while
maintaining security against redirect-based attacks.
