#!/usr/bin/env npx tsx

/**
 * Test script to verify verse ID detection in highlighting
 */

console.log('Testing verse ID detection logic...\n');

// Simulate the verse ID detection logic
function findVerseIdFromText(beforeText: string, chapterInfo: { bookId: string, number: number }) {
  // Find all verse numbers before the selection
  const verseMatches = [...beforeText.matchAll(/(\d+)\s/g)];
  
  if (verseMatches.length > 0) {
    // Get the last verse number before the selection
    const lastVerseNum = verseMatches[verseMatches.length - 1][1];
    return `${chapterInfo.bookId}.${chapterInfo.number}.${lastVerseNum}`;
  }
  
  return null;
}

// Test cases
const testCases = [
  {
    name: 'Selection in verse 3',
    beforeText: '1 In the beginning God created the heaven and the earth. 2 And the earth was without form, and void; and darkness was upon the face of the deep. 3 And God said, Let there be',
    chapterInfo: { bookId: 'GEN', number: 1 },
    expected: 'GEN.1.3'
  },
  {
    name: 'Selection in verse 1',
    beforeText: '1 In the beginning God',
    chapterInfo: { bookId: 'GEN', number: 1 },
    expected: 'GEN.1.1'
  },
  {
    name: 'Selection before any verse number',
    beforeText: 'Chapter heading text without verse',
    chapterInfo: { bookId: 'GEN', number: 1 },
    expected: null
  },
  {
    name: 'Multiple digit verse number',
    beforeText: '10 And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good. 11 And God said, Let the earth',
    chapterInfo: { bookId: 'GEN', number: 1 },
    expected: 'GEN.1.11'
  }
];

console.log('Running test cases:\n');

testCases.forEach((testCase, index) => {
  const result = findVerseIdFromText(testCase.beforeText, testCase.chapterInfo);
  const passed = result === testCase.expected;
  
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log(`  Got: ${result}`);
  console.log(`  Status: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`);
});

// Test the enhanced fallback logic
console.log('\nTesting enhanced fallback logic:');

function getVerseIdWithFallback(
  beforeText: string, 
  chapterInfo: { bookId: string, number: number }
): string {
  const verseId = findVerseIdFromText(beforeText, chapterInfo);
  
  if (verseId) {
    return verseId;
  }
  
  // Enhanced fallback: try to determine verse from position
  const verseMatches = [...beforeText.matchAll(/(\d+)\s/g)];
  
  if (verseMatches.length > 0) {
    const lastVerseNum = verseMatches[verseMatches.length - 1][1];
    return `${chapterInfo.bookId}.${chapterInfo.number}.${lastVerseNum}`;
  } else {
    // Final fallback: use chapter-level reference with verse 1
    return `${chapterInfo.bookId}.${chapterInfo.number}.1`;
  }
}

const fallbackTest = getVerseIdWithFallback('No verse numbers here', { bookId: 'GEN', number: 1 });
console.log(`Fallback for text without verse numbers: ${fallbackTest}`);
console.log(`Expected: GEN.1.1`);
console.log(`Status: ${fallbackTest === 'GEN.1.1' ? '✅ PASSED' : '❌ FAILED'}`);

console.log('\n✨ Test completed!');
