// Test script to verify verse range filtering
// Run with: npx tsx src/scripts/test-verse-range-filtering.ts

console.log('Testing verse range filtering logic...\n');

// Simulate the verse filtering logic
function testVerseFiltering(verseRange: { start?: number; end?: number } | undefined, verses: number[]) {
  console.log(`Testing with verse range:`, verseRange);
  console.log(`Available verses:`, verses);
  
  const included: number[] = [];
  const skipped: number[] = [];
  
  verses.forEach(verseNumber => {
    if (verseRange && verseRange.start && verseRange.end) {
      if (verseNumber < verseRange.start || verseNumber > verseRange.end) {
        console.log(`  - Skipping verse ${verseNumber} (outside range ${verseRange.start}-${verseRange.end})`);
        skipped.push(verseNumber);
        return;
      }
    }
    console.log(`  + Including verse ${verseNumber}`);
    included.push(verseNumber);
  });
  
  console.log(`\nSummary: included ${included.length} verses, skipped ${skipped.length} verses`);
  console.log(`Included verses:`, included);
  console.log(`Skipped verses:`, skipped);
  console.log('\n---\n');
  
  return { included, skipped };
}

// Test cases
console.log('Test 1: John 1:1-5 (should include only verses 1-5)');
testVerseFiltering({ start: 1, end: 5 }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

console.log('Test 2: No verse range (should include all verses)');
testVerseFiltering(undefined, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

console.log('Test 3: Middle range (verses 5-10)');
testVerseFiltering({ start: 5, end: 10 }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

console.log('Test 4: Single verse (verse 16)');
testVerseFiltering({ start: 16, end: 16 }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

console.log('Test 5: Edge case - empty verse range object');
testVerseFiltering({}, [1, 2, 3, 4, 5]);

console.log('\nAll tests completed!');
