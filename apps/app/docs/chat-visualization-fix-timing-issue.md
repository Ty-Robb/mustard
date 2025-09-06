# Chat Visualization Timing Issue Fix

## Problem
Charts and tables were not displaying in the chat interface despite:
- AI correctly generating visualization JSON blocks
- Backend properly parsing and saving attachments
- Database storing messages with attachments correctly

The issue was that the UI was showing temporary "pending-user" and "streaming" messages that don't have attachments, even after the real messages with attachments were saved.

## Root Cause
In the `useChat` hook, when streaming completed (`[DONE]` received):
1. `pendingUserMessage` was cleared
2. `loadSession` was called to reload messages
3. BUT `streamingMessage` was NOT cleared

This caused the UI to continue displaying the temporary streaming message (which has no attachments) instead of the properly loaded messages from the database.

## Solution
Modified `src/hooks/useChat.ts` to clear the streaming message when streaming completes:

```typescript
if (data === '[DONE]') {
  console.log('[useChat] Streaming complete, reloading session');
  // Clear pending user message and streaming message when done
  setPendingUserMessage(null);
  setStreamingMessage(''); // <-- Added this line
  // Reload session to get the saved messages with attachments
  if (sessionId) {
    await loadSession(sessionId);
  }
  return;
}
```

## Additional Improvements
Added debug logging to `loadSession` to help track when sessions are loaded and whether they contain attachments:

```typescript
console.log('[useChat] Session loaded:', sessionId, 'Messages:', data.session?.messages?.length);

// Log messages with attachments
const messagesWithAttachments = data.session?.messages?.filter((m: any) => m.metadata?.attachments);
if (messagesWithAttachments?.length > 0) {
  console.log('[useChat] Messages with attachments:', messagesWithAttachments.length);
}
```

## Testing
To verify the fix works:
1. Use the Data Visualization agent
2. Send a message like "Show me a pie chart of church budget breakdown"
3. Watch the console logs to see:
   - Streaming chunks being received
   - "[useChat] Streaming complete, reloading session"
   - "[useChat] Session loaded" with message count
   - "[useChat] Messages with attachments" if visualizations are present
4. The chart should now appear below the message

## Key Takeaways
- Always clear ALL temporary state when transitioning from streaming to loaded state
- The UI should never show temporary messages after the real data has been loaded
- Debug logging is essential for tracking async state transitions
