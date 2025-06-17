import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header with Authentication Status */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                ChatGPT Clone
              </h1>
            </div>

            {/* Authentication Section */}
            <div className="flex items-center space-x-4">
              <SignedOut>
                <Link
                  href="/sign-in"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </SignedOut>

              <SignedIn>
                <Link
                  href="/c/new"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  New Chat
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Welcome Section for Signed Out Users */}
          <SignedOut>
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
                Welcome to{' '}
                <span className="text-green-600">ChatGPT Clone</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
                Experience the power of AI-driven conversations. Sign up to start chatting with our advanced AI assistant.
              </p>

              {/* Features Grid */}
              <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="text-green-600 text-2xl mb-4">🤖</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI-Powered</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Powered by advanced language models for intelligent conversations
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="text-green-600 text-2xl mb-4">💬</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Natural Chat</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Engage in natural, flowing conversations on any topic
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="text-green-600 text-2xl mb-4">🔒</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Secure</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Your conversations are private and securely stored
                  </p>
                </div>
              </div>

              {/* Call to Action */}
              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/sign-up"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/sign-in"
                  className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-3 rounded-lg text-lg font-medium transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </SignedOut>

          {/* Welcome Section for Signed In Users */}
          <SignedIn>
            <div className="max-w-2xl mx-auto">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
                Welcome back!
              </h1>
              <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
                Ready to continue your AI conversations? Start a new chat or manage your account.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/c/new"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
                >
                  Start New Chat
                </Link>
                <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-3 rounded-lg text-lg font-medium transition-colors">
                  View Chat History
                </button>
              </div>

              {/* Auth Testing Info */}
              <div className="mt-12 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                  ✅ Authentication Test Successful
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  You are successfully signed in! The authentication flow is working correctly.
                </p>
                <div className="mt-4 text-left text-sm text-green-600 dark:text-green-400 space-y-1">
                  <p>• ✅ Sign-up flow completed</p>
                  <p>• ✅ Sign-in redirection working</p>
                  <p>• ✅ User button accessible</p>
                  <p>• ✅ Protected routes accessible</p>
                </div>
              </div>
            </div>
          </SignedIn>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2024 ChatGPT Clone. Built with Next.js, Clerk & OpenAI.</p>
            <div className="mt-4 space-x-4">
              <SignedOut>
                <span className="text-sm">Testing: Authentication flow verification</span>
              </SignedOut>
              <SignedIn>
                <span className="text-sm text-green-600 dark:text-green-400">
                  ✅ Authentication Active
                </span>
              </SignedIn>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
