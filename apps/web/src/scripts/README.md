# Bible Vectorization Scripts

This directory contains scripts for vectorizing Bible content to enable semantic search.

## Prerequisites

1. **Environment Variables**: Ensure these are set in your `.env.local`:
   - `MONGODB_URI`: Your MongoDB connection string
   - `BIBLE_API_KEY`: Your Bible API key
   - `GEMINI_API_KEY`: Your Google Gemini API key

2. **MongoDB Atlas**: 
   - Cluster must be M10 or higher for vector search
   - Create the vector search index in Atlas UI (see docs/bible-vectorization.md)

## Available Scripts

### 1. Master Vectorization Script (NEW)
Automatically vectorizes all 66 books of the Bible with progress tracking:

```bash
npm run vectorize-all
```

Features:
- Processes all books sequentially with 10-minute delays between books
- Tracks progress in `vectorization-progress.json`
- Can be safely interrupted and resumed
- Uses theme data when available (Genesis, Exodus, Leviticus, Numbers, Deuteronomy, Matthew)
- Falls back to basic metadata for books without themes
- Estimated time: ~30 hours for all books

### 2. Vectorize Individual Book
Vectorizes a single book of the Bible:

```bash
npm run vectorize-book [BOOK_CODE]

# Examples:
npm run vectorize-book NUM    # Numbers
npm run vectorize-book DEU    # Deuteronomy
npm run vectorize-book JHN    # John
```

Available books with themes:
- GEN (Genesis) ✓
- EXO (Exodus) ✓
- LEV (Leviticus) ✓
- NUM (Numbers)
- DEU (Deuteronomy)
- MAT (Matthew) ✓

### 3. Check Vector Statistics
View current vectorization progress:

```bash
npm run check-vector-stats
```

Shows:
- Total verses vectorized
- Breakdown by translation
- Breakdown by book
- Database statistics

### 4. Test Bible Vectorization Setup
Tests all components before running the full import:

```bash
npm run tsx src/scripts/test-bible-vectorization.ts
```

This will:
- Test Bible API connection
- Verify Matthew is available
- Test embedding generation
- Create database indexes
- Store a test verse
- Verify search functionality

### 5. Other Test Scripts

- `test-bible-api.ts` - Test Bible API connection
- `test-verse-range.ts` - Test verse range parsing
- `test-gemini-insights.ts` - Test Gemini AI integration
- `test-vector-search.ts` - Test vector search functionality

## Running the Scripts

1. **First Time Setup**:
   ```bash
   # Test the setup
   npm run tsx src/scripts/test-bible-vectorization.ts
   
   # If successful, run the import
   npm run tsx src/scripts/vectorize-matthew.ts
   ```

2. **Monitor Progress**:
   - The script logs progress for each chapter
   - Shows embedding generation for each verse
   - Displays total verses processed

3. **Verify Success**:
   - Check the stats endpoint: `/api/bible-vectors/stats`
   - Test search at: `/test-bible-search`

## Troubleshooting

### "GEMINI_API_KEY is not set"
Add your Gemini API key to `.env.local`:
```
GEMINI_API_KEY=your-key-here
```

### "No suitable English Bible translation found"
The Bible API might not have ESV/KJV/NIV available. The script will use the first available English translation.

### Rate Limiting Errors
The script includes delays between chapters. If you still hit rate limits:
- Increase the delay in the script
- Run the script during off-peak hours
- Process fewer chapters at a time

### Vector Search Not Working
1. Ensure you created the vector index in MongoDB Atlas
2. Verify your cluster is M10 or higher
3. Check that embeddings are 1536 dimensions
4. Use the fallback text search if vector search fails

## Next Steps

After successfully vectorizing Matthew:

1. **Test the Search**:
   - Navigate to `/test-bible-search`
   - Try searches like "love your neighbor" or "kingdom of heaven"

2. **Expand Coverage**:
   - Modify the script to vectorize other books
   - Add support for multiple translations

3. **Integration**:
   - Add semantic search to your Bible reader
   - Build recommendation features
   - Create thematic study tools

## Performance Notes

- **Embedding Generation**: ~100ms per verse
- **Total Time**: ~10-15 minutes for Matthew
- **Storage**: ~8.5MB for Matthew
- **API Calls**: ~1,100 (one per verse + chapters)

Remember to respect API rate limits and run imports during appropriate times.
