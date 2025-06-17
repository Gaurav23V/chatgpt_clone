/**
 * Sign-Up Page
 *
 * This page handles the sign-up flow using Clerk authentication with ChatGPT-style design.
 * The [[...sign-up]] catch-all route allows Clerk to handle all sign-up related routes and sub-routes.
 *
 * Routes handled:
 * - /sign-up
 * - /sign-up/verify-email-address
 * - /sign-up/continue
 * - And other Clerk-specific routes
 */

import { SignUp } from '@clerk/nextjs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create your ChatGPT Clone account',
  description: 'Sign up for ChatGPT Clone and start conversing with AI',
};

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Join ChatGPT Clone and start your AI conversations
        </p>
      </div>

      {/* CAPTCHA Widget for Bot Protection */}
      <div id="clerk-captcha" data-cl-theme="auto" data-cl-size="normal"></div>

      {/* Clerk SignUp Component with Custom Styling */}
      <div>
          <SignUp
            appearance={{
              elements: {
                // Main card styling
                card: "bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-xl p-8",

                // Header styling
                headerTitle: "text-2xl font-semibold text-gray-900 dark:text-white text-center",
                headerSubtitle: "text-sm text-gray-600 dark:text-gray-400 text-center mt-2",

                // Form styling
                formButtonPrimary: "bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-sm",
                formFieldInput: "block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-green-500 focus:ring-green-500 text-sm",
                formFieldLabel: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",

                // Social buttons styling
                socialButtonsBlockButton: "w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200",
                socialButtonsBlockButtonText: "text-sm font-medium",

                // Links styling
                footerActionLink: "text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium text-sm",

                // Divider styling
                dividerLine: "border-gray-200 dark:border-gray-600",
                dividerText: "text-gray-500 dark:text-gray-400 text-sm",

                // Error styling
                formFieldErrorText: "text-red-600 dark:text-red-400 text-sm mt-1",

                // Loading styling
                formButtonPrimaryLoading: "bg-green-600 opacity-50 cursor-not-allowed",
              },
              layout: {
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
                showOptionalFields: false,
              },
              variables: {
                colorPrimary: "#16a34a", // green-600
                colorBackground: "transparent",
                colorInputBackground: "transparent",
                colorInputText: "#374151", // gray-700
                colorText: "#374151", // gray-700
                colorTextSecondary: "#6b7280", // gray-500
                borderRadius: "0.75rem", // rounded-xl
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                fontSize: "0.875rem", // text-sm
                spacingUnit: "1rem",
              },
            }}
            // Redirect to new chat after successful sign-up
            redirectUrl="/c/new"
            // Link to sign-in page
            signInUrl="/sign-in"
            // Remove Clerk branding for cleaner look
            afterSignInUrl="/c/new"
            afterSignUpUrl="/c/new"
          />
      </div>
    </div>
  );
}
