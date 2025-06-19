/**
 * Sign-Up Page with Sophisticated Redirect Logic
 *
 * This page handles the sign-up flow using Clerk authentication with ChatGPT-style design
 * and sophisticated redirect logic that remembers where users were trying to go.
 * The [[...sign-up]] catch-all route allows Clerk to handle all sign-up related routes and sub-routes.
 *
 * Routes handled:
 * - /sign-up
 * - /sign-up/verify-email-address
 * - /sign-up/continue
 * - And other Clerk-specific routes
 */

import { Suspense } from 'react';

import type { Metadata } from 'next';

import { SignUpWithRedirect } from './sign-up-with-redirect';

export const metadata: Metadata = {
  title: 'Create your ChatGPT Clone account',
  description: 'Sign up for ChatGPT Clone and start conversing with AI',
};

export default function SignUpPage() {
  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='text-center'>
        <h2 className='text-2xl font-semibold tracking-tight text-gray-900 dark:text-white'>
          Create your account
        </h2>
        <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
          Join ChatGPT Clone and start your AI conversations
        </p>
      </div>

      {/* CAPTCHA Widget for Bot Protection */}
      <div id='clerk-captcha' data-cl-theme='auto' data-cl-size='normal'></div>

      {/* Clerk SignUp Component with Redirect Handling */}
      <div>
        <Suspense
          fallback={
            <div className='flex items-center justify-center p-8'>
              <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
            </div>
          }
        >
          <SignUpWithRedirect />
        </Suspense>
      </div>
    </div>
  );
}
