import { bibleService } from '@/lib/services/bible.service';

async function debugChapterFormat() {
  try {
    // Get ASV Bible
    const bibles = await bibleService.getBibles({ language: 'eng' });
    const asv = bibles.find(b => b.abbreviation === 'ASV') || bibles[0];
    
    console.log(`Using: ${asv.name} (${asv.abbreviation})`);
    
    // Get Matthew
    const books = await bibleService.getBooks(asv.id);
    const matthew = books.find(b => b.id.startsWith('MAT'));
    
    if (!matthew) {
      throw new Error('Matthew not found');
    }
    
    // Fetch chapter 1 with different content types
    console.log('\n=== Testing different content types ===\n');
    
    // Test 1: Text format
    console.log('1. Content Type: text');
    const textChapter = await bibleService.getChapter(
      asv.id,
      `${matthew.id}.1`,
      { 
        contentType: 'text',
        includeVerseNumbers: true,
        includeChapterNumbers: false,
        includeTitles: false,
        includeNotes: false
      }
    );
    console.log('Content preview (first 500 chars):');
    console.log(textChapter.content?.substring(0, 500));
    console.log('\n---\n');
    
    // Test 2: JSON format
    console.log('2. Content Type: json');
    const jsonChapter = await bibleService.getChapter(
      asv.id,
      `${matthew.id}.1`,
      { 
        contentType: 'json',
        includeVerseNumbers: true
      }
    );
    console.log('Content type:', typeof jsonChapter.content);
    console.log('Content preview:');
    console.log(JSON.stringify(jsonChapter.content, null, 2).substring(0, 500));
    console.log('\n---\n');
    
    // Test 3: HTML format
    console.log('3. Content Type: html');
    const htmlChapter = await bibleService.getChapter(
      asv.id,
      `${matthew.id}.1`,
      { 
        contentType: 'html',
        includeVerseNumbers: true
      }
    );
    console.log('Content preview (first 500 chars):');
    console.log(htmlChapter.content?.substring(0, 500));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the debug script
if (require.main === module) {
  console.log('Chapter Format Debug Script');
  console.log('==========================\n');
  
  debugChapterFormat()
    .then(() => {
      console.log('\nDebug completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nDebug failed:', error);
      process.exit(1);
    });
}

export { debugChapterFormat };
