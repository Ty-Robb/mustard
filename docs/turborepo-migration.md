# Turborepo Migration Guide

## Overview

This document outlines the migration of the Mustard project from a single Next.js application to a Turborepo monorepo structure.

## Monorepo Structure

```
mustard/
├── apps/
│   └── web/              # Main Next.js application
├── packages/
│   ├── ui/               # Shared UI components (to be extracted)
│   ├── database/         # MongoDB utilities (to be extracted)
│   ├── types/            # Shared TypeScript types (completed)
│   └── config/           # Shared configurations (completed)
├── package.json          # Root workspace configuration
├── turbo.json           # Turborepo pipeline configuration
└── README.md            # Project documentation
```

## Completed Steps

1. ✅ **Base Structure Setup**
   - Created Turborepo directory structure
   - Configured npm workspaces in root package.json
   - Set up turbo.json with build pipeline

2. ✅ **Configuration Package (@repo/config)**
   - Created base TypeScript configuration
   - Created Next.js specific configuration
   - Shared across all packages

3. ✅ **Types Package (@repo/types)**
   - Extracted all TypeScript types from web app
   - Created index.ts to export all types
   - Added as dependency to web app

4. ✅ **Web App Migration**
   - Copied entire application to apps/web
   - Updated package.json name to @repo/web
   - Updated tsconfig.json to extend from @repo/config
   - Added workspace dependencies

## Next Steps

### 1. Extract UI Components Package (@repo/ui)
```bash
# Move components from apps/web/src/components to packages/ui/src
# Update imports throughout the application
```

### 2. Extract Database Package (@repo/database)
```bash
# Move database utilities from apps/web/src/lib/services
# Move MongoDB connection logic
# Update imports
```

### 3. Update Import Paths
Replace local imports with package imports:
```typescript
// Before
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';

// After
import { User } from '@repo/types';
import { Button } from '@repo/ui';
```

### 4. Install Dependencies and Test
```bash
# From root directory
npm install
npm run dev
```

## Benefits of Monorepo Structure

1. **Code Sharing**: Share types, utilities, and components across apps
2. **Type Safety**: Shared TypeScript types ensure consistency
3. **Parallel Builds**: Turborepo caches and parallelizes builds
4. **Future Ready**: Easy to add admin dashboard, mobile app, or API

## Common Commands

```bash
# Development
npm run dev              # Start all apps in dev mode
npm run dev --filter=web # Start only web app

# Building
npm run build           # Build all apps and packages
npm run build --filter=web # Build only web app

# Linting
npm run lint            # Lint all packages

# Clean
npm run clean           # Clean all build artifacts
```

## Troubleshooting

### TypeScript Errors
- Ensure all packages have proper tsconfig.json files
- Check that paths in tsconfig.json are correct
- Run `npm install` from root to link workspaces

### Build Errors
- Clear turbo cache: `rm -rf .turbo`
- Clean and rebuild: `npm run clean && npm run build`
- Check for circular dependencies between packages

## Future Enhancements

1. **Add More Packages**
   - `@repo/lib`: Shared utilities and helpers
   - `@repo/api-client`: API client for external services
   - `@repo/auth`: Authentication utilities

2. **Add More Apps**
   - `apps/admin`: Admin dashboard
   - `apps/mobile`: React Native app
   - `apps/docs`: Documentation site

3. **CI/CD Integration**
   - Configure GitHub Actions for monorepo
   - Set up automatic deployments
   - Add test coverage requirements
