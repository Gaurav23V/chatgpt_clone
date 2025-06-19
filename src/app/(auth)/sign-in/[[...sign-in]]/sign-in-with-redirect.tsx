/**
 * Sign-In Component with Redirect Handling
 *
 * This client-side component handles the sophisticated redirect logic
 * for the sign-in process, including URL parameters and stored destinations.
 */

'use client';

import { useEffect, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { SignIn } from '@clerk/nextjs';

import {
  getPostAuthRedirectUrl,
  storeRedirectUrl,
} from '@/lib/auth/redirect-utils';

export function SignInWithRedirect() {
  const searchParams = useSearchParams();
  const [redirectUrl, setRedirectUrl] = useState<string>('/chat');

  useEffect(() => {
    // Get redirect URL from query parameter
    const queryRedirectUrl = searchParams.get('redirect_url');

    if (queryRedirectUrl) {
      // Store the redirect URL for after authentication
      storeRedirectUrl(queryRedirectUrl);
      setRedirectUrl(queryRedirectUrl);
    } else {
      // Check if there's already a stored redirect URL
      const storedUrl = getPostAuthRedirectUrl();
      setRedirectUrl(storedUrl);
    }
  }, [searchParams]);

  return (
    <SignIn
      appearance={{
        elements: {
          // Remove card styling for seamless integration
          card: 'bg-transparent shadow-none border-none p-0',

          // Header styling (hidden since we have our own)
          header: 'hidden',
          headerTitle: 'hidden',
          headerSubtitle: 'hidden',

          // Form styling to match v0's design
          formButtonPrimary:
            'w-full h-12 bg-black text-white rounded-md hover:bg-gray-800 font-medium transition-colors duration-200',

          // Input styling to match v0's design
          formFieldInput:
            'w-full h-12 px-4 border border-gray-300 rounded-md focus:border-green-500 focus:ring-1 focus:ring-green-500 text-base',

          formFieldLabel: 'sr-only', // Hide labels for cleaner look

          // Social buttons styling to match v0's design
          socialButtonsBlockButton:
            'w-full h-12 border border-gray-300 rounded-md hover:bg-gray-50 font-medium flex items-center justify-center space-x-2',
          socialButtonsBlockButtonText: 'text-base font-medium',

          // Links styling to match v0's green theme
          footerActionLink:
            'text-green-600 text-sm font-medium hover:underline',

          // Divider styling
          dividerLine: 'border-gray-300',
          dividerText: 'px-2 bg-white text-gray-500 text-sm',

          // Error styling
          formFieldErrorText: 'text-red-600 text-sm mt-1',

          // Remove extra spacing
          footer: 'mt-4',
          socialButtons: 'space-y-3',
          formContainer: 'space-y-4',
        },
        layout: {
          socialButtonsPlacement: 'bottom',
          socialButtonsVariant: 'blockButton',
          showOptionalFields: false,
        },
        variables: {
          colorPrimary: '#000000',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#000000',
          colorText: '#000000',
          colorTextSecondary: '#6b7280',
          borderRadius: '0.375rem',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: '1rem',
          spacingUnit: '1rem',
        },
      }}
      // Use dynamic redirect URL
      redirectUrl={redirectUrl}
      afterSignInUrl={redirectUrl}
      // Link to sign-up page with same redirect logic
      signUpUrl={`/sign-up${searchParams.get('redirect_url') ? `?redirect_url=${encodeURIComponent(searchParams.get('redirect_url') || '')}` : ''}`}
    />
  );
}
