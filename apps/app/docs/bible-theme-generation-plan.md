# Bible Theme Generation Plan

## Overview
This document outlines the plan for generating theme files for the remaining 60 books of the Bible that need to be vectorized.

## Current Status
- **Total Books**: 66
- **Theme Files Created**: 6 (Genesis, Exodus, Leviticus, Numbers, Deuteronomy, Matthew)
- **Remaining**: 60 books

## Theme Generation Strategy

### Batch Processing Approach
To efficiently generate themes for all remaining books while respecting API rate limits:

1. **Process by Section**: Group books by biblical section for thematic consistency
2. **Batch Size**: Process 5-10 books per batch with 2-second delays between each
3. **Daily Limit**: Aim for 20-30 books per day to avoid API exhaustion

### Priority Order

#### Phase 1: Complete Old Testament (33 books)
1. **Historical Books** (12 books)
   - Joshua, Judges, Ruth
   - 1-2 Samuel, 1-2 Kings
   - 1-2 Chronicles, Ezra, Nehemiah, Esther

2. **Wisdom/Poetry** (5 books)
   - Job, Psalms (largest book - special handling needed)
   - Proverbs, Ecclesiastes, Song of Songs

3. **Major Prophets** (5 books)
   - Isaiah, Jeremiah, Lamentations
   - Ezekiel, Daniel

4. **Minor Prophets** (12 books)
   - Hosea through Malachi

#### Phase 2: Complete New Testament (27 books)
1. **Gospels** (3 remaining)
   - Mark, Luke, John

2. **History** (1 book)
   - Acts

3. **Pauline Epistles** (13 books)
   - Romans through Philemon

4. **General Epistles** (8 books)
   - Hebrews through Jude

5. **Apocalyptic** (1 book)
   - Revelation

## Implementation Commands

### Generate themes for a single book:
```bash
npm run generate-themes -- single <BOOK_CODE>
```

### Generate themes for all remaining books:
```bash
npm run generate-themes -- all
```

### Batch processing example:
```bash
# Historical Books batch
npm run generate-themes -- single JOS
npm run generate-themes -- single JDG
npm run generate-themes -- single RUT
# ... continue for each book
```

## Special Considerations

### Large Books
- **Psalms (150 chapters)**: May need special handling due to size
- **Isaiah (66 chapters)**: Second largest book
- **Jeremiah (52 chapters)**: Third largest book

### API Rate Limiting
- Gemini API: Monitor for rate limit errors
- Bible API: 3-second delay between chapter fetches
- Implement exponential backoff on errors

### Quality Assurance
After theme generation:
1. Verify all theme files are created
2. Check for consistent structure
3. Validate chapter counts match metadata
4. Test with sample vectorization

## Next Steps After Theme Generation

1. **Update vectorize-book.ts**: Add configurations for each new book
2. **Batch Vectorization**: Process books in groups
3. **Progress Monitoring**: Use monitor-vectorization.ts
4. **Database Optimization**: Create indexes after each batch

## Automation Script
Consider creating a batch processing script:

```typescript
// batch-generate-themes.ts
const bookBatches = [
  ['JOS', 'JDG', 'RUT'],
  ['1SA', '2SA', '1KI', '2KI'],
  // ... more batches
];

for (const batch of bookBatches) {
  for (const bookCode of batch) {
    await generateThemesForBook(bookCode);
    await delay(2000); // 2 second delay
  }
  await delay(10000); // 10 second delay between batches
}
```

## Timeline Estimate
- **Theme Generation**: 3-4 days (at 20 books/day)
- **Vectorization**: 2-3 weeks (processing 5-10 books/day)
- **Total Project**: ~3 weeks to complete all 66 books

## Monitoring Progress
Track progress in:
- `docs/bible-vectorization-progress.md`
- Database statistics via `npm run check-vector-stats`
- Error logs for failed generations
