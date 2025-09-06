// Test script to verify verse range filtering

const testPassage = "John 1:1-5";
const match = testPassage.match(/^((?:\d\s)?[A-Za-z]+)\s+(\d+)(?:[:.-](\d+))?(?:-(\d+))?(?::(\d+))?$/);

if (match) {
  const [, bookName, chapter, startVerse, endChapterOrVerse, endVerse] = match;
  console.log('Parsed:', { bookName, chapter, startVerse, endChapterOrVerse, endVerse });
  
  if (startVerse) {
    const start = parseInt(startVerse);
    const end = endVerse ? parseInt(endVerse) : (endChapterOrVerse ? parseInt(endChapterOrVerse) : start);
    console.log('Verse range:', { start, end });
    
    // Test filtering
    for (let i = 1; i <= 10; i++) {
      if (i >= start && i <= end) {
        console.log(`Verse ${i}: SHOW`);
      } else {
        console.log(`Verse ${i}: HIDE`);
      }
    }
  }
}
