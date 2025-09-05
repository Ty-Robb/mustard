import { bibleService } from '@/lib/services/bible.service';

async function testConnection() {
  console.log('Testing Bible API connection...\n');
  
  try {
    console.log('1. Fetching available Bibles...');
    const bibles = await bibleService.getBibles({ language: 'eng' });
    console.log(`✓ Found ${bibles.length} English Bibles`);
    
    if (bibles.length > 0) {
      console.log('\nAvailable translations:');
      bibles.slice(0, 5).forEach(bible => {
        console.log(`  - ${bible.name} (${bible.abbreviation})`);
      });
      
      // Test fetching a book
      const bible = bibles[0];
      console.log(`\n2. Testing with ${bible.name}...`);
      
      const books = await bibleService.getBooks(bible.id);
      console.log(`✓ Found ${books.length} books`);
      
      // Test fetching a chapter
      const genesis = books.find(b => b.id.startsWith('GEN'));
      if (genesis) {
        console.log(`\n3. Fetching Genesis 1...`);
        const chapter = await bibleService.getChapter(bible.id, `${genesis.id}.1`);
        console.log(`✓ Successfully fetched chapter`);
        console.log(`  Content length: ${chapter.content?.length || 0} characters`);
      }
    }
    
    console.log('\n✅ Bible API connection successful!');
    
  } catch (error) {
    console.error('\n❌ Bible API connection failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

if (require.main === module) {
  testConnection()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
