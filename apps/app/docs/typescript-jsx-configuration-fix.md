# TypeScript JSX Configuration Fix

## Issue
TypeScript was showing errors about JSX not being configured properly, even though the configuration files had the correct `jsx: "preserve"` setting.

## Root Cause
The monorepo workspace packages were not properly linked. Specifically:
1. The `@repo/config` package (containing TypeScript configurations) wasn't being resolved
2. The `@repo/payments` package was missing from the app's dependencies

## Solution

### 1. Fixed Package Linking
- Cleared all node_modules and lock files
- Reinstalled dependencies with `pnpm install` to properly link workspace packages

### 2. Added Missing Dependency
- Added `"@repo/payments": "workspace:*"` to `apps/app/package.json` dependencies

### 3. Commands Used
```bash
# Clear all node_modules and lock files
rm -rf node_modules apps/*/node_modules packages/*/node_modules pnpm-lock.yaml

# Reinstall dependencies
pnpm install
```

### 4. Restart TypeScript Server
After the packages are properly linked, restart the TypeScript server in VSCode:
- Command Palette (Cmd+Shift+P) → "TypeScript: Restart TS Server"

## Result
- TypeScript can now properly resolve the `@repo/config` package and load the JSX configuration
- The `@repo/payments` package is now accessible for imports
- All JSX-related TypeScript errors should be resolved
