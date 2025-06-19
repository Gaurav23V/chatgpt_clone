# Protected Page Wrapper

A comprehensive authentication wrapper for pages requiring user authentication, providing consistent
loading states, error handling, and development tools.

## Overview

The `ProtectedPageWrapper` component combines route protection with proper loading and error states,
creating a seamless experience for protected pages in your application.

## Features

- ✅ **Route Protection**: Automatic authentication checks with configurable requirements
- ✅ **Loading States**: Multiple loading variants including ChatGPT-style skeletons
- ✅ **Error Handling**: Integrated error boundary with recovery strategies
- ✅ **Development Tools**: Visual debugging indicators and performance timing
- ✅ **SEO-Friendly**: Proper metadata handling even for protected content
- ✅ **Smooth Transitions**: Configurable transition durations between states
- ✅ **Role-Based Access**: Support for different protection levels and role requirements

## Basic Usage

```tsx
import { ProtectedPageWrapper } from '@/components/auth';

export default function MyProtectedPage() {
  return (
    <ProtectedPageWrapper>
      <div>Your protected content here</div>
    </ProtectedPageWrapper>
  );
}
```

## Configuration Options

### Auth Requirements

```tsx
<ProtectedPageWrapper
  requirements={{
    level: 'chat', // 'basic' | 'chat' | 'premium' | 'admin'
    requireVerified: true, // Require email verification
    requireComplete: true, // Require complete profile
    requireRole: ['user', 'premium'], // Required user roles
  }}
>
  {/* Your content */}
</ProtectedPageWrapper>
```

### Loading Variants

```tsx
<ProtectedPageWrapper
  loadingVariant='chat' // 'skeleton' | 'spinner' | 'chat' | 'minimal'
>
  {/* Your content */}
</ProtectedPageWrapper>
```

### Custom Loading Component

```tsx
<ProtectedPageWrapper loadingComponent={<MyCustomLoader />}>
  {/* Your content */}
</ProtectedPageWrapper>
```

## Protection Levels

### Basic Protection

```tsx
requirements={{ level: 'basic' }}
```

- Requires authentication
- No additional requirements

### Chat Protection

```tsx
requirements={{ level: 'chat' }}
```

- Requires authentication
- Optimized for chat interfaces
- Includes chat-specific loading states

### Premium Protection

```tsx
requirements={{ level: 'premium' }}
```

- Requires authentication
- Checks for premium role/subscription
- Enhanced features access

### Admin Protection

```tsx
requirements={{ level: 'admin' }}
```

- Requires authentication
- Admin role verification
- Highest security level

## Loading Variants

### Skeleton Loading

```tsx
loadingVariant = 'skeleton';
```

- General-purpose skeleton screens
- Maintains layout structure
- Animated placeholders

### Chat Loading

```tsx
loadingVariant = 'chat';
```

- Chat-specific skeleton
- Includes sidebar, messages, and input areas
- Perfect for chat pages

### Spinner Loading

```tsx
loadingVariant = 'spinner';
```

- Standard loading spinner
- Minimal UI disruption
- Good for quick transitions

### Minimal Loading

```tsx
loadingVariant = 'minimal';
```

- Bare minimum loading indicator
- Fastest to render
- Best performance

## Error Handling

### Error Boundary Integration

```tsx
<ProtectedPageWrapper enableErrorBoundary={true} errorFallback={<MyErrorComponent />}>
  {/* Your content */}
</ProtectedPageWrapper>
```

### Custom Error Fallback

```tsx
const errorFallback = (error: AuthError, context: AuthErrorContext) => (
  <div>Custom error handling for {error.type}</div>
);

<ProtectedPageWrapper errorFallback={errorFallback}>{/* Your content */}</ProtectedPageWrapper>;
```

## Development Features

### Development Tools

```tsx
<ProtectedPageWrapper
  enableDevTools={true} // Shows debug panel in development
>
  {/* Your content */}
</ProtectedPageWrapper>
```

The dev tools display:

- Authentication status
- Protection level
- User information
- Performance timing
- Error states

### Performance Timing

```tsx
<ProtectedPageWrapper enableDevTools={true} showLoadingProgress={true}>
  {/* Your content */}
</ProtectedPageWrapper>
```

## Advanced Configuration

### Complete Example

```tsx
export default function AdvancedProtectedPage() {
  return (
    <ProtectedPageWrapper
      requirements={{
        level: 'premium',
        requireVerified: true,
        requireComplete: true,
        requireRole: ['premium', 'vip'],
      }}
      loadingVariant='chat'
      enableErrorBoundary={true}
      enableDevTools={process.env.NODE_ENV === 'development'}
      pageTitle='Premium Chat'
      pageDescription='Premium chat features'
      className='min-h-screen'
      showLoadingProgress={true}
      transitionDuration={300}
    >
      <PremiumChatInterface />
    </ProtectedPageWrapper>
  );
}
```

### HOC Pattern

```tsx
import { withProtectedPage } from '@/components/auth';

const MyPage = () => <div>Protected content</div>;

export default withProtectedPage(MyPage, {
  requirements: { level: 'chat' },
  loadingVariant: 'skeleton',
});
```

## SEO Considerations

### Metadata Handling

```tsx
// In your page component
export const metadata = {
  title: 'Protected Page | Your App',
  description: 'Protected content description',
  robots: {
    index: false, // Don't index protected content
    follow: false,
  },
};
```

### Dynamic Metadata

```tsx
export async function generateMetadata({ params }) {
  return {
    title: `Chat ${params.id} | Your App`,
    description: `Continue your conversation`,
    robots: { index: false, follow: false },
  };
}
```

## Integration Examples

### Chat Page Integration

```tsx
// src/app/(chat)/c/[id]/page.tsx
import { ProtectedPageWrapper } from '@/components/auth';

export default async function ChatPage({ params }) {
  const { id } = await params;

  return (
    <ProtectedPageWrapper
      requirements={{ level: 'chat' }}
      loadingVariant='chat'
      pageTitle={`Chat ${id}`}
      className='h-full'
    >
      <ChatInterface chatId={id} />
    </ProtectedPageWrapper>
  );
}
```

### Admin Dashboard

```tsx
// src/app/admin/page.tsx
import { ProtectedPageWrapper } from '@/components/auth';

export default function AdminDashboard() {
  return (
    <ProtectedPageWrapper
      requirements={{
        level: 'admin',
        requireVerified: true,
        requireRole: ['admin', 'moderator'],
      }}
      loadingVariant='skeleton'
      enableErrorBoundary={true}
    >
      <AdminDashboardContent />
    </ProtectedPageWrapper>
  );
}
```

### Premium Features

```tsx
// src/app/premium/page.tsx
import { ProtectedPageWrapper } from '@/components/auth';

export default function PremiumPage() {
  return (
    <ProtectedPageWrapper
      requirements={{
        level: 'premium',
        requireRole: ['premium', 'pro'],
      }}
      loadingVariant='skeleton'
      errorFallback={<UpgradePrompt />}
    >
      <PremiumFeatures />
    </ProtectedPageWrapper>
  );
}
```

## Error Scenarios

### Authentication Failures

- **Not Authenticated**: Redirects to sign-in page
- **Insufficient Permissions**: Shows access denied message
- **Unverified Email**: Shows verification prompt
- **Incomplete Profile**: Shows profile completion form

### Network Errors

- **Connection Issues**: Shows retry options
- **API Failures**: Shows error boundary with recovery
- **Timeout**: Automatic retry with exponential backoff

## Performance Considerations

### Loading Optimization

- Skeleton screens maintain layout stability
- Progressive loading reduces perceived wait time
- Transition animations provide smooth experience

### Bundle Size

- Tree-shakeable exports
- Lazy loading for heavy components
- Minimal runtime overhead

### Caching

- Authentication state caching
- Component-level memoization
- Efficient re-renders

## Best Practices

### 1. Choose Appropriate Loading Variants

```tsx
// For chat pages
<ProtectedPageWrapper loadingVariant="chat" />

// For general pages
<ProtectedPageWrapper loadingVariant="skeleton" />

// For quick actions
<ProtectedPageWrapper loadingVariant="minimal" />
```

### 2. Set Proper Protection Levels

```tsx
// Match protection to content sensitivity
<ProtectedPageWrapper requirements={{ level: 'admin' }} />  // Admin only
<ProtectedPageWrapper requirements={{ level: 'basic' }} />  // Any authenticated user
```

### 3. Handle Error States

```tsx
// Provide meaningful error fallbacks
<ProtectedPageWrapper errorFallback={<UserFriendlyError />} enableErrorBoundary={true} />
```

### 4. Optimize for Development

```tsx
// Enable dev tools during development
<ProtectedPageWrapper
  enableDevTools={process.env.NODE_ENV === 'development'}
  showLoadingProgress={true}
/>
```

### 5. SEO-Friendly Configuration

```tsx
// Always set robots meta for protected content
export const metadata = {
  robots: { index: false, follow: false },
};
```

## Troubleshooting

### Common Issues

1. **Infinite Loading**: Check authentication configuration
2. **Flash of Content**: Ensure proper loading states
3. **Dev Tools Not Showing**: Verify NODE_ENV is 'development'
4. **Error Boundary Not Catching**: Check error boundary configuration

### Debug Mode

Enable debug mode in development:

```tsx
<ProtectedPageWrapper enableDevTools={true} />
```

This shows:

- Authentication status
- Loading timing
- Error states
- Configuration details

## Migration Guide

### From Manual Auth Checks

```tsx
// Before
const { isLoaded, isSignedIn } = useAuth();
if (!isLoaded) return <Spinner />;
if (!isSignedIn) redirect('/sign-in');

// After
<ProtectedPageWrapper loadingVariant='spinner'>{/* Your content */}</ProtectedPageWrapper>;
```

### From Basic Auth Guards

```tsx
// Before
<AuthGuard>
  <YourComponent />
</AuthGuard>

// After
<ProtectedPageWrapper requirements={{ level: 'basic' }}>
  <YourComponent />
</ProtectedPageWrapper>
```

## TypeScript Support

### Full Type Definitions

```tsx
import type {
  ProtectedPageWrapperProps,
  AuthRequirements,
  ProtectionLevel,
  LoadingVariant,
} from '@/components/auth';
```

### Custom Requirements

```tsx
interface CustomAuthRequirements extends AuthRequirements {
  customCheck?: boolean;
}
```

## Contributing

When adding new features:

1. Update the component props interface
2. Add corresponding loading states
3. Update documentation
4. Add tests for new functionality
5. Consider performance implications

## Related Components

- [`AuthErrorBoundary`](./AUTH_ERROR_HANDLING.md) - Error boundary integration
- [`ChatPageSkeleton`](./LOADING_STATES.md) - Loading state components
- [`AuthGuard`](./AUTH_GUARDS_USAGE.md) - Basic authentication guards
