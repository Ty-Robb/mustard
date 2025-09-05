# Bible Vectorization System

This document describes the Bible vectorization system that enables semantic search across Bible verses using MongoDB Atlas Vector Search and Google's Gemini embeddings.

## Overview

The Bible vectorization system allows users to:
- Search for Bible verses semantically (by meaning, not just keywords)
- Find conceptually similar verses across the Bible
- Discover thematic connections between passages
- Enable AI-powered Bible study features

## Architecture

### Data Structure

```typescript
interface BibleVector {
  reference: string;        // "Matthew 1:1"
  book: string;            // "MAT"
  bookName: string;        // "Matthew"
  chapter: number;         // 1
  verse: number;           // 1
  text: string;            // Verse text
  translation: string;     // "ESV", "NIV", etc.
  
  // Context for better embeddings
  chapterContext?: string; // Chapter theme
  verseContext?: string;   // Previous + current + next verse
  
  // Vector data
  embedding: number[];     // 1536-dimensional vector
  embeddingModel: string;  // "text-embedding-004"
  embeddingDate: Date;
  
  // Metadata
  testament: 'old' | 'new';
  genre: string;           // 'gospel', 'epistle', etc.
  themes?: string[];       // ["genealogy", "birth of Jesus"]
}
```

### Storage

- Vectors are stored in a shared `bible_vectors` collection in the main `mustard` database
- This is different from user-specific content which is stored in individual user databases
- Estimated storage: ~8KB per verse (including 1536-dimensional embedding)

## Implementation

### 1. Vectorization Process

The vectorization process involves:

1. **Fetching Bible content** from the Bible API
2. **Generating contextual embeddings** that include:
   - The verse text itself
   - Previous and next verses for context
   - Chapter theme and topics
   - Book and genre information
3. **Storing vectors** in MongoDB with appropriate indexes

### 2. Contextual Embeddings

To improve search quality, embeddings are generated from enriched text:

```
Book: Matthew (Gospel of Jesus Christ)
Chapter 1: The Genealogy and Birth of Jesus Christ
Themes: genealogy, Abraham, David, virgin birth

Context:
[Previous verse] ...
[Matthew 1:1] The book of the genealogy of Jesus Christ...
[Next verse] Abraham was the father of Isaac...

This verse is part of the Gospel of Matthew...
```

### 3. Search Implementation

The system supports:
- **Semantic search**: Find verses by meaning
- **Filtered search**: Limit by book, chapter, or translation
- **Similarity search**: Find verses similar to a given verse
- **Fallback text search**: When vector search is unavailable

## Usage

### Running the Vectorization Script

1. **Test the setup first**:
   ```bash
   npm run tsx src/scripts/test-bible-vectorization.ts
   ```

2. **Vectorize Matthew** (as a proof of concept):
   ```bash
   npm run tsx src/scripts/vectorize-matthew.ts
   ```

### API Endpoints

#### Search Bible Vectors

```bash
# GET request
GET /api/bible-vectors/search?q=love%20your%20neighbor&limit=10&minScore=0.7

# POST request with more options
POST /api/bible-vectors/search
{
  "query": "love your neighbor",
  "options": {
    "limit": 10,
    "book": "MAT",
    "chapter": 22,
    "translation": "ESV",
    "minScore": 0.7,
    "includeContext": true
  }
}
```

#### Get Statistics

```bash
GET /api/bible-vectors/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "totalVerses": 1071,
    "byTranslation": {
      "ESV": 1071
    },
    "byBook": {
      "Matthew": 1071
    }
  }
}
```

## MongoDB Atlas Setup

### Required Indexes

1. **Vector Search Index** (create in Atlas UI):
```json
{
  "name": "bible_vector_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [{
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }]
  }
}
```

2. **Standard Indexes** (created automatically by the script):
- Compound index on `reference` + `translation` (unique)
- Single indexes on: `book`, `chapter`, `translation`, `testament`, `genre`
- Text index on `searchableText` for fallback search

## Example Use Cases

### 1. Thematic Search
Find all verses about forgiveness:
```javascript
const results = await bibleVectorService.searchBibleVectors(
  "forgiveness and mercy",
  { limit: 20 }
);
```

### 2. Contextual Study
Find verses similar to Matthew 22:39:
```javascript
const similar = await bibleVectorService.findSimilarVerses(
  "Matthew 22:39",
  "ESV",
  10
);
```

### 3. Filtered Search
Find parables in Matthew about the kingdom:
```javascript
const results = await bibleVectorService.searchBibleVectors(
  "kingdom of heaven parable",
  { 
    book: "MAT",
    minScore: 0.8 
  }
);
```

## Performance Considerations

1. **Embedding Generation**: ~100ms per verse
2. **Batch Processing**: Process 10 verses at a time to balance speed and API limits
3. **Rate Limiting**: 1-second delay between chapters to avoid API throttling
4. **Total Time**: ~10-15 minutes for Matthew (1,071 verses)

## Future Enhancements

1. **Full Bible Vectorization**: Extend beyond Matthew to all 66 books
2. **Multiple Translations**: Support ESV, NIV, KJV, etc.
3. **Cross-Reference Integration**: Link related verses automatically
4. **Topic Clustering**: Auto-generate topic groups using vector similarity
5. **Personalized Recommendations**: Based on user's reading history
6. **Study Path Generation**: Create reading plans based on themes

## Troubleshooting

### Vector Search Not Working

1. Ensure MongoDB Atlas cluster is M10 or higher
2. Verify vector search index is created and active
3. Check embedding dimensions match (1536)
4. Review MongoDB Atlas logs for errors

### Slow Performance

1. Increase batch size for processing
2. Use connection pooling for MongoDB
3. Consider caching frequently searched queries
4. Implement pagination for large result sets

### API Rate Limits

1. Add exponential backoff for retries
2. Implement request queuing
3. Consider local caching of Bible content
4. Use batch endpoints where available

---

For questions or issues, check the error logs or run the test script to diagnose problems.
