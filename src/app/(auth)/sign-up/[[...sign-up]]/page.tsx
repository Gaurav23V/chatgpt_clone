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
      title: 'Create your Aria account',
    description: 'Sign up for Aria and start conversing with AI',
};

export default function SignUpPage() {
  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='text-center'>
        <h2 className='mb-2 text-2xl font-semibold text-black'>
          Create an account
        </h2>
      </div>

      {/* Clerk SignUp Component with Redirect Handling */}
      <div>
        <Suspense
          fallback={
            <div className='flex items-center justify-center p-8'>
              <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-black'></div>
            </div>
          }
        >
          <SignUpWithRedirect />
        </Suspense>
      </div>
    </div>
  );
}
