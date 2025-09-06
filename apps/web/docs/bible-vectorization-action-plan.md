# Bible Vectorization Action Plan

## Executive Summary
This action plan outlines the steps to complete vectorization of all 66 books of the Bible (~31,000 verses) over the next 3-4 weeks. The project will enable powerful semantic search capabilities across the entire Bible.

## Current Status (as of today)
- ✅ Infrastructure: Complete
- ✅ Scripts: Ready
- 📊 Progress: 3 books with themes, 2.5 books vectorized (~3,800 verses / 12%)
- ⏱️ Time to completion: 3-4 weeks

## Week 1: Foundation & Pentateuch
**Goal**: Complete all 5 Pentateuch books (5,852 verses)

### Day 1-2: Complete Current Work
- [x] Finish Exodus vectorization (in progress)
- [ ] Generate themes for Leviticus (27 chapters)
- [ ] Generate themes for Numbers (36 chapters)
- [ ] Generate themes for Deuteronomy (34 chapters)

### Day 3-4: Vectorize Remaining Pentateuch
- [ ] Vectorize Leviticus (859 verses)
- [ ] Vectorize Numbers (1,288 verses)
- [ ] Vectorize Deuteronomy (959 verses)

### Day 5: Quality Check & Optimization
- [ ] Test search across all Pentateuch books
- [ ] Optimize batch sizes based on performance
- [ ] Document any issues or improvements

## Week 2: Historical & Wisdom Books
**Goal**: Complete 17 books (Historical + Wisdom = 7,903 verses)

### Day 1-2: Generate Themes
- [ ] Historical books themes (12 books)
- [ ] Wisdom/Poetry themes (5 books)

### Day 3-5: Vectorize Books
- [ ] Small books first (Ruth, Esther, etc.)
- [ ] Medium books (Samuel, Kings, Chronicles)
- [ ] Large books (Job, Psalms, Proverbs)

## Week 3: Prophets & Gospels
**Goal**: Complete 21 books (Prophets + Gospels = 8,547 verses)

### Day 1-2: Generate Themes
- [ ] Major Prophets themes (5 books)
- [ ] Minor Prophets themes (12 books)
- [ ] Gospels themes (3 remaining)

### Day 3-5: Vectorize Books
- [ ] Minor Prophets (small books)
- [ ] Major Prophets (Isaiah, Jeremiah, Ezekiel)
- [ ] Gospels (Mark, Luke, John)

## Week 4: New Testament & Finalization
**Goal**: Complete remaining 22 books (8,800 verses) and finalize project

### Day 1-2: Generate Themes
- [ ] Acts theme
- [ ] Pauline Epistles themes (13 books)
- [ ] General Epistles themes (8 books)
- [ ] Revelation theme

### Day 3-4: Vectorize Books
- [ ] Acts (1,007 verses)
- [ ] All Epistles (small books)
- [ ] Revelation (404 verses)

### Day 5: Final Quality Assurance
- [ ] Verify all 31,102 verses vectorized
- [ ] Run comprehensive search tests
- [ ] Generate final statistics report
- [ ] Update all documentation

## Daily Workflow

### Morning (2-3 hours)
1. Generate themes for 5-10 books using AI script
2. Review and adjust generated themes
3. Commit theme files to repository

### Afternoon (3-4 hours)
1. Run vectorization for 2-3 books
2. Monitor progress and handle any errors
3. Update progress documentation

### Evening (1 hour)
1. Run statistics check
2. Test search functionality
3. Plan next day's books

## Automation Scripts to Run

### Theme Generation
```bash
# Generate themes for a single book
npm run generate-themes single <BOOK_CODE>

# Example for multiple books
for book in LEV NUM DEU; do
  npm run generate-themes single $book
  sleep 60  # Pause between books
done
```

### Vectorization
```bash
# Vectorize a single book
npm run vectorize-book <BOOK_CODE>

# Monitor progress in another terminal
npm run monitor-progress <BOOK_CODE>
```

### Progress Checking
```bash
# Check overall statistics
npm run check-vector-stats

# Test search functionality
npm run test:vector-search
```

## Risk Mitigation

### API Rate Limits
- **Risk**: Hitting Gemini API limits
- **Mitigation**: 
  - Process max 10 books per day
  - Implement exponential backoff
  - Use batch processing

### Network Failures
- **Risk**: Connection timeouts
- **Mitigation**:
  - Implement retry logic
  - Save progress after each chapter
  - Resume capability

### Data Quality
- **Risk**: Poor theme generation
- **Mitigation**:
  - Manual review of AI-generated themes
  - Test searches for each completed book
  - Iterate on problematic themes

## Success Criteria
1. ✅ All 66 books have theme files
2. ✅ All 31,102 verses successfully vectorized
3. ✅ Search returns relevant results for test queries
4. ✅ No data corruption or missing verses
5. ✅ Performance meets targets (<100ms search time)

## Tools & Resources

### Scripts
- `generate-bible-themes.ts` - AI theme generation
- `vectorize-book.ts` - Book vectorization
- `check-vector-stats.ts` - Progress monitoring
- `monitor-vectorization.ts` - Real-time monitoring

### Documentation
- `bible-vectorization-guide.md` - Technical guide
- `bible-vectorization-progress.md` - Progress tracking
- `bible-books-metadata.ts` - Book registry

### APIs
- Bible API: https://api.scripture.api.bible
- Gemini API: Google AI Studio
- MongoDB Atlas: Vector Search cluster

## Next Immediate Actions
1. ✅ Wait for Exodus to complete (~15 minutes)
2. Generate themes for Leviticus
3. Start Leviticus vectorization
4. Update progress documentation

## Contact & Support
- MongoDB Atlas Dashboard: [Check vector search index]
- API Keys: Stored in `.env.local`
- Error Logs: Check terminal output and MongoDB logs
