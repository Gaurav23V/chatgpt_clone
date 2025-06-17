# ChatGPT Clone - Project Structure

This document outlines the project structure and organization of the ChatGPT Clone application, following Dub repository patterns and Next.js 14+ App Router conventions.

## Overview

The project is structured as a modern Next.js application with TypeScript, featuring a clean separation of concerns and scalable architecture patterns inspired by the Dub repository.

## Root Directory Structure

```
chatgpt-clone/
├── src/                    # Main source code
├── public/                 # Static assets (handled by Next.js)
├── scripts/                # Build and utility scripts
├── components.json         # ShadCN UI configuration
├── next.config.ts          # Next.js configuration
├── middleware.ts           # Next.js middleware (auth, etc.)
├── package.json            # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── README.md              # Project documentation
```

## Source Code Structure (`src/`)

### App Directory (`src/app/`)

Following Next.js 14+ App Router conventions with route groups for organization:

```
src/app/
├── globals.css            # Global styles
├── layout.tsx            # Root layout component
├── page.tsx              # Home page
├── favicon.ico           # App icon
├── (auth)/               # Authentication route group
│   ├── layout.tsx        # Auth-specific layout
│   ├── sign-in/          # Sign-in routes
│   │   └── [[...sign-in]]/
│   │       └── page.tsx  # Clerk catch-all sign-in
│   └── sign-up/          # Sign-up routes
│       └── [[...sign-up]]/
│           └── page.tsx  # Clerk catch-all sign-up
├── (chat)/               # Main chat interface route group
│   ├── layout.tsx        # Chat layout with sidebar
│   └── c/                # Individual chat conversations
│       └── [id]/         # Dynamic chat ID routes
│           └── page.tsx  # Chat conversation page
└── api/                  # API routes
    └── chat/             # Chat API endpoints
        └── route.ts      # Main chat API handler
```

**Route Groups Explained:**
- `(auth)` - Groups authentication-related pages with shared layout
- `(chat)` - Groups chat interface pages with sidebar layout
- Route groups don't affect URL structure but allow layout organization

### Components Directory (`src/components/`)

Organized by feature and reusability:

```
src/components/
├── ui/                   # ShadCN UI components (auto-generated)
│   ├── button.tsx        # Base button component
│   └── [other-ui-components]
├── chat/                 # Chat-specific components
│   └── index.ts          # Export barrel
├── layout/               # Layout components
│   └── index.ts          # Export barrel
└── common/               # Shared/reusable components
    └── index.ts          # Export barrel
```

**Component Organization:**
- `ui/` - Base UI components from ShadCN
- `chat/` - Chat functionality components
- `layout/` - Navigation, sidebar, header components
- `common/` - Reusable components across features

### Library Directory (`src/lib/`)

Core business logic and configurations:

```
src/lib/
├── ai/                   # AI service integrations
│   ├── config.ts         # AI model configurations
│   └── index.ts          # AI services export
├── auth/                 # Authentication services
│   ├── clerk-config.ts   # Clerk authentication config
│   └── index.ts          # Auth services export
├── db/                   # Database layer
│   ├── connection.ts     # Database connection
│   ├── index.ts          # Database exports
│   └── models/           # Database models
│       └── index.ts      # Models export
├── storage/              # File storage services
│   ├── cloudinary-config.ts
│   ├── uploadcare-config.ts
│   └── index.ts          # Storage services export
├── env.ts                # Environment variable validation
├── utils.ts              # Utility functions (ShadCN)
└── setup-verification.ts # Development setup verification
```

### Types Directory (`src/types/`)

TypeScript type definitions:

```
src/types/
├── database.ts           # Database model types
├── file-upload.ts        # File upload types
└── index.ts              # Main types export with common types
```

### Hooks Directory (`src/hooks/`)

Custom React hooks:

```
src/hooks/
└── index.ts              # Custom hooks export (planned)
```

### Constants Directory (`src/constants/`)

Application constants and configuration:

```
src/constants/
└── index.ts              # Application constants
```

## Naming Conventions

### File Naming
- **Components**: PascalCase (`ChatInput.tsx`, `UserProfile.tsx`)
- **Pages**: lowercase (`page.tsx`, `layout.tsx`)
- **Utilities**: camelCase (`utils.ts`, `api-client.ts`)
- **Types**: camelCase with descriptive names (`user-types.ts`, `api-types.ts`)

### Directory Naming
- **Route Groups**: lowercase with parentheses `(auth)`, `(chat)`
- **Dynamic Routes**: square brackets `[id]`, `[...slug]`
- **Feature Directories**: lowercase (`chat`, `auth`, `storage`)

### Component Naming
- **React Components**: PascalCase exports
- **Hooks**: camelCase starting with "use" (`useChat`, `useAuth`)
- **Utilities**: camelCase (`formatDate`, `validateEmail`)

## Architecture Patterns

### 1. Feature-Based Organization
Components and logic are organized by feature (chat, auth, etc.) rather than by type, making the codebase more maintainable as it scales.

### 2. Barrel Exports
Each major directory includes an `index.ts` file that exports all relevant items, making imports cleaner and more maintainable.

### 3. Route Groups
Next.js route groups `(auth)` and `(chat)` allow for organized layouts without affecting URL structure.

### 4. Separation of Concerns
- **Components**: UI and presentation logic
- **Hooks**: Reusable stateful logic
- **Lib**: Business logic and external integrations
- **Types**: TypeScript definitions
- **Constants**: Configuration and static values

### 5. Configuration Co-location
Related configuration files are kept together (e.g., all auth config in `lib/auth/`).

## Alignment with Dub Repository Patterns

This structure follows several patterns from the Dub repository:

1. **Feature-based organization** rather than type-based
2. **Barrel exports** for clean imports
3. **Route groups** for layout organization
4. **Comprehensive TypeScript** typing
5. **Centralized configuration** management
6. **Scalable component architecture**

## Development Workflow

### Adding New Features
1. Create feature directory in appropriate section (`components/`, `lib/`, etc.)
2. Add types in `src/types/`
3. Create components with proper exports
4. Add routes in `src/app/` if needed
5. Update barrel exports (`index.ts` files)
6. Add constants and configuration as needed

### File Creation Guidelines
- Always include descriptive comments at the top of files
- Use TODO comments for planned implementations
- Follow TypeScript strict mode conventions
- Include proper error handling and loading states

## Future Expansions

The structure is designed to accommodate:
- Additional AI providers and models
- Real-time features (WebSocket integration)
- Advanced chat features (voice, images, etc.)
- Team collaboration features
- Analytics and monitoring
- Internationalization (i18n)

This structure provides a solid foundation for scaling the ChatGPT Clone while maintaining code organization and developer experience.
