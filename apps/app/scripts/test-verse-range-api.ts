// Test script to verify verse range API functionality

async function testVerseRangeAPI() {
  console.log('=== Testing Verse Range API ===');
  
  // Test passage parsing
  const testPassages = [
    'JHN.1.1-5',      // John 1:1-5
    'GEN.1.1-3',      // Genesis 1:1-3
    'PSA.23.1-6',     // Psalm 23:1-6
    'MAT.5.1-12',     // Matthew 5:1-12
  ];
  
  for (const passage of testPassages) {
    console.log(`\nTesting passage: ${passage}`);
    
    // Parse the passage
    const match = passage.match(/^([A-Z0-9]+)\.(\d+)\.(\d+)(?:-(\d+))?$/);
    if (match) {
      const [, bookId, chapter, startVerse, endVerse] = match;
      console.log('Parsed:', {
        bookId,
        chapter: parseInt(chapter),
        startVerse: parseInt(startVerse),
        endVerse: endVerse ? parseInt(endVerse) : parseInt(startVerse)
      });
    } else {
      console.error('Failed to parse passage');
    }
  }
  
  // Test URL construction
  const bibleId = 'de4e12af7f28f599-02'; // KJV
  const passageId = 'JHN.1.1-5';
  const url = `/api/bibles/${bibleId}/passages/${passageId}?content-type=html&include-verse-spans=true&include-verse-numbers=true`;
  console.log('\nAPI URL:', url);
  
  // Test verse range calculation
  const verseRange = { start: 1, end: 5 };
  console.log('\nVerse range:', verseRange);
  console.log('Expected verses: 1, 2, 3, 4, 5');
  console.log('Total verses:', verseRange.end - verseRange.start + 1);
}

// Run the test
testVerseRangeAPI();
