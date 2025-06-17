# ChatGPT Clone

This is a production-ready ChatGPT clone built with Next.js 15, featuring comprehensive security,
performance optimizations, and modern best practices.

## 🚀 Features

- **Production-Ready Configuration**: Comprehensive Next.js configuration with security headers,
  image optimization, and performance optimizations
- **Security First**: CSP headers, HSTS, XSS protection, and more security measures
- **Modern Stack**: Next.js 15, React 19, TypeScript, and Tailwind CSS
- **Image Optimization**: Support for Cloudinary, Uploadcare, and other CDN providers
- **Performance Optimized**: SWC minification, bundle analysis, and tree-shaking optimizations
- **Developer Experience**: ESLint, TypeScript strict mode, and comprehensive error handling

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Configuration](#configuration)
- [Security](#security)
- [Performance](#performance)
- [Deployment](#deployment)
- [Development](#development)

## 🛠 Getting Started

### Prerequisites

- Node.js 18.18.0 or later
- npm, yarn, or pnpm

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd chatgpt-clone
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create environment variables file:

```bash
cp .env.example .env.local
```

4. Fill in your environment variables in `.env.local`

5. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🔐 Environment Variables

### Server-Side Variables (Secure)

These variables are only accessible on the server side:

```env
# API Keys
OPENAI_API_KEY=sk-your-openai-api-key
DATABASE_URL=postgresql://username:password@localhost:5432/chatgpt_clone
NEXTAUTH_SECRET=your-super-secret-nextauth-secret-here

# CDN Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

UPLOADCARE_PUBLIC_KEY=your-uploadcare-public-key
UPLOADCARE_SECRET_KEY=your-uploadcare-secret-key
```

### Client-Side Variables (Public)

These variables are exposed to the browser (prefixed with `NEXT_PUBLIC_`):

```env
# Application Configuration
NEXT_PUBLIC_APP_NAME=ChatGPT Clone
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHAT_HISTORY=true
```

## ⚙️ Configuration

### Next.js Configuration

The `next.config.ts` file includes comprehensive production-ready settings:

#### React & Development

- **React Strict Mode**: Enabled for better error detection
- **SWC Minification**: Faster builds and smaller bundles
- **Source Maps**: Enabled for production debugging

#### Security Headers

- **Content Security Policy (CSP)**: Prevents XSS attacks
- **Strict Transport Security (HSTS)**: Forces HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **Permissions Policy**: Controls browser features

#### Image Optimization

- **Modern Formats**: WebP and AVIF support
- **CDN Support**: Cloudinary, Uploadcare, and Vercel
- **Responsive Images**: Optimized for different device sizes

#### Performance

- **Bundle Optimization**: Tree-shaking and code splitting
- **Compression**: Gzip compression enabled
- **Caching**: Optimized caching headers

### TypeScript Configuration

- Strict type checking enabled
- Build fails on type errors
- Comprehensive type coverage

### ESLint Configuration

- Strict linting rules
- Accessibility checks included
- Build fails on lint errors

## 🔒 Security

### Security Headers

The application implements comprehensive security headers:

- **Content Security Policy**: Prevents XSS and injection attacks
- **Strict Transport Security**: Forces HTTPS connections
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Referrer Policy**: Controls referrer information

### Best Practices

- Environment variables properly secured
- API routes protected with CORS
- Input validation and sanitization
- Secure cookie configuration

## ⚡ Performance

### Optimization Features

- **SWC Minification**: 17x faster than Babel
- **Image Optimization**: Automatic WebP/AVIF conversion
- **Bundle Analysis**: `npm run analyze` for bundle insights
- **Tree Shaking**: Removes unused code
- **Code Splitting**: Automatic route-based splitting

### Bundle Analysis

Run bundle analysis to identify optimization opportunities:

```bash
npm run analyze
```

### Performance Monitoring

- Core Web Vitals tracking
- Lighthouse integration recommended
- Production performance monitoring

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker/Standalone

Build for standalone deployment:

```bash
npm run build:standalone
```

### Environment-Specific Builds

- Development: `npm run dev`
- Production: `npm run build && npm start`
- Analysis: `npm run analyze`

### Security Checklist

- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] Security headers verified
- [ ] API endpoints secured
- [ ] Input validation implemented

## 🔧 Development

### Available Scripts

- `npm run dev`: Start development server with Turbopack
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run analyze`: Analyze bundle size
- `npm run build:standalone`: Build for standalone deployment

### Development Tools

- **Turbopack**: Faster development builds
- **ESLint**: Code quality and consistency
- **TypeScript**: Type safety and better DX
- **Bundle Analyzer**: Bundle size optimization

### Code Quality

- TypeScript strict mode enabled
- ESLint with accessibility rules
- Prettier integration recommended
- Pre-commit hooks recommended

## 📦 Dependencies

### Production Dependencies

- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type safety and better development experience

### Development Dependencies

- **@svgr/webpack**: SVG as React components
- **webpack-bundle-analyzer**: Bundle analysis
- **ESLint**: Code linting and quality
- **Tailwind CSS**: Utility-first CSS framework

## 🔒 Branch Protection Rules

When setting up this repository on GitHub, consider implementing the following branch protection rules for the `main` branch:

### Recommended Settings:
- **Require pull request reviews before merging**: ✅ Enabled
  - Required number of reviewers: 1
  - Dismiss stale reviews when new commits are pushed: ✅ Enabled
  - Require review from code owners: ✅ Enabled (if CODEOWNERS file exists)

- **Require status checks to pass before merging**: ✅ Enabled
  - Require branches to be up to date before merging: ✅ Enabled
  - Required status checks:
    - `build` (Next.js build process)
    - `lint` (ESLint checks)
    - `type-check` (TypeScript compilation)
    - `format:check` (Prettier formatting)

- **Require conversation resolution before merging**: ✅ Enabled

- **Require signed commits**: ✅ Enabled (recommended for security)

- **Require linear history**: ✅ Enabled (keeps git history clean)

- **Include administrators**: ✅ Enabled (apply rules to admins too)

- **Allow force pushes**: ❌ Disabled

- **Allow deletions**: ❌ Disabled

### GitHub Actions Workflow
Consider adding a `.github/workflows/ci.yml` file with the following checks:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run format:check
      - run: npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests and linting: `npm run lint`
5. Commit your changes: `git commit -m "Add feature"`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have any questions or need help, please:

1. Check the documentation above
2. Search existing issues
3. Create a new issue with detailed information

---

**Built with ❤️ using Next.js 15 and modern web technologies**
