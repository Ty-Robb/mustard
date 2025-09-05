# Bible API Implementation

## Overview

The Bible API integration has been successfully implemented with the following features:

1. **Bible Service** (`src/lib/services/bible.service.ts`)
   - Complete integration with scripture.api.bible
   - Methods for fetching Bibles, verses, chapters, books, and searching
   - Automatic caching with vector embeddings for semantic search
   - Fallback to text search if vector search fails

2. **API Routes**
   - `GET /api/bibles` - List available Bibles with filtering options
   - `GET /api/bibles/[bibleId]/books` - Get books for a specific Bible
   - `GET /api/bibles/[bibleId]/verses/[verseId]` - Get specific verse with automatic caching
   - `GET /api/bibles/[bibleId]/chapters/[chapterId]` - Get chapter with automatic caching
   - `GET /api/bibles/[bibleId]/search` - Search Bible content (supports both API and cached search)

3. **Caching System**
   - Bible content is automatically cached in user's personal database
   - Each cached item includes vector embeddings for semantic search
   - Cached content includes metadata (bookId, chapterId, verseId, copyright)
   - Last accessed timestamps are updated on retrieval

4. **Vector Search Integration**
   - Uses Google Gemini text-embedding-004 model (1536 dimensions)
   - Semantic search across cached Bible content
   - Configurable minimum score threshold
   - Falls back to text search if vector search fails

## Testing

A test page has been created at `/test-bible` (accessible from the dashboard) that allows:
- Selecting different Bible translations
- Fetching specific verses by ID (e.g., JHN.3.16)
- Searching Bible content using the API
- Searching cached content using vector similarity

## Environment Variables

Required in `.env.local`:
```
BIBLE_API_KEY=432a2038ad6408df30e3eb67f0363cad
GEMINI_API_KEY=<your-gemini-api-key-here>
```

**Important**: The `GEMINI_API_KEY` is currently empty in your `.env.local` file. You need to:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` file
4. Restart your development server

Without this key, the vector embeddings for Bible content caching will not work.

## Usage Example

```typescript
// Fetch available Bibles
const response = await fetch('/api/bibles?language=eng', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});

// Get a specific verse
const verseResponse = await fetch('/api/bibles/de4e12af7f28f599-02/verses/JHN.3.16', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});

// Search with caching
const searchResponse = await fetch('/api/bibles/de4e12af7f28f599-02/search?query=love&useCache=true', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

## Data Structure

### Cached Bible Content
```typescript
interface CachedBibleContent {
  _id?: string;
  bibleId: string;
  reference: string;
  type: 'verse' | 'chapter' | 'passage';
  content: string;
  metadata: {
    bookId?: string;
    chapterId?: string;
    verseId?: string;
    copyright?: string;
  };
  embedding?: number[];
  embeddingModel?: string;
  embeddingDate?: Date;
  cachedAt: Date;
  lastAccessed: Date;
}
```

## Next Steps

1. **Add Gemini API Key** - The vector embeddings require a Google Gemini API key
2. **Create MongoDB Vector Index** - Ensure the vector search index is created for the bible_content collection
3. **Build Reading Plans Feature** - Allow users to create and follow Bible reading plans
4. **Implement AI Summaries** - Use Gemini to generate summaries of Bible passages
5. **Add Bible Study Tools** - Cross-references, commentaries, original language support

## Security

- All API routes require Firebase authentication
- Each user has their own isolated database for cached content
- API keys are stored securely in environment variables
- Token validation on every request
