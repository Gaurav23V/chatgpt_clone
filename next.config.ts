import type { NextConfig } from 'next';

/**
 * Production-ready Next.js configuration for ChatGPT Clone
 * Optimized for performance, security, and developer experience
 *
 * Configuration includes:
 * - React strict mode for better error catching
 * - Security headers (CSP, HSTS, etc.)
 * - Image optimization for multiple CDN providers
 * - TypeScript and ESLint optimizations
 * - Environment variable validation
 * - Performance optimizations
 */

const nextConfig: NextConfig = {
  // =============================================================================
  // REACT & DEVELOPMENT SETTINGS
  // =============================================================================

  /**
   * Enable React Strict Mode for better error detection and warnings
   * Helps identify unsafe lifecycles, legacy API usage, and other issues
   * Essential for production applications
   */
  reactStrictMode: true,

  /**
   * SWC minification is enabled by default in Next.js 15
   * No need to explicitly set this option
   */

  /**
   * Generate source maps in production for better debugging
   * Can be disabled if bundle size is a major concern
   */
  productionBrowserSourceMaps: true,

  /**
   * Disable the "Powered by Next.js" header for security
   * Reduces information disclosure about the tech stack
   */
  poweredByHeader: false,

  // =============================================================================
  // TYPESCRIPT & ESLINT CONFIGURATION
  // =============================================================================

  /**
   * TypeScript configuration for better type checking
   */
  typescript: {
    // Fail the build on type errors in production
    ignoreBuildErrors: false,
  },

  /**
   * ESLint configuration for code quality
   */
  eslint: {
    // Fail the build on linting errors in production
    ignoreDuringBuilds: false,
    // Lint all directories, not just pages
    dirs: ['src', 'components', 'lib', 'utils'],
  },

  // =============================================================================
  // IMAGE OPTIMIZATION
  // =============================================================================

  /**
   * Image optimization configuration
   * Supports multiple CDN providers for flexibility
   */
  images: {
    // Enable modern image formats for better performance
    formats: ['image/webp', 'image/avif'],

    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // Image sizes for different viewport widths
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Cache optimized images for 60 days
    minimumCacheTTL: 5184000,

    // Allowed external image domains
    remotePatterns: [
      // Cloudinary CDN
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      // Uploadcare CDN
      {
        protocol: 'https',
        hostname: 'ucarecdn.com',
        pathname: '/**',
      },
      // Additional CDN patterns can be added here
      {
        protocol: 'https',
        hostname: '*.vercel.app',
        pathname: '/**',
      },
    ],

    // Disable static image imports optimization to reduce build size
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // =============================================================================
  // SECURITY HEADERS
  // =============================================================================

  /**
   * Security headers configuration
   * Implements comprehensive security measures
   */
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          // Content Security Policy - Prevents XSS and injection attacks
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://ucarecdn.com https://*.vercel.app",
              "connect-src 'self' https://api.openai.com https://vercel.live wss://ws.pusher.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              'upgrade-insecure-requests',
            ].join('; '),
          },

          // Strict Transport Security - Forces HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },

          // X-Frame-Options - Prevents clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },

          // X-Content-Type-Options - Prevents MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },

          // Referrer Policy - Controls referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },

          // X-DNS-Prefetch-Control - Controls DNS prefetching
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },

          // Permissions Policy - Controls browser features
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'interest-cohort=()',
              'browsing-topics=()',
            ].join(', '),
          },

          // Cross-Origin Opener Policy - Prevents certain cross-origin attacks
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },

          // Cross-Origin Resource Policy - Controls cross-origin resource sharing
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },

      // API Routes specific headers
      {
        source: '/api/(.*)',
        headers: [
          // CORS headers for API routes
          {
            key: 'Access-Control-Allow-Origin',
            value:
              process.env.NODE_ENV === 'development'
                ? '*'
                : 'https://yourdomain.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ];
  },

  // =============================================================================
  // PERFORMANCE OPTIMIZATIONS
  // =============================================================================

  /**
   * Enable gzip compression for better performance
   */
  compress: true,

  /**
   * optimizePackageImports is moved to experimental in Next.js 15
   * See experimental section below
   */

  /**
   * Transpile specific packages for better compatibility
   */
  transpilePackages: [
    // Add packages that need to be transpiled
    // 'some-es6-package',
  ],

  /**
   * Bundle external packages for better performance
   * Reduces the number of requests and improves cold start times
   */
  bundlePagesRouterDependencies: true,

  /**
   * Configure external packages that should not be bundled
   * Useful for packages that have issues when bundled
   */
  serverExternalPackages: [
    // Add packages that should remain external
    // 'some-native-package',
  ],

  // =============================================================================
  // REDIRECTS & REWRITES
  // =============================================================================

  /**
   * URL redirects for better SEO and user experience
   */
  async redirects() {
    return [
      // Redirect old URLs to new ones
      {
        source: '/chat',
        destination: '/',
        permanent: true,
      },
      // Add more redirects as needed
    ];
  },

  /**
   * URL rewrites for API proxying and cleaner URLs
   */
  async rewrites() {
    return [
      // Proxy API requests to external services
      {
        source: '/api/proxy/openai/:path*',
        destination: 'https://api.openai.com/:path*',
      },
      // Add more rewrites as needed
    ];
  },

  // =============================================================================
  // ENVIRONMENT & DEPLOYMENT
  // =============================================================================

  /**
   * Environment variables configuration
   * Only variables with NEXT_PUBLIC_ prefix are exposed to the client
   */
  env: {
    // Custom environment variables can be defined here
    CUSTOM_BUILD_TIME: new Date().toISOString(),
  },

  /**
   * Generate a unique build ID for cache busting
   * Useful for deployments and CDN cache invalidation
   */
  generateBuildId: async () => {
    // Use git commit hash if available, otherwise use timestamp
    try {
      const { execSync } = require('child_process');
      return execSync('git rev-parse HEAD').toString().trim();
    } catch {
      return `build-${Date.now()}`;
    }
  },

  /**
   * Output configuration for different deployment scenarios
   * - standalone: For Docker containers and serverless functions
   * - export: For static site generation
   */
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,

  /**
   * Trailing slash configuration
   * Set to false for cleaner URLs
   */
  trailingSlash: false,

  // =============================================================================
  // EXPERIMENTAL FEATURES
  // =============================================================================

  /**
   * Experimental features for enhanced functionality
   * These features may change in future versions
   */
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },

  /**
   * Turbopack configuration (stable in Next.js 15)
   * Provides faster builds and better performance
   */
  turbopack: {
    rules: {
      '*.svg': ['@svgr/webpack'],
    },
  },

  // =============================================================================
  // WEBPACK CUSTOMIZATION
  // =============================================================================

  /**
   * Custom webpack configuration for advanced optimization
   */
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add custom webpack plugins and loaders

    // Handle SVG files as React components
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Optimize bundle size by ignoring moment.js locales
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      })
    );

    // Add bundle analyzer in development
    if (dev && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        })
      );
    }

    return config;
  },
};

export default nextConfig;
