# Chat Persistence API Documentation

This document describes the API endpoints for managing AI chat sessions and messages in the Mustard Bible app.

## Overview

The chat persistence system allows users to:
- Save AI conversations with biblical context
- Organize chats by scripture reference, tags, and topics
- Search through chat history
- Link chats to specific verses and highlights

## Authentication

All endpoints require Firebase authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

## API Endpoints

### Chat Sessions

#### Create a New Chat Session
```
POST /api/chat/sessions
```

Request body:
```json
{
  "title": "Optional custom title",
  "context": {
    "bibleId": "de4e12af7f28f599-02",
    "bookId": "GEN",
    "chapterId": "GEN.1",
    "verseIds": ["GEN.1.1", "GEN.1.2"],
    "selectedText": "In the beginning God created...",
    "reference": "Genesis 1:1-2"
  },
  "tags": ["creation", "theology"]
}
```

Response:
```json
{
  "session": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "user123",
    "title": "Genesis 1:1-2: \"In the beginning God created...\"",
    "context": { ... },
    "tags": ["creation", "theology"],
    "createdAt": "2024-08-24T17:00:00Z",
    "updatedAt": "2024-08-24T17:00:00Z",
    "lastMessageAt": "2024-08-24T17:00:00Z"
  }
}
```

#### Get User's Chat Sessions
```
GET /api/chat/sessions?bookId=GEN&tags=creation,theology&limit=20&skip=0&search=beginning
```

Query parameters:
- `bookId` (optional): Filter by Bible book
- `tags` (optional): Comma-separated list of tags to filter by
- `limit` (optional): Number of sessions to return (default: 50)
- `skip` (optional): Number of sessions to skip for pagination (default: 0)
- `search` (optional): Search term to find in session titles and messages

Response:
```json
{
  "sessions": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "user123",
      "title": "Genesis 1:1-2: \"In the beginning God created...\"",
      "context": { ... },
      "tags": ["creation", "theology"],
      "createdAt": "2024-08-24T17:00:00Z",
      "updatedAt": "2024-08-24T17:00:00Z",
      "lastMessageAt": "2024-08-24T17:00:00Z"
    }
  ]
}
```

#### Get a Specific Session with Messages
```
GET /api/chat/sessions/{sessionId}
```

Response:
```json
{
  "session": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "user123",
    "title": "Genesis 1:1-2: \"In the beginning God created...\"",
    "context": { ... },
    "tags": ["creation", "theology"],
    "createdAt": "2024-08-24T17:00:00Z",
    "updatedAt": "2024-08-24T17:00:00Z",
    "lastMessageAt": "2024-08-24T17:00:00Z",
    "messages": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "sessionId": "507f1f77bcf86cd799439011",
        "userId": "user123",
        "role": "user",
        "content": "What does 'in the beginning' mean?",
        "createdAt": "2024-08-24T17:00:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439013",
        "sessionId": "507f1f77bcf86cd799439011",
        "userId": "user123",
        "role": "assistant",
        "content": "The phrase 'in the beginning' (Hebrew: bereshit)...",
        "metadata": {
          "model": "gemini-1.5-flash",
          "actionType": "word-study"
        },
        "createdAt": "2024-08-24T17:00:01Z"
      }
    ],
    "messageCount": 2
  }
}
```

#### Update Session Tags
```
PATCH /api/chat/sessions/{sessionId}
```

Request body:
```json
{
  "tags": ["creation", "theology", "hebrew"]
}
```

Response:
```json
{
  "success": true
}
```

#### Delete a Session
```
DELETE /api/chat/sessions/{sessionId}
```

Response:
```json
{
  "success": true
}
```

### Chat Messages

#### Add a Message to a Session
```
POST /api/chat/messages
```

Request body:
```json
{
  "sessionId": "507f1f77bcf86cd799439011",
  "role": "user",
  "content": "What does this verse mean?",
  "metadata": {
    "actionType": "explain"
  }
}
```

Response:
```json
{
  "message": {
    "_id": "507f1f77bcf86cd799439014",
    "sessionId": "507f1f77bcf86cd799439011",
    "userId": "user123",
    "role": "user",
    "content": "What does this verse mean?",
    "metadata": {
      "actionType": "explain"
    },
    "createdAt": "2024-08-24T17:05:00Z"
  }
}
```

#### Get Messages for a Session
```
GET /api/chat/messages?sessionId=507f1f77bcf86cd799439011&limit=50&skip=0
```

Query parameters:
- `sessionId` (required): The session ID to get messages for
- `limit` (optional): Number of messages to return (default: 50)
- `skip` (optional): Number of messages to skip for pagination (default: 0)

Response:
```json
{
  "messages": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "sessionId": "507f1f77bcf86cd799439011",
      "userId": "user123",
      "role": "user",
      "content": "What does 'in the beginning' mean?",
      "createdAt": "2024-08-24T17:00:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "sessionId": "507f1f77bcf86cd799439011",
      "userId": "user123",
      "role": "assistant",
      "content": "The phrase 'in the beginning' (Hebrew: bereshit)...",
      "metadata": {
        "model": "gemini-1.5-flash",
        "actionType": "word-study"
      },
      "createdAt": "2024-08-24T17:00:01Z"
    }
  ]
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:

- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error response format:
```json
{
  "error": "Error message description"
}
```

## Integration with AI Insights

When the AI insights panel generates a response, it should:

1. Create a new chat session (if not exists) with the biblical context
2. Add the user's action as a message with role "user"
3. Add the AI's response as a message with role "assistant"
4. Include relevant metadata (model used, action type, etc.)

Example flow:
```javascript
// 1. Create session when user first interacts with AI
const session = await createChatSession({
  context: {
    bibleId: "de4e12af7f28f599-02",
    bookId: "GEN",
    chapterId: "GEN.1",
    verseIds: ["GEN.1.1"],
    selectedText: "In the beginning God created the heaven and the earth.",
    reference: "Genesis 1:1"
  },
  tags: ["creation"]
});

// 2. Add user's question
await addMessage({
  sessionId: session._id,
  role: "user",
  content: "Explain this verse",
  metadata: { actionType: "explain" }
});

// 3. Add AI's response
await addMessage({
  sessionId: session._id,
  role: "assistant",
  content: "Genesis 1:1 is the opening verse of the Bible...",
  metadata: {
    model: "gemini-1.5-flash",
    actionType: "explain"
  }
});
```

## Next Steps

1. Update the AI insights panel to save conversations using these endpoints
2. Create UI components for viewing chat history
3. Implement chat organization views (by scripture, topic, timeline)
4. Add export functionality for chat sessions
5. Link highlights with chat sessions
