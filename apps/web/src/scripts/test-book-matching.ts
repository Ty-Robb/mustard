import { bibleClientService } from '@/lib/services/bible-client.service';
import { MAIN_BIBLE_VERSIONS } from '@/config/bible-versions';

async function testBookMatching() {
  console.log('=== Testing Book Name Matching ===');
  
  try {
    // Get books from the Bible API
    const bibleId = MAIN_BIBLE_VERSIONS[0].id;
    console.log('Using Bible version:', bibleId);
    
    const books = await bibleClientService.getBooks(bibleId);
    console.log('\nAvailable books:');
    books.forEach(book => {
      console.log(`- ${book.name} (ID: ${book.id})`);
    });
    
    // Test passages from reading plans
    const testPassages = [
      'Genesis 1',
      'Exodus 20',
      'Psalm 119',
      'Psalms 1',
      'Matthew 1',
      'Hebrews 1',
      '1 John 2',
      'Acts 1'
    ];
    
    console.log('\n=== Testing Passage Parsing ===');
    testPassages.forEach(passage => {
      const match = passage.match(/^((?:\d\s)?[A-Za-z]+)\s+(\d+)(?:-(\d+))?$/);
      if (match) {
        const [, bookName, chapter] = match;
        console.log(`\nPassage: "${passage}"`);
        console.log(`Parsed book name: "${bookName}", chapter: ${chapter}`);
        
        // Try to find the book
        const book = books.find(b => {
          const nameMatch = b.name.toLowerCase() === bookName.toLowerCase() ||
                          b.id.toLowerCase() === bookName.toLowerCase() ||
                          b.name.toLowerCase().startsWith(bookName.toLowerCase()) ||
                          (bookName.toLowerCase() === 'psalm' && b.name.toLowerCase() === 'psalms') ||
                          (bookName.toLowerCase() === 'psalms' && b.name.toLowerCase() === 'psalm');
          return nameMatch;
        });
        
        if (book) {
          console.log(`✅ Found book: ${book.name} (ID: ${book.id})`);
        } else {
          console.log(`❌ No book found for: ${bookName}`);
          // Try to find similar books
          const similar = books.filter(b => 
            b.name.toLowerCase().includes(bookName.toLowerCase()) ||
            bookName.toLowerCase().includes(b.name.toLowerCase())
          );
          if (similar.length > 0) {
            console.log('Similar books:', similar.map(b => `${b.name} (${b.id})`).join(', '));
          }
        }
      } else {
        console.log(`\n❌ Failed to parse: "${passage}"`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testBookMatching();
