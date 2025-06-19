/**
 * Sign-Up Component with Redirect Handling
 *
 * This client-side component handles the sophisticated redirect logic
 * for the sign-up process, including URL parameters and stored destinations.
 */

'use client';

import { useEffect, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { SignUp } from '@clerk/nextjs';

import {
  getPostAuthRedirectUrl,
  storeRedirectUrl,
} from '@/lib/auth/redirect-utils';

export function SignUpWithRedirect() {
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
    <SignUp
      appearance={{
        elements: {
          // Main card styling
          card: 'bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-xl p-8',

          // Header styling
          headerTitle:
            'text-2xl font-semibold text-gray-900 dark:text-white text-center',
          headerSubtitle:
            'text-sm text-gray-600 dark:text-gray-400 text-center mt-2',

          // Form styling
          formButtonPrimary:
            'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-sm',
          formFieldInput:
            'block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 text-sm',
          formFieldLabel:
            'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2',

          // Social buttons styling
          socialButtonsBlockButton:
            'w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200',
          socialButtonsBlockButtonText: 'text-sm font-medium',

          // Links styling
          footerActionLink:
            'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm',

          // Divider styling
          dividerLine: 'border-gray-200 dark:border-gray-600',
          dividerText: 'text-gray-500 dark:text-gray-400 text-sm',

          // Error styling
          formFieldErrorText: 'text-red-600 dark:text-red-400 text-sm mt-1',

          // Loading styling
          formButtonPrimaryLoading: 'bg-blue-600 opacity-50 cursor-not-allowed',
        },
        layout: {
          socialButtonsPlacement: 'top',
          socialButtonsVariant: 'blockButton',
          showOptionalFields: false,
        },
        variables: {
          colorPrimary: '#2563eb', // blue-600
          colorBackground: 'transparent',
          colorInputBackground: 'transparent',
          colorInputText: '#374151', // gray-700
          colorText: '#374151', // gray-700
          colorTextSecondary: '#6b7280', // gray-500
          borderRadius: '0.75rem', // rounded-xl
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          fontSize: '0.875rem', // text-sm
          spacingUnit: '1rem',
        },
      }}
      // Use dynamic redirect URL
      redirectUrl={redirectUrl}
      afterSignUpUrl={redirectUrl}
      // Link to sign-in page with same redirect logic
      signInUrl={`/sign-in${searchParams.get('redirect_url') ? `?redirect_url=${encodeURIComponent(searchParams.get('redirect_url') || '')}` : ''}`}
    />
  );
}
