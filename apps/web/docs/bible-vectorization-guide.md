# Bible Vectorization Guide

## Overview

This guide explains how to vectorize Bible books for semantic search using MongoDB Atlas Vector Search and Google's Gemini embedding model.

## Current Status

- ✅ Matthew (1,071 verses) - Completed
- 🚧 Genesis (1,533 verses) - Ready to vectorize
- ⏳ Remaining 64 books - Pending

## Architecture

### 1. Service Layer
- `bible-vector.service.ts` - Handles embedding generation and vector storage
- Now book-agnostic (previously hardcoded for Matthew)
- Uses Google's `text-embedding-004` model for 768-dimensional embeddings

### 2. Theme Files
Each book needs a theme file in `src/lib/data/[book-name]-themes.ts` containing:
- Chapter themes and descriptions
- Key topics for each chapter
- Verse-specific themes for important verses
- Book metadata (testament, genre, author, etc.)

Current theme files:
- `matthew-themes.ts` - Complete
- `genesis-themes.ts` - Complete

### 3. Vectorization Script
- `vectorize-book.ts` - Flexible script that can vectorize any configured book
- Handles rate limiting with delays between chapters (3s) and batches (200ms)
- Processes verses in batches of 10
- Includes contextual information (previous/next verses, themes)

## How to Vectorize a Book

### Step 1: Create Theme File (if not exists)
Create `src/lib/data/[book-name]-themes.ts` with:
```typescript
export const [book]ChapterThemes: MatthewChapterTheme[] = [
  {
    chapter: 1,
    theme: "Chapter theme",
    keyTopics: ["topic1", "topic2", ...]
  },
  // ... all chapters
];

export const [book]BookInfo = {
  name: "Book Name",
  description: "Book Description",
  testament: "old" | "new",
  genre: "law" | "history" | "wisdom" | "prophecy" | "gospel" | "epistle" | "apocalyptic",
  author: "Author Name",
  chapters: 50,
  verses: 1533,
  themes: ["theme1", "theme2", ...]
};
```

### Step 2: Add Book Configuration
Update `src/scripts/vectorize-book.ts` to add your book:
```typescript
const bookConfigs = {
  'GEN': {
    getChapterTheme: getGenesisChapterTheme,
    getVerseThemes: getGenesisVerseThemes,
    bookInfo: genesisBookInfo
  },
  // Add your book here
};
```

### Step 3: Run Vectorization
```bash
npm run vectorize-book GEN
```

## API Rate Limiting Considerations

The script includes several rate limiting strategies:
- 3 second delay between chapters
- 200ms delay between verse batches
- Batch processing (10 verses at a time)
- Error handling to continue on failure

For Genesis (50 chapters):
- Estimated API calls: ~52 (1 for Bibles, 1 for books, 50 for chapters)
- Estimated time: ~25 minutes
- Estimated storage: ~12MB

## MongoDB Atlas Vector Search

The vectors are stored with these indexes:
- Compound index on `reference` + `translation` (unique)
- Single indexes on: `book`, `chapter`, `translation`, `testament`, `genre`
- Text index on `searchableText` for fallback search
- Vector index on `embedding` field (configured in Atlas)

## Vector Structure

Each verse is stored with:
```typescript
{
  reference: "Genesis 1:1",
  book: "GEN",
  bookName: "Genesis",
  chapter: 1,
  verse: 1,
  text: "In the beginning God created...",
  translation: "ESV",
  chapterContext: "The Creation of the World",
  verseContext: "Full contextual text with surrounding verses",
  embedding: number[], // 768 dimensions
  embeddingModel: "text-embedding-004",
  embeddingDate: Date,
  testament: "old",
  genre: "law",
  themes: ["creation", "God speaks", "heavens and earth"]
}
```

## Next Steps for Full Bible Vectorization

1. **Create theme files for remaining books** - This is the most time-consuming part
2. **Consider API limits** - May need to spread vectorization over multiple days
3. **Monitor costs** - Both API calls and embedding generation may have costs
4. **Implement progress tracking** - For resuming failed vectorizations
5. **Add book metadata file** - Central registry of all books with chapter counts

## Troubleshooting

### Common Issues:
1. **Rate limiting errors** - Increase delays in the script
2. **Memory issues** - Reduce batch size
3. **API authentication** - Check BIBLE_API_KEY and GEMINI_API_KEY env vars
4. **MongoDB connection** - Verify MONGODB_URI and Atlas cluster status

### Checking Progress:
```bash
# Check vectorization stats
npm run test:vector-stats

# Test search functionality
npm run test:vector-search
```

## Future Enhancements

1. **Parallel processing** - Process multiple chapters simultaneously (with rate limit awareness)
2. **Resume capability** - Track progress and resume from failures
3. **Multi-translation support** - Vectorize multiple Bible translations
4. **Cross-reference embeddings** - Include cross-references in contextual text
5. **Automated theme generation** - Use AI to generate initial themes for books
