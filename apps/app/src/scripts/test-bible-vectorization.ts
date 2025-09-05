import { bibleService } from '@/lib/services/bible.service';
import { bibleVectorService } from '@/lib/services/bible-vector.service';
import { getChapterTheme, getVerseThemes } from '@/lib/data/matthew-themes';

async function testBibleVectorization() {
  console.log('Testing Bible Vectorization Setup...\n');
  
  try {
    // Test 1: Check Bible API connection
    console.log('1. Testing Bible API connection...');
    const bibles = await bibleService.getBibles({ language: 'eng' });
    console.log(`✓ Found ${bibles.length} English Bibles`);
    
    // Log available translations
    console.log('Available translations:', bibles.slice(0, 5).map(b => `${b.name} (${b.abbreviation})`));
    
    const selectedBible = bibles.find(b => 
      b.abbreviation === 'ESV' || 
      b.abbreviation === 'KJV' || 
      b.abbreviation === 'NIV' ||
      b.abbreviation === 'NKJV' ||
      b.abbreviation === 'ASV'
    ) || bibles[0]; // Use first available if none of the preferred ones are found
    
    if (!selectedBible) {
      throw new Error('No English Bible translation found');
    }
    
    console.log(`✓ Selected: ${selectedBible.name} (${selectedBible.abbreviation})\n`);
    
    // Test 2: Fetch Matthew chapter 1
    console.log('2. Testing Matthew chapter fetch...');
    const books = await bibleService.getBooks(selectedBible.id);
    const matthew = books.find(b => b.id.startsWith('MAT'));
    
    if (!matthew) {
      throw new Error('Matthew not found');
    }
    
    const chapter = await bibleService.getChapter(
      selectedBible.id,
      `${matthew.id}.1`,
      { contentType: 'text', includeVerseNumbers: true }
    );
    
    console.log(`✓ Fetched Matthew chapter 1`);
    console.log(`  Content preview: ${chapter.content?.substring(0, 100)}...\n`);
    
    // Test 3: Test embedding generation
    console.log('3. Testing embedding generation...');
    const testText = "For God so loved the world that he gave his only Son";
    const embedding = await bibleVectorService.generateEmbedding(testText);
    console.log(`✓ Generated embedding with ${embedding.length} dimensions\n`);
    
    // Test 4: Test contextual text generation
    console.log('4. Testing contextual text generation...');
    const contextualText = bibleVectorService.createContextualText(
      {
        reference: "Matthew 1:1",
        text: "The book of the genealogy of Jesus Christ, the son of David, the son of Abraham.",
        chapter: 1,
        verseNumber: 1
      },
      {
        name: "Matthew",
        description: "The Gospel of Matthew presents Jesus as the promised Messiah and King",
        chapterTheme: getChapterTheme(1),
        themes: getVerseThemes(1, 1)
      }
    );
    console.log('✓ Generated contextual text:');
    console.log(contextualText.substring(0, 200) + '...\n');
    
    // Test 5: Test database connection and indexes
    console.log('5. Testing database connection...');
    await bibleVectorService.createIndexes();
    console.log('✓ Database connected and indexes created\n');
    
    // Test 6: Test storing a single verse
    console.log('6. Testing verse storage...');
    const testVector = {
      reference: "Matthew 1:1",
      book: "MAT",
      bookName: "Matthew",
      chapter: 1,
      verse: 1,
      text: "The book of the genealogy of Jesus Christ, the son of David, the son of Abraham.",
      translation: selectedBible.abbreviation || 'TEST',
      chapterContext: getChapterTheme(1),
      verseContext: contextualText,
      embedding: embedding,
      embeddingModel: 'text-embedding-004',
      embeddingDate: new Date(),
      testament: 'new' as const,
      genre: 'gospel',
      themes: getVerseThemes(1, 1)
    };
    
    await bibleVectorService.storeBibleVector(testVector);
    console.log('✓ Successfully stored test verse\n');
    
    // Test 7: Test search functionality
    console.log('7. Testing search functionality...');
    const searchResults = await bibleVectorService.searchBibleVectors(
      "genealogy of Jesus",
      { limit: 5 }
    );
    
    console.log(`✓ Search returned ${searchResults.length} results`);
    if (searchResults.length > 0) {
      console.log(`  Top result: ${searchResults[0].reference} (score: ${searchResults[0].score.toFixed(3)})`);
    }
    
    // Get statistics
    console.log('\n8. Database statistics:');
    const stats = await bibleVectorService.getStatistics();
    console.log(`  Total verses: ${stats.totalVerses}`);
    console.log(`  By translation:`, stats.byTranslation);
    console.log(`  By book:`, stats.byBook);
    
    console.log('\n✅ All tests passed! Ready to vectorize Matthew.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await bibleVectorService.close();
  }
}

// Run the test
if (require.main === module) {
  console.log('Bible Vectorization Test Script');
  console.log('==============================\n');
  
  testBibleVectorization()
    .then(() => {
      console.log('\nTest completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nTest failed:', error);
      process.exit(1);
    });
}

export { testBibleVectorization };
