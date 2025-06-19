import { Suspense } from 'react';

import type { Metadata } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';

import { ClerkProvider } from '@clerk/nextjs';

import { UserProvider } from '@/contexts/user-context';

import './globals.css';

/**
 * The root layout is wrapped with ClerkProvider so that every route and
 * component can access Clerk's authentication context (hooks, `<SignedIn />`
 * etc.). ClerkProvider automatically picks up the
 * `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` exposed to the browser—no need to pass
 * it manually. Placing the provider here keeps session management & JWT
 * refreshes consistent across the entire app.
 *
 * The UserProvider is nested inside ClerkProvider to extend Clerk's basic
 * authentication with app-specific user state management including preferences,
 * settings, and active conversation tracking.
 */

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ChatGPT Clone',
  description:
    'A ChatGPT-style conversational AI interface built with Next.js, Clerk & OpenAI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang='en'>
        <body
          className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <UserProvider>
            <Suspense
              fallback={<div className='py-6 text-center'>Loading...</div>}
            >
              {children}
            </Suspense>
          </UserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
