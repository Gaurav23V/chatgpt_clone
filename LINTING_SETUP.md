# ESLint and Prettier Configuration

This project uses a comprehensive ESLint and Prettier setup following modern Next.js best practices
and professional standards inspired by the Dub repository.

## 🔧 Configuration Files

### ESLint Configuration (`eslint.config.mjs`)

- Uses the new **flat config format** (ESLint 9+)
- Includes Next.js core web vitals and TypeScript rules
- Custom import sorting with `simple-import-sort`
- TypeScript-specific rules for better code quality
- Prettier integration to prevent conflicts

### Prettier Configuration (`.prettierrc`)

- Single quotes for JavaScript/TypeScript
- Semi-colons enabled
- 2-space indentation
- Tailwind CSS class sorting with `prettier-plugin-tailwindcss`
- Specific overrides for different file types

### VS Code Settings (`.vscode/settings.json`)

- Auto-format on save
- ESLint auto-fix on save
- Proper TypeScript integration
- File-specific formatter settings

## 📦 Installed Dependencies

### ESLint Related

- `@typescript-eslint/eslint-plugin` - TypeScript ESLint rules
- `@typescript-eslint/parser` - TypeScript parser for ESLint
- `eslint-plugin-import` - Import/export syntax rules
- `eslint-plugin-simple-import-sort` - Automatic import sorting
- `eslint-config-prettier` - Disables ESLint rules that conflict with Prettier
- `eslint-plugin-prettier` - Runs Prettier as an ESLint rule
- `eslint-import-resolver-typescript` - TypeScript import resolution

### Prettier Related

- `prettier` - Code formatter
- `prettier-plugin-tailwindcss` - Tailwind CSS class sorting

## 🚀 Available Scripts

```bash
# Linting
npm run lint          # Check for ESLint errors
npm run lint:fix      # Auto-fix ESLint errors

# Formatting
npm run format        # Format all files with Prettier
npm run format:check  # Check if files are formatted correctly

# Type Checking
npm run type-check    # Run TypeScript type checking
```

## 📋 Rules and Standards

### Import Organization

Imports are automatically sorted in this order:

1. React imports
2. Next.js imports
3. External packages
4. Internal packages (using `@/` alias)
5. Relative imports
6. Style imports

### TypeScript Rules

- Unused variables must start with `_` to be ignored
- Explicit `any` types trigger warnings
- Consistent type imports are enforced
- No unused variables (handled by TypeScript)

### Code Quality Rules

- Prefer `const` over `let` when possible
- No `var` declarations
- Template literals over string concatenation
- Strict equality checks (`===` over `==`)
- Proper error handling

### React/Next.js Rules

- No need to import React in scope (Next.js 13+)
- Proper hooks dependency arrays
- Component display names are optional

## 🎯 Best Practices

### Development Workflow

1. Write code
2. Save file (auto-format and lint fix)
3. Use `npm run type-check` before commits
4. Use `npm run lint` in CI/CD

### IDE Integration

- Install ESLint and Prettier extensions in VS Code
- Configuration automatically applies on save
- Real-time error highlighting
- Import organization on save

### Accessibility

- Rules encourage semantic HTML
- ARIA attributes are validated
- Focus management is enforced

## 🔄 Continuous Integration

Add these scripts to your CI/CD pipeline:

```bash
# Check code quality
npm run lint
npm run type-check
npm run format:check

# Build
npm run build
```

## 🛠 Troubleshooting

### Common Issues

1. **ESLint config not found**

   - Make sure `eslint.config.mjs` is in the root directory
   - Restart your IDE

2. **Import sorting not working**

   - Check that `simple-import-sort` is installed
   - Verify the import groups configuration

3. **Prettier conflicts with ESLint**

   - Configuration includes `eslint-config-prettier` to prevent conflicts
   - Run `npm run format` if issues persist

4. **TypeScript errors**
   - Run `npm run type-check` to see full errors
   - Check `tsconfig.json` configuration

### VS Code Extensions

Recommended extensions:

- ESLint (Microsoft)
- Prettier - Code formatter (Prettier)
- TypeScript and JavaScript Language Features (built-in)
- Tailwind CSS IntelliSense

## 📚 Additional Resources

- [ESLint Flat Config Documentation](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [Next.js ESLint Config](https://nextjs.org/docs/app/api-reference/config/eslint)
- [TypeScript ESLint Rules](https://typescript-eslint.io/rules/)

---

This setup ensures consistent code quality, automatic formatting, and follows industry best
practices for React/Next.js development.
