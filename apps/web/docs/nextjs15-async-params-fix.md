# Next.js 15 Async Params Fix

## Summary
Fixed Vercel deployment failure caused by Next.js 15's breaking change that requires dynamic route parameters to be async.

## Issue
Next.js 15 changed how dynamic route parameters are handled. Route handlers now receive params as a Promise that must be awaited, rather than as a synchronous object.

### Error Message
```
Type error: Type 'typeof import("/vercel/path0/src/app/api/lms/courses/[courseId]/route")' does not satisfy the expected type 'RouteHandlerConfig<"/api/lms/courses/[courseId]">'.
Types of property 'GET' are incompatible.
Property 'courseId' is missing in type 'Promise<{ courseId: string; }>' but required in type '{ courseId: string; }'.
```

## Files Fixed
1. `src/app/api/lms/courses/[courseId]/route.ts`
   - Updated GET handler to use async params
   
2. `src/app/api/lms/progress/[courseId]/route.ts`
   - Updated GET and PUT handlers to use async params

## Changes Made
### Before (Next.js 14 style):
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const courseId = params.courseId;
  // ...
}
```

### After (Next.js 15 style):
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  // ...
}
```

## Files Already Compatible
The following routes already had the correct async params implementation:
- `src/app/api/chat/sessions/[sessionId]/route.ts`
- `src/app/api/bibles/[bibleId]/chapters/[chapterId]/route.ts`

## Testing
After these changes, the Vercel deployment should succeed. The async params change is backward compatible with the runtime behavior, so existing functionality remains intact.

## References
- [Next.js 15 Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Next.js Dynamic Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
