# MongoDB Atlas Vector Search Setup

This guide explains how to set up MongoDB Atlas Vector Search for the Mustard application.

## Overview

Each user in Mustard has their own **separate database** for complete data isolation. Within each user's database, there is a `vectors` collection that stores embeddings of their Bible study content. This enables semantic search across their personal notes, reflections, and study materials.

## Architecture

```
MongoDB Cluster
├── mustard (main database)
│   └── users (collection)
├── user_[userId1] (user-specific database)
│   ├── vectors
│   ├── reading_plans
│   ├── quiz_results
│   └── bible_notes
├── user_[userId2] (user-specific database)
│   ├── vectors
│   ├── reading_plans
│   ├── quiz_results
│   └── bible_notes
└── ...
```

## Prerequisites

1. MongoDB Atlas cluster (M10 or higher for vector search)
2. Atlas Search enabled on your cluster
3. Gemini API key for generating embeddings

## Setup Steps

### 1. Create the Vector Search Index

Since each user has their own database, you need to create vector search indexes for each user's `vectors` collection. This can be done through the MongoDB Atlas UI:

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to your cluster
3. Click on "Search" in the left sidebar
4. Click "Create Search Index"
5. Select the database for a specific user (e.g., `user_507f1f77bcf86cd799439011`)
6. Select "JSON Editor" and use the following configuration:

```json
{
  "name": "vector_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 1536,
        "similarity": "cosine"
      },
      {
        "type": "filter",
        "path": "contentType"
      }
    ]
  }
}
```

7. Select the `vectors` collection within that user's database
8. Click "Create Search Index"

**Note**: You'll need to create this index for each user's database. Consider automating this process using the Atlas Admin API for production deployments.

### 2. Create Text Search Index (Fallback)

For fallback text search when vector search is unavailable, create this index on each user's `vectors` collection:

```json
{
  "name": "text_index",
  "type": "search",
  "definition": {
    "mappings": {
      "dynamic": false,
      "fields": {
        "content": {
          "type": "string",
          "analyzer": "lucene.standard"
        },
        "contentType": {
          "type": "string"
        },
        "metadata.tags": {
          "type": "string"
        }
      }
    }
  }
}
```

## How It Works

### User Creation Flow

1. When a user signs up, a new database is created: `user_${userId}`
2. The database is initialized with collections: `vectors`, `reading_plans`, `quiz_results`, `bible_notes`
3. Standard indexes are created for efficient querying
4. Vector search indexes must be created manually or via Atlas Admin API

### Storing Vectors

When a user creates content (notes, reflections, etc.):

1. The content is sent to Google's Gemini API to generate a 1536-dimensional embedding
2. The embedding is stored in the user's own `vectors` collection
3. Complete isolation - no userId filtering needed as each user has their own database

### Searching Vectors

When searching for similar content:

1. The search query is converted to an embedding
2. MongoDB Atlas Vector Search searches only within the user's database
3. No cross-user data leakage is possible due to database isolation
4. A similarity score is provided for ranking

## API Usage Examples

### Store a Bible Study Note

```typescript
// POST /api/vectors
{
  "content": "The parable of the mustard seed teaches us about faith...",
  "contentType": "study_note",
  "metadata": {
    "reference": "Matthew 13:31-32",
    "tags": ["faith", "parables", "growth"]
  }
}
```

### Search for Similar Content

```typescript
// GET /api/vectors/search?q=faith%20and%20growth
{
  "results": [
    {
      "_id": "...",
      "content": "The parable of the mustard seed teaches us about faith...",
      "score": 0.95,
      "metadata": {
        "reference": "Matthew 13:31-32"
      }
    }
  ]
}
```

## Monitoring and Maintenance

### Index Performance

Monitor your vector search performance in Atlas:
- Go to Search > Indexes
- Click on your index name
- View metrics like query latency and index size

### Storage Considerations

- Each vector (1536 dimensions × 4 bytes) = ~6KB
- Additional metadata and content: ~2-4KB per document
- Total per document: ~8-10KB

### Best Practices

1. **Batch Operations**: When importing multiple vectors, batch them to reduce API calls
2. **Content Length**: Keep content between 50-500 words for optimal embeddings
3. **Regular Cleanup**: Implement a cleanup policy for old vectors
4. **Index Optimization**: Monitor and optimize indexes based on query patterns

## Troubleshooting

### Vector Search Not Working

1. Verify the index is created and active in Atlas
2. Check that your cluster tier supports vector search (M10+)
3. Ensure embeddings are being generated correctly (1536 dimensions)
4. Check the logs for any errors during embedding generation

### Fallback to Text Search

The system automatically falls back to text search if vector search fails. This ensures the application continues to work even if:
- Vector search index is not created
- Cluster doesn't support vector search
- There's an issue with the embedding generation

## Future Enhancements

1. **Multi-language Support**: Add embeddings for different Bible translations
2. **Shared Vectors**: Allow users to share certain vectors with study groups
3. **Vector Visualization**: Implement tools to visualize semantic relationships
4. **Advanced Filtering**: Add date ranges, Bible book filtering, etc.

---

For more information about MongoDB Atlas Vector Search, see the [official documentation](https://www.mongodb.com/docs/atlas/atlas-search/vector-search/).
