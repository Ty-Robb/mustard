# Chat Persistence Implementation

## Overview
Implemented chat persistence for AI insights in the Bible study application, storing all chat data in user-specific MongoDB databases for better data isolation and privacy.

## Key Changes

### 1. Database Schema Updates
Updated `user-db.ts` to create the following collections in each user's database:
- `chat_sessions` - Stores conversation sessions with Bible context
- `chat_messages` - Stores individual messages within sessions
- `highlights` - Stores Bible highlights with support for AI-generated highlights
- `vectors` - Stores embeddings for semantic search (including chat conversations)

### 2. Chat Service Migration
- Modified `chat.service.ts` to use user-specific databases via Firebase UID
- Removed dependency on main database user lookups
- All chat data now stored in isolated user databases

### 3. AI Insights Panel Integration
Updated `AIInsightsPanel.tsx` to:
- Create a new chat session when the panel opens
- Save each message (user and AI) to the database
- Include all required context fields (bibleId, bookId, reference, etc.)

### 4. API Routes
- `/api/chat/sessions` - Create and list chat sessions
- `/api/chat/messages` - Add messages to sessions
- `/api/chat/sessions/[sessionId]` - Get/update/delete specific sessions
- `/api/highlights` - Manage Bible highlights

## Data Structure

### Chat Session
```typescript
{
  _id: ObjectId,
  userId: string,
  title: string,
  context: {
    bibleId: string,
    bookId: string,
    chapterId?: string,
    verseIds?: string[],
    selectedText: string,
    reference: string
  },
  tags: string[],
  createdAt: Date,
  updatedAt: Date,
  lastMessageAt: Date
}
```

### Chat Message
```typescript
{
  _id: ObjectId,
  sessionId: ObjectId,
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: {
    actionType?: string,
    modelUsed?: string,
    tokenCount?: number,
    errorRetries?: number
  },
  createdAt: Date
}
```

### Highlight
```typescript
{
  _id: ObjectId,
  reference: string,
  text: string,
  type: 'manual' | 'ai' | 'search' | 'shared',
  color?: string,
  note?: string,
  aiContext?: {
    sessionId: string,
    messageId: string,
    action: string
  },
  tags: string[],
  createdAt: Date,
  updatedAt: Date
}
```

## Benefits

1. **Data Privacy**: Each user's conversations are completely isolated
2. **GDPR Compliance**: Easy to delete all user data by dropping their database
3. **Performance**: No need to filter by userId across millions of records
4. **Scalability**: Each user's data grows independently
5. **Semantic Search**: Chat conversations can be vectorized for AI-powered search

## Testing

Run the test script to verify chat persistence:
```bash
npx tsx -r dotenv/config src/scripts/test-chat-persistence.ts dotenv_config_path=.env.local
```

## Future Enhancements

1. **Vector Embeddings**: Automatically generate embeddings for chat conversations
2. **Search Integration**: Enable semantic search across past conversations
3. **Export/Import**: Allow users to export their chat history
4. **Analytics**: Track usage patterns and popular topics
