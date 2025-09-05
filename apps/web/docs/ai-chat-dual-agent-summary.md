# AI Chat Dual-Agent Summary Implementation

## Overview
This document describes the implementation of a dual-agent system that provides immediate executive summaries using a faster AI model while generating detailed responses in parallel.

## Architecture

### 1. Dual-Agent System
- **Summary Agent**: Uses Gemini 1.5 Flash (faster model) for quick executive summaries
- **Content Agent**: Uses Gemini 2.5 Pro for detailed, comprehensive responses

### 2. Parallel Processing
Both agents process the user's question simultaneously:
```
User Question → 
├── Summary Agent (Fast) → Executive Summary (1-2 seconds)
└── Content Agent (Detailed) → Full Response (3-10 seconds)
```

## Implementation Details

### New Components

#### 1. Summary Generator Agent (`src/lib/services/vertex-ai.service.ts`)
```typescript
{
  id: 'summary-generator',
  name: 'Summary Generator',
  description: 'Fast AI agent for generating executive summaries',
  modelName: 'gemini-1.5-flash', // Faster model
  temperature: 0.3,
  maxOutputTokens: 150 // Keep summaries short
}
```

#### 2. Enhanced Chat Service (`src/lib/services/chat.service.ts`)
- `generateSummary()`: Generates quick summaries using the fast model
- `generateCompletionWithSummary()`: Orchestrates parallel generation with callbacks

#### 3. Updated Chat API (`src/app/api/chat/route.ts`)
- Handles dual streaming responses
- Sends summary events separately from content chunks
- Format: `data: {"summary": "..."}`

#### 4. Enhanced useChat Hook (`src/hooks/useChat.ts`)
- Added `streamingSummary` state
- Processes summary events from SSE stream
- Maintains separate state for summary and content

#### 5. Updated UI Components
- **ChatMessage**: Displays summary in streaming card
- **ChatContainer**: Passes summary to message components
- **Chat Page**: Connects all components together

## User Experience

### Before (Single Agent)
1. User asks question
2. Loading indicator appears
3. Wait 3-10 seconds
4. Full response appears

### After (Dual Agent)
1. User asks question
2. Loading card appears immediately
3. Executive summary appears in 1-2 seconds
4. Full response streams in below
5. Better perceived performance

## Benefits

1. **Immediate Feedback**: Users see a summary within 1-2 seconds
2. **Better UX**: No more waiting for long responses to start
3. **Cost Efficiency**: Summaries use cheaper, faster model
4. **Cleaner Separation**: TLDR vs detailed content is clearly defined
5. **No Parsing Required**: Summary comes from dedicated agent

## Testing

Run the test script to verify the implementation:
```bash
npx tsx src/scripts/test-dual-agent-summary.ts
```

Expected output:
- Summary arrives in ~1000-2000ms
- Content starts streaming shortly after
- Both complete successfully

## Future Enhancements

1. **Caching**: Cache summaries for repeated questions
2. **Smart Routing**: Use different summary agents based on question type
3. **Progressive Enhancement**: Show partial summaries as they generate
4. **Fallback Handling**: Use single agent if summary fails
5. **Analytics**: Track summary vs content timing metrics

## Configuration

The system uses these models by default:
- Summary: `gemini-1.5-flash` (fast, efficient)
- Content: `gemini-2.5-pro` (comprehensive, detailed)

Models can be configured in the agent definitions in `vertex-ai.service.ts`.
