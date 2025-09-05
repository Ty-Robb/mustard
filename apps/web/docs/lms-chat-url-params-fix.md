# LMS Chat URL Parameters Fix

## Overview
Fixed the issue where LMS context (course title, step title, return button) was not immediately visible when navigating to the chat page from the LMS with a session ID parameter.

## Problem
When users clicked "Open in Chat" from an LMS course step, they would navigate to `/chat?sessionId=xxx`, but there was no indication they were in an LMS context until after the session finished loading.

## Solution
1. **Added URL parameter reading**: The chat page now uses `useSearchParams()` to read the `sessionId` from the URL
2. **Pass session ID to useChat hook**: The session ID is passed to the `useChat` hook which automatically loads that session
3. **Added loading indicators**: While the session is loading, skeleton loaders are displayed where the LMS context will appear
4. **Immediate visual feedback**: Users now see loading indicators immediately, making it clear they're in an LMS context

## Implementation Details

### Changes to `/src/app/(protected)/chat/page.tsx`:

1. **Import required dependencies**:
   ```typescript
   import { useSearchParams } from 'next/navigation';
   import { Skeleton } from '@/components/ui/skeleton';
   ```

2. **Read URL parameters**:
   ```typescript
   const searchParams = useSearchParams();
   const sessionIdFromUrl = searchParams.get('sessionId');
   const [isLoadingLmsContext, setIsLoadingLmsContext] = useState(false);
   ```

3. **Pass session ID to useChat**:
   ```typescript
   const { ... } = useChat({ sessionId: sessionIdFromUrl || undefined });
   ```

4. **Track loading state**:
   ```typescript
   useEffect(() => {
     if (sessionIdFromUrl && !currentSession) {
       setIsLoadingLmsContext(true);
     } else if (currentSession) {
       setIsLoadingLmsContext(false);
     }
   }, [sessionIdFromUrl, currentSession]);
   ```

5. **Display skeleton loaders while loading**:
   ```typescript
   {isLoadingLmsContext && sessionIdFromUrl ? (
     // Show skeleton loaders while loading LMS context
     <div className="flex items-center gap-2">
       <Skeleton className="h-6 w-32" />
       <Skeleton className="h-5 w-24" />
     </div>
   ) : currentSession?.lmsContext ? (
     // Show actual LMS context when loaded
     <div className="flex items-center gap-2">
       <Badge variant="secondary" className="flex items-center gap-1">
         <BookOpen className="h-3 w-3" />
         {currentSession.lmsContext.courseTitle}
       </Badge>
       <Badge variant="outline" className="text-xs">
         {currentSession.lmsContext.stepTitle}
       </Badge>
     </div>
   ) : null}
   ```

## User Experience

### Before:
- Navigate to `/chat?sessionId=xxx`
- See generic "AI Assistant" header
- Wait for session to load
- LMS context suddenly appears

### After:
- Navigate to `/chat?sessionId=xxx`
- Immediately see skeleton loaders indicating content is loading
- LMS context smoothly transitions in when loaded
- Clear visual indication that this is an LMS session

## Testing
Created test script at `/src/scripts/test-lms-chat-url-params.ts` to verify the expected behavior.

## Benefits
1. **Better UX**: Users immediately know they're in an LMS context
2. **Reduced confusion**: No more wondering if the navigation worked correctly
3. **Professional appearance**: Smooth loading states instead of sudden content appearance
4. **Consistent behavior**: Matches modern web app expectations for loading states
