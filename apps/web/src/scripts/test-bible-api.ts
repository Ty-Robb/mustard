import 'dotenv/config';

const BIBLE_API_KEY = process.env.BIBLE_API_KEY;
const BIBLE_API_BASE_URL = 'https://api.scripture.api.bible/v1';

async function testBibleAPI() {
  if (!BIBLE_API_KEY) {
    console.error('BIBLE_API_KEY is not set in environment variables');
    return;
  }

  const headers = {
    'api-key': BIBLE_API_KEY,
    'Content-Type': 'application/json',
  };

  console.log('Testing Bible API...\n');

  try {
    // 1. Search for "John 3:16" to find the correct verse ID
    console.log('1. Searching for "John 3:16" in KJV...');
    const searchUrl = `${BIBLE_API_BASE_URL}/bibles/de4e12af7f28f599-01/search?query=John+3:16`;
    const searchResponse = await fetch(searchUrl, { headers });
    const searchData = await searchResponse.json();
    
    if (searchData.data && searchData.data.verses && searchData.data.verses.length > 0) {
      const johnVerse = searchData.data.verses.find((v: any) => 
        v.reference.includes('John 3:16')
      );
      if (johnVerse) {
        console.log('Found John 3:16!');
        console.log('Verse ID:', johnVerse.id);
        console.log('Reference:', johnVerse.reference);
        console.log('Text:', johnVerse.text);
        console.log('\n');

        // 2. Try to fetch the verse directly using the found ID
        console.log('2. Fetching verse directly using ID:', johnVerse.id);
        const verseUrl = `${BIBLE_API_BASE_URL}/bibles/de4e12af7f28f599-01/verses/${johnVerse.id}`;
        const verseResponse = await fetch(verseUrl, { headers });
        
        if (verseResponse.ok) {
          const verseData = await verseResponse.json();
          console.log('Direct fetch successful!');
          console.log('Content:', verseData.data.content);
        } else {
          console.log('Direct fetch failed:', verseResponse.status, verseResponse.statusText);
        }
      }
    }

    // 3. Get list of books to see the correct book ID for John
    console.log('\n3. Getting list of books in KJV...');
    const booksUrl = `${BIBLE_API_BASE_URL}/bibles/de4e12af7f28f599-01/books`;
    const booksResponse = await fetch(booksUrl, { headers });
    const booksData = await booksResponse.json();
    
    const johnBook = booksData.data.find((book: any) => 
      book.name.toLowerCase().includes('john') && !book.name.includes('1') && !book.name.includes('2') && !book.name.includes('3')
    );
    
    if (johnBook) {
      console.log('Found Gospel of John:');
      console.log('Book ID:', johnBook.id);
      console.log('Book Name:', johnBook.name);
      console.log('Abbreviation:', johnBook.abbreviation);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testBibleAPI();
