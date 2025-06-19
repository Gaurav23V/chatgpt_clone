# Authentication Guard Components Usage Guide

This guide demonstrates how to use the authentication guard components in your ChatGPT clone
application.

## Overview

The authentication guard components provide component-level protection beyond the route middleware.
They handle different protection levels, loading states, and smooth transitions for a better user
experience.

### Available Components

1. **AuthGuard** - Main authentication guard with full customization
2. **BasicAuthGuard** - Simple authentication check
3. **ChatAuthGuard** - Chat-specific guard with custom loading states
4. **ApiAuthGuard** - Lightweight guard for API call protection

## Installation

The components are already set up in your project. Import them from:

```tsx
import {
  AuthGuard,
  BasicAuthGuard,
  ChatAuthGuard,
  ApiAuthGuard,
  useApiAuth,
} from '@/components/auth';
```

## Usage Examples

### 1. BasicAuthGuard

Perfect for simple pages that just need to verify user authentication.

```tsx
// src/app/settings/page.tsx
import { BasicAuthGuard } from '@/components/auth';

export default function SettingsPage() {
  return (
    <BasicAuthGuard>
      <div className='p-6'>
        <h1 className='text-2xl font-bold'>User Settings</h1>
        <p>This content is only visible to authenticated users.</p>
      </div>
    </BasicAuthGuard>
  );
}
```

**Props:**

- `children`: React components to protect
- `redirectTo?`: Where to redirect unauthenticated users (default: `/sign-in`)
- `showLoading?`: Show loading state (default: `true`)
- `fallback?`: Custom component to show when not authenticated

### 2. ChatAuthGuard

Specialized for chat interfaces with chat-specific loading states.

```tsx
// src/app/(chat)/c/[id]/page.tsx
import { ChatAuthGuard } from '@/components/auth';
import { ChatInterface } from '@/components/chat';

export default function ChatPage() {
  return (
    <ChatAuthGuard showSidebar={true}>
      <ChatInterface />
    </ChatAuthGuard>
  );
}
```

**Props:**

- `children`: Chat components to protect
- `showSidebar?`: Whether to show sidebar in loading state (default: `true`)

### 3. ApiAuthGuard

Lightweight guard for components that make API calls.

```tsx
// src/components/user/UserProfile.tsx
import { ApiAuthGuard } from '@/components/auth';

function UserProfile() {
  return (
    <ApiAuthGuard
      onUnauthenticated={() => {
        console.log('User not authenticated, redirecting...');
        window.location.href = '/sign-in';
      }}
    >
      <ProfileData />
    </ApiAuthGuard>
  );
}
```

**Props:**

- `children`: Components to protect
- `onUnauthenticated?`: Callback when user is not authenticated
- `fallback?`: Custom fallback component
- `showMinimalLoading?`: Show minimal loading indicator (default: `true`)

### 4. AuthGuard (Advanced)

Main guard with full customization including role-based access control.

```tsx
// src/app/admin/page.tsx
import { AuthGuard } from '@/components/auth';

const CustomLoader = () => (
  <div className='flex h-screen items-center justify-center'>
    <div className='text-lg'>Loading admin panel...</div>
  </div>
);

export default function AdminPage() {
  return (
    <AuthGuard
      requireRole={['pro', 'enterprise']}
      redirectTo='/upgrade'
      loadingComponent={<CustomLoader />}
      showLoading={true}
    >
      <AdminPanel />
    </AuthGuard>
  );
}
```

**Props:**

- `children`: Components to protect
- `requireRole?`: Array of required user roles
- `redirectTo?`: Where to redirect unauthenticated users
- `showLoading?`: Show loading state (default: `true`)
- `fallback?`: Custom fallback component
- `loadingComponent?`: Custom loading component

## Hooks

### useApiAuth

Hook for checking authentication in components without UI guards.

```tsx
import { useApiAuth } from '@/components/auth';

function DataFetcher() {
  const { isSignedIn, getAuthToken, checkAuth } = useApiAuth();

  const fetchData = async () => {
    // Check authentication first
    const isAuth = await checkAuth();
    if (!isAuth) {
      console.log('Not authenticated');
      return;
    }

    // Get authentication token for API calls
    const token = await getAuthToken();
    if (!token) {
      console.log('No token available');
      return;
    }

    // Make authenticated API call
    try {
      const response = await fetch('/api/data', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error('API call failed:', error);
    }
  };

  return (
    <div>
      <button onClick={fetchData} disabled={!isSignedIn}>
        Fetch Data
      </button>
    </div>
  );
}
```

## Real-World Integration Examples

### Protecting the Chat Layout

```tsx
// src/app/(chat)/layout.tsx
import { ChatAuthGuard } from '@/components/auth';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatAuthGuard>
      <div className='flex h-screen bg-gray-50 dark:bg-gray-900'>
        {/* Sidebar */}
        <div className='hidden md:flex md:w-64 md:flex-col'>{/* Sidebar content */}</div>

        {/* Main content */}
        <div className='flex flex-1 flex-col overflow-hidden'>{children}</div>
      </div>
    </ChatAuthGuard>
  );
}
```

### Protecting API Routes Client-Side

```tsx
// src/components/chat/ChatInput.tsx
import { useState } from 'react';
import { useApiAuth } from '@/components/auth';

export function ChatInput() {
  const [message, setMessage] = useState('');
  const { isSignedIn, getAuthToken } = useApiAuth();

  const sendMessage = async () => {
    if (!isSignedIn) {
      alert('Please sign in to send messages');
      return;
    }

    const token = await getAuthToken();
    if (!token) {
      alert('Authentication failed');
      return;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      // Handle response
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className='flex gap-2'>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder='Type your message...'
        className='flex-1 rounded border p-2'
      />
      <button
        onClick={sendMessage}
        disabled={!isSignedIn || !message.trim()}
        className='rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50'
      >
        Send
      </button>
    </div>
  );
}
```

### Conditional Rendering Based on User Role

```tsx
// src/components/settings/SubscriptionPanel.tsx
import { AuthGuard } from '@/components/auth';

export function SubscriptionPanel() {
  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold'>Subscription Settings</h2>

      {/* Basic features for all authenticated users */}
      <div className='rounded border p-4'>
        <h3>Basic Features</h3>
        <p>Available to all users</p>
      </div>

      {/* Pro features */}
      <AuthGuard
        requireRole={['pro', 'enterprise']}
        fallback={
          <div className='rounded border bg-gray-50 p-4'>
            <h3>Pro Features</h3>
            <p>Upgrade to Pro to access these features</p>
            <button className='mt-2 rounded bg-blue-600 px-4 py-2 text-white'>
              Upgrade to Pro
            </button>
          </div>
        }
      >
        <div className='rounded border bg-green-50 p-4'>
          <h3>Pro Features</h3>
          <p>Advanced chat options, export features, etc.</p>
        </div>
      </AuthGuard>

      {/* Enterprise features */}
      <AuthGuard
        requireRole={['enterprise']}
        fallback={
          <div className='rounded border bg-gray-50 p-4'>
            <h3>Enterprise Features</h3>
            <p>Contact sales for enterprise access</p>
          </div>
        }
      >
        <div className='rounded border bg-purple-50 p-4'>
          <h3>Enterprise Features</h3>
          <p>Team management, advanced analytics, etc.</p>
        </div>
      </AuthGuard>
    </div>
  );
}
```

## Best Practices

1. **Choose the Right Guard**: Use the most specific guard for your use case

   - `BasicAuthGuard` for simple pages
   - `ChatAuthGuard` for chat interfaces
   - `ApiAuthGuard` for API-heavy components
   - `AuthGuard` for complex requirements

2. **Handle Loading States**: Always provide good loading experiences

   - Use skeleton screens for better perceived performance
   - Match loading states to your actual UI

3. **Graceful Fallbacks**: Provide meaningful fallback content

   - Clear messaging about why authentication is required
   - Easy access to sign-in/sign-up flows

4. **Performance**: Use guards efficiently

   - Don't wrap every small component individually
   - Consider guard placement for optimal re-renders

5. **Role-Based Access**: Plan your role hierarchy
   - Keep role checks consistent across components
   - Document role requirements clearly

## Troubleshooting

### Common Issues

1. **Guards not working**: Make sure ClerkProvider is set up in your root layout
2. **Infinite redirects**: Check that redirect URLs don't create loops
3. **Loading forever**: Verify Clerk configuration and environment variables
4. **Role checks failing**: Ensure user roles are properly set in Clerk metadata

### Testing Authentication Guards

```tsx
// Example test setup (if using Jest/Testing Library)
import { render, screen } from '@testing-library/react';
import { ClerkProvider } from '@clerk/nextjs';
import { BasicAuthGuard } from '@/components/auth';

// Mock Clerk hooks for testing
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
  }),
  useUser: () => ({
    user: { id: 'test-user' },
  }),
}));

test('renders protected content when authenticated', () => {
  render(
    <ClerkProvider>
      <BasicAuthGuard>
        <div>Protected Content</div>
      </BasicAuthGuard>
    </ClerkProvider>
  );

  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});
```

The authentication guard components are now ready to use throughout your ChatGPT clone application!
