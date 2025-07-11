/**
 * Sign-In Page with Sophisticated Redirect Logic
 *
 * This page handles the sign-in flow using Clerk authentication with ChatGPT-style design
 * and sophisticated redirect logic that remembers where users were trying to go.
 * The [[...sign-in]] catch-all route allows Clerk to handle all sign-in related routes and sub-routes.
 *
 * Routes handled:
 * - /sign-in
 * - /sign-in/verify-email-address
 * - /sign-in/factor-one
 * - /sign-in/factor-two
 * - And other Clerk-specific routes
 */

import { Suspense } from 'react';

import type { Metadata } from 'next';

import { SignInWithRedirect } from './sign-in-with-redirect';

export const metadata: Metadata = {
      title: 'Sign in to Aria',
    description:
      'Sign in to your Aria account and start conversing with AI',
};

export default function SignInPage() {
  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='text-center'>
        <h2 className='mb-2 text-2xl font-semibold text-black'>Welcome back</h2>
      </div>

      {/* Clerk SignIn Component with Redirect Handling */}
      <div>
        <Suspense
          fallback={
            <div className='flex items-center justify-center p-8'>
              <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-black'></div>
            </div>
          }
        >
          <SignInWithRedirect />
        </Suspense>
      </div>
    </div>
  );
}
