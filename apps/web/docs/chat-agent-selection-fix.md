# Chat Agent Selection Fix

## Issue Summary

The chat was showing only brief summaries instead of full, detailed responses because it was using the wrong AI agent.

## Root Cause

1. **Agent Order**: The `summary-generator` agent was listed first in the `VERTEX_AI_AGENTS` array
2. **Default Selection**: The `useChat` hook defaults to the first agent in the list
3. **Wrong Agent**: The summary-generator is configured to ONLY provide 1-2 sentence summaries, not full responses

## The Problem

When users asked questions like "tell me about genesis 1", they received:

```
Genesis 1 describes God's creation of the universe and everything in it over six days, 
culminating in the creation of humanity in His image and the establishment of the Sabbath rest.
```

This is just a summary, not the detailed response with [SUMMARY] and [CONTENT] tags that was expected.

## The Solution

Reordered the agents in `src/lib/services/vertex-ai.service.ts` to put `general-assistant` first:

```typescript
export const VERTEX_AI_AGENTS: VertexAIAgent[] = [
  {
    id: 'general-assistant',  // Now first, becomes default
    name: 'General Assistant',
    // ... configured with [SUMMARY] and [CONTENT] structure
  },
  {
    id: 'summary-generator',  // Now second, used only for parallel summary generation
    name: 'Summary Generator',
    // ... configured for brief summaries only
  },
  // ... other agents
];
```

## Expected Behavior

Now when users ask "tell me about genesis 1", they should receive:

```
[SUMMARY]
Genesis 1 presents the biblical account of creation, describing how God created the universe, 
earth, and all life in six days, culminating with humanity made in His image and the 
establishment of the Sabbath rest.
[/SUMMARY]

[CONTENT]
# Understanding Genesis 1

Genesis 1 is the opening chapter of the Bible and presents the foundational narrative of 
creation from a theological perspective...

## The Six Days of Creation

### Day 1: Light and Darkness
God creates light and separates it from darkness, establishing day and night...

### Day 2: Sky and Waters
The expanse (firmament) is created, separating waters above from waters below...

[... detailed content continues ...]
[/CONTENT]
```

## How the Dual-Agent System Works

1. **User sends message** → Goes to general-assistant (default)
2. **Parallel processing**:
   - `general-assistant` generates full response with [SUMMARY] and [CONTENT]
   - `summary-generator` generates quick 1-2 sentence summary (via `generateCompletionWithSummary`)
3. **UI displays**:
   - Quick summary appears immediately in streaming card
   - Full response streams in with proper structure
   - Response parser extracts [SUMMARY] and [CONTENT] sections
   - Editor shows summary on left, detailed content on right

## Agent Roles

### general-assistant
- **Purpose**: Main chat agent for full responses
- **Model**: `gemini-2.5-flash` (balanced performance)
- **Output**: Structured with [SUMMARY] and [CONTENT] tags
- **Token limit**: 3072 (allows detailed responses)

### summary-generator
- **Purpose**: Fast executive summaries only
- **Model**: `gemini-2.5-flash-lite` (cost-efficient)
- **Output**: 1-2 sentence TLDR only
- **Token limit**: 150 (keeps summaries brief)
- **Used by**: `generateCompletionWithSummary()` for parallel processing

## Verification

To verify the fix is working:

1. Restart the dev server to reload the agent configuration
2. Open a new chat session
3. Ask a question like "tell me about genesis 1"
4. You should see:
   - Quick summary in the streaming card
   - Full response with [SUMMARY] and [CONTENT] structure
   - Ability to open in editor for left/right view

## Related Files

- `src/lib/services/vertex-ai.service.ts` - Agent definitions and order
- `src/hooks/useChat.ts` - Default agent selection logic
- `src/lib/services/chat.service.ts` - Dual-agent processing
- `src/app/api/chat/route.ts` - Streaming response handling
- `src/components/chat/ChatMessage.tsx` - UI display logic
