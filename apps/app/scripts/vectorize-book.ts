import { bibleService } from '@/lib/services/bible.service';
import { bibleVectorService } from '@/lib/services/bible-vector.service';
import { BibleVector } from '@repo/types';
import { getGenesisChapterTheme, getGenesisVerseThemes, genesisBookInfo } from '@/lib/data/genesis-themes';
import { getChapterTheme as getMatthewChapterTheme, getVerseThemes as getMatthewVerseThemes } from '@/lib/data/matthew-themes';
import { getExodusChapterTheme, getExodusVerseThemes, exodusBookInfo } from '@/lib/data/exodus-themes';
import { getLeviticusChapterTheme, getLeviticusChapterKeyTopics, getLeviticusVerseThemes, leviticusBookInfo } from '@/lib/data/leviticus-themes';
import { getNumbersChapterTheme, getNumbersChapterKeyTopics, getNumbersVerseThemes, numbersBookInfo } from '@/lib/data/numbers-themes';
import { getDeuteronomyChapterTheme, getDeuteronomyChapterKeyTopics, getDeuteronomyVerseThemes, deuteronomyBookInfo } from '@/lib/data/deuteronomy-themes';

// Book configurations
const bookConfigs = {
  'GEN': {
    getChapterTheme: getGenesisChapterTheme,
    getVerseThemes: getGenesisVerseThemes,
    bookInfo: genesisBookInfo
  },
  'EXO': {
    getChapterTheme: getExodusChapterTheme,
    getVerseThemes: getExodusVerseThemes,
    bookInfo: exodusBookInfo
  },
  'LEV': {
    getChapterTheme: getLeviticusChapterTheme,
    getVerseThemes: getLeviticusVerseThemes,
    bookInfo: leviticusBookInfo
  },
  'NUM': {
    getChapterTheme: getNumbersChapterTheme,
    getVerseThemes: getNumbersVerseThemes,
    bookInfo: numbersBookInfo
  },
  'DEU': {
    getChapterTheme: getDeuteronomyChapterTheme,
    getVerseThemes: getDeuteronomyVerseThemes,
    bookInfo: deuteronomyBookInfo
  },
  'MAT': {
    getChapterTheme: getMatthewChapterTheme,
    getVerseThemes: getMatthewVerseThemes,
    bookInfo: {
      name: "Matthew",
      description: "The Gospel of Jesus Christ",
      testament: "new" as const,
      genre: "gospel" as const,
      author: "Matthew",
      chapters: 28,
      verses: 1071,
      themes: ["Messiah", "Kingdom of Heaven", "fulfillment", "teaching", "discipleship"]
    }
  }
};

// Helper function to parse verses from chapter content
function parseVersesFromChapter(chapterContent: string, chapterNumber: number, bookName: string): Array<{
  number: number;
  text: string;
  reference: string;
}> {
  const verses: Array<{ number: number; text: string; reference: string }> = [];
  
  // Split by verse numbers (looking for patterns like "[1]" or "[10]")
  const versePattern = /\[(\d+)\]\s*([^\[]+?)(?=\[\d+\]|$)/g;
  let match;
  
  while ((match = versePattern.exec(chapterContent)) !== null) {
    const verseNumber = parseInt(match[1]);
    const verseText = match[2].trim();
    
    verses.push({
      number: verseNumber,
      text: verseText,
      reference: `${bookName} ${chapterNumber}:${verseNumber}`
    });
  }
  
  return verses;
}

// Helper to add delay between API calls to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function vectorizeBook(bookCode: string) {
  console.log(`Starting ${bookCode} vectorization process...`);
  
  const config = bookConfigs[bookCode as keyof typeof bookConfigs];
  if (!config) {
    throw new Error(`No configuration found for book code: ${bookCode}`);
  }
  
  try {
    // Step 1: Get available Bibles and find ESV
    console.log('Fetching available Bibles...');
    const bibles = await bibleService.getBibles({ 
      language: 'eng'
    });
    
    // Try to find ESV, or fall back to another English translation
    let selectedBible = bibles.find(b => 
      b.abbreviation === 'ESV' || 
      b.abbreviation === 'KJV' || 
      b.abbreviation === 'NIV' ||
      b.abbreviation === 'NKJV' ||
      b.abbreviation === 'ASV'
    ) || bibles[0]; // Use first available if none of the preferred ones are found
    
    if (!selectedBible) {
      throw new Error('No English Bible translation found');
    }
    
    console.log(`Using Bible translation: ${selectedBible.name} (${selectedBible.abbreviation})`);
    const bibleId = selectedBible.id;
    const translation = selectedBible.abbreviation || 'ESV';
    
    // Step 2: Get books and find the target book
    console.log('Fetching books...');
    const books = await bibleService.getBooks(bibleId);
    const targetBook = books.find(b => b.id.startsWith(bookCode));
    
    if (!targetBook) {
      throw new Error(`${bookCode} not found in this Bible`);
    }
    
    console.log(`Found ${targetBook.name}: ${targetBook.name}`);
    
    // Step 3: Create indexes before importing
    console.log('Creating database indexes...');
    await bibleVectorService.createIndexes();
    
    // Step 4: Process each chapter
    const totalChapters = config.bookInfo.chapters;
    let totalVersesProcessed = 0;
    
    for (let chapterNum = 1; chapterNum <= totalChapters; chapterNum++) {
      console.log(`\nProcessing chapter ${chapterNum}/${totalChapters}...`);
      
      const chapterId = `${targetBook.id}.${chapterNum}`;
      
      try {
        // Fetch chapter content
        const chapter = await bibleService.getChapter(
          bibleId, 
          chapterId,
          { 
            contentType: 'text',
            includeVerseNumbers: true,
            includeChapterNumbers: false,
            includeTitles: false,
            includeNotes: false
          }
        );
        
        // Parse verses from chapter content
        const verses = parseVersesFromChapter(chapter.content || '', chapterNum, config.bookInfo.name);
        
        if (verses.length === 0) {
          console.warn(`No verses found in chapter ${chapterNum}`);
          continue;
        }
        
        console.log(`Found ${verses.length} verses in chapter ${chapterNum}`);
        
        // Process verses in batches
        const batchSize = 10;
        const vectorBatch: BibleVector[] = [];
        
        for (let i = 0; i < verses.length; i++) {
          const verse = verses[i];
          const prevVerse = verses[i - 1]?.text || '';
          const nextVerse = verses[i + 1]?.text || '';
          
          // Get theme information
          const chapterTheme = config.getChapterTheme(chapterNum);
          const verseThemes = config.getVerseThemes(chapterNum, verse.number);
          
          // Create contextual embedding text
          const contextualText = bibleVectorService.createContextualText({
            reference: verse.reference,
            text: verse.text,
            chapter: chapterNum,
            verseNumber: verse.number
          }, {
            name: config.bookInfo.name,
            description: config.bookInfo.description,
            chapterTheme: chapterTheme,
            themes: verseThemes
          }, prevVerse, nextVerse);
          
          // Generate embedding
          console.log(`Generating embedding for ${verse.reference}...`);
          const embedding = await bibleVectorService.generateEmbedding(contextualText);
          
          // Create vector object
          const vector: BibleVector = {
            reference: verse.reference,
            book: bookCode,
            bookName: config.bookInfo.name,
            chapter: chapterNum,
            verse: verse.number,
            text: verse.text,
            translation: translation,
            chapterContext: chapterTheme,
            verseContext: contextualText,
            embedding: embedding,
            embeddingModel: 'text-embedding-004',
            embeddingDate: new Date(),
            testament: config.bookInfo.testament as 'old' | 'new',
            genre: config.bookInfo.genre as 'law' | 'history' | 'wisdom' | 'prophecy' | 'gospel' | 'epistle' | 'apocalyptic',
            themes: verseThemes
          };
          
          vectorBatch.push(vector);
          
          // Store batch when full or at end
          if (vectorBatch.length >= batchSize || i === verses.length - 1) {
            await bibleVectorService.storeBibleVectorsBatch(vectorBatch);
            totalVersesProcessed += vectorBatch.length;
            console.log(`Stored ${vectorBatch.length} verses. Total processed: ${totalVersesProcessed}`);
            vectorBatch.length = 0; // Clear batch
            
            // Small delay to avoid rate limiting
            await delay(200);
          }
        }
        
        // Delay between chapters to avoid rate limiting (increased from 1s to 3s)
        await delay(3000);
        
      } catch (error) {
        console.error(`Error processing chapter ${chapterNum}:`, error);
        // Continue with next chapter
      }
    }
    
    // Step 5: Get and display statistics
    console.log(`\n=== ${config.bookInfo.name} Vectorization Complete ===`);
    const stats = await bibleVectorService.getStatistics();
    console.log('Statistics:');
    console.log(`Total verses vectorized: ${stats.totalVerses}`);
    console.log('By translation:', stats.byTranslation);
    console.log('By book:', stats.byBook);
    
    // Close connection
    await bibleVectorService.close();
    
  } catch (error) {
    console.error('Fatal error during vectorization:', error);
    await bibleVectorService.close();
    process.exit(1);
  }
}

// Parse command line arguments
const bookCode = process.argv[2]?.toUpperCase();

if (!bookCode) {
  console.error('Please provide a book code as an argument');
  console.error('Usage: npm run vectorize-book GEN');
  console.error('Available books: GEN (Genesis), EXO (Exodus), LEV (Leviticus), NUM (Numbers), DEU (Deuteronomy), MAT (Matthew)');
  process.exit(1);
}

if (!bookConfigs[bookCode as keyof typeof bookConfigs]) {
  console.error(`Book code ${bookCode} is not configured yet`);
  console.error('Available books: GEN (Genesis), EXO (Exodus), LEV (Leviticus), NUM (Numbers), DEU (Deuteronomy), MAT (Matthew)');
  process.exit(1);
}

// Run the script
if (require.main === module) {
  console.log(`Bible Vectorization Script - ${bookCode}`);
  console.log('============================');
  console.log('This script will:');
  console.log(`1. Fetch ${bookConfigs[bookCode as keyof typeof bookConfigs].bookInfo.name} from the Bible API`);
  console.log('2. Generate embeddings for each verse with context');
  console.log('3. Store the vectors in MongoDB');
  console.log('4. Create necessary indexes for vector search');
  console.log(`\nEstimated time: ${Math.ceil(bookConfigs[bookCode as keyof typeof bookConfigs].bookInfo.chapters * 0.5)} minutes`);
  console.log(`Storage required: ~${Math.ceil(bookConfigs[bookCode as keyof typeof bookConfigs].bookInfo.verses * 0.008)}MB\n`);
  
  vectorizeBook(bookCode)
    .then(() => {
      console.log('\nScript completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nScript failed:', error);
      process.exit(1);
    });
}

export { vectorizeBook };
