import { bibleService } from '@/lib/services/bible.service';
import { bibleVectorService } from '@/lib/services/bible-vector.service';
import { BibleVector } from '@/types/bible-vectors';
import { bibleBooks, getBookByCode, BibleBookMetadata } from '@/lib/data/bible-books-metadata';
import fs from 'fs';
import path from 'path';

// Import theme functions for books that have them
import { getGenesisChapterTheme, getGenesisVerseThemes, genesisBookInfo } from '@/lib/data/genesis-themes';
import { getChapterTheme as getMatthewChapterTheme, getVerseThemes as getMatthewVerseThemes } from '@/lib/data/matthew-themes';
import { getExodusChapterTheme, getExodusVerseThemes, exodusBookInfo } from '@/lib/data/exodus-themes';
import { getLeviticusChapterTheme, getLeviticusChapterKeyTopics, getLeviticusVerseThemes, leviticusBookInfo } from '@/lib/data/leviticus-themes';
import { getNumbersChapterTheme, getNumbersChapterKeyTopics, getNumbersVerseThemes, numbersBookInfo } from '@/lib/data/numbers-themes';
import { getDeuteronomyChapterTheme, getDeuteronomyChapterKeyTopics, getDeuteronomyVerseThemes, deuteronomyBookInfo } from '@/lib/data/deuteronomy-themes';

// Progress tracking interface
interface VectorizationProgress {
  lastCompleted: string | null;
  completedBooks: string[];
  totalVersesProcessed: number;
  startTime: string;
  lastUpdate: string;
  errors: Array<{
    book: string;
    error: string;
    timestamp: string;
  }>;
}

// Book configurations for those with themes
const bookConfigs: Record<string, any> = {
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

// Progress file path
const PROGRESS_FILE = path.join(process.cwd(), 'vectorization-progress.json');

// Helper function to load progress
function loadProgress(): VectorizationProgress {
  if (fs.existsSync(PROGRESS_FILE)) {
    const data = fs.readFileSync(PROGRESS_FILE, 'utf-8');
    return JSON.parse(data);
  }
  
  return {
    lastCompleted: null,
    completedBooks: [],
    totalVersesProcessed: 0,
    startTime: new Date().toISOString(),
    lastUpdate: new Date().toISOString(),
    errors: []
  };
}

// Helper function to save progress
function saveProgress(progress: VectorizationProgress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

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

// Helper to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Format time duration
function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

// Calculate dynamic delay based on book size
function calculateBookDelay(verseCount: number): number {
  if (verseCount < 100) {
    return 2 * 60 * 1000; // 2 minutes for very small books
  } else if (verseCount < 500) {
    return 5 * 60 * 1000; // 5 minutes for small books
  } else if (verseCount < 1000) {
    return 7 * 60 * 1000; // 7 minutes for medium books
  } else {
    return 10 * 60 * 1000; // 10 minutes for large books
  }
}

// Vectorize a single book
async function vectorizeBook(book: BibleBookMetadata, bibleId: string, translation: string): Promise<number> {
  console.log(`\n📖 Starting vectorization of ${book.name} (${book.code})...`);
  console.log(`   Chapters: ${book.chapters}, Expected verses: ${book.verses}`);
  
  const startTime = Date.now();
  let totalVersesProcessed = 0;
  
  try {
    // Get book from API
    const books = await bibleService.getBooks(bibleId);
    const targetBook = books.find(b => b.id.startsWith(book.code));
    
    if (!targetBook) {
      throw new Error(`${book.code} not found in this Bible`);
    }
    
    // Check if we have theme configuration
    const config = bookConfigs[book.code];
    const hasThemes = !!config;
    
    if (hasThemes) {
      console.log(`   ✓ Using detailed theme data for ${book.name}`);
    } else {
      console.log(`   ℹ Using basic metadata for ${book.name} (no themes available)`);
    }
    
    // Process each chapter
    for (let chapterNum = 1; chapterNum <= book.chapters; chapterNum++) {
      console.log(`   Processing chapter ${chapterNum}/${book.chapters}...`);
      
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
        const verses = parseVersesFromChapter(chapter.content || '', chapterNum, book.name);
        
        if (verses.length === 0) {
          console.warn(`   ⚠ No verses found in chapter ${chapterNum}`);
          continue;
        }
        
        // Process verses in batches
        const batchSize = 10;
        const vectorBatch: BibleVector[] = [];
        
        for (let i = 0; i < verses.length; i++) {
          const verse = verses[i];
          const prevVerse = verses[i - 1]?.text || '';
          const nextVerse = verses[i + 1]?.text || '';
          
          // Get theme information if available
          const chapterTheme = hasThemes ? config.getChapterTheme(chapterNum) : `Chapter ${chapterNum} of ${book.name}`;
          const verseThemes = hasThemes ? config.getVerseThemes(chapterNum, verse.number) : book.themes;
          
          // Create contextual embedding text
          const contextualText = bibleVectorService.createContextualText({
            reference: verse.reference,
            text: verse.text,
            chapter: chapterNum,
            verseNumber: verse.number
          }, {
            name: book.name,
            description: hasThemes ? config.bookInfo.description : `The book of ${book.name}`,
            chapterTheme: chapterTheme,
            themes: verseThemes
          }, prevVerse, nextVerse);
          
          // Generate embedding
          const embedding = await bibleVectorService.generateEmbedding(contextualText);
          
          // Create vector object
          const vector: BibleVector = {
            reference: verse.reference,
            book: book.code,
            bookName: book.name,
            chapter: chapterNum,
            verse: verse.number,
            text: verse.text,
            translation: translation,
            chapterContext: chapterTheme,
            verseContext: contextualText,
            embedding: embedding,
            embeddingModel: 'text-embedding-004',
            embeddingDate: new Date(),
            testament: book.testament,
            genre: book.genre,
            themes: verseThemes
          };
          
          vectorBatch.push(vector);
          
          // Store batch when full or at end
          if (vectorBatch.length >= batchSize || i === verses.length - 1) {
            await bibleVectorService.storeBibleVectorsBatch(vectorBatch);
            totalVersesProcessed += vectorBatch.length;
            vectorBatch.length = 0; // Clear batch
            
            // Small delay to avoid rate limiting
            await delay(200);
          }
        }
        
        // Delay between chapters
        await delay(3000);
        
      } catch (error) {
        console.error(`   ❌ Error processing chapter ${chapterNum}:`, error);
        // Continue with next chapter
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`   ✅ Completed ${book.name}: ${totalVersesProcessed} verses in ${formatDuration(duration)}`);
    
    return totalVersesProcessed;
    
  } catch (error) {
    console.error(`   ❌ Fatal error processing ${book.name}:`, error);
    throw error;
  }
}

// Main function to vectorize all books
async function vectorizeAllBooks() {
  console.log('🚀 Bible Vectorization Master Script');
  console.log('====================================\n');
  
  // Load progress
  const progress = loadProgress();
  console.log('📊 Loading progress...');
  console.log(`   Completed books: ${progress.completedBooks.length}/66`);
  console.log(`   Total verses processed: ${progress.totalVersesProcessed}`);
  
  if (progress.lastCompleted) {
    console.log(`   Last completed: ${progress.lastCompleted}`);
  }
  
  try {
    // Get available Bibles
    console.log('\n🔍 Fetching available Bibles...');
    const allBibles = await bibleService.getBibles({ language: 'eng' });
    
    // Filter out all ASV variants first
    const bibles = allBibles.filter(b => !b.abbreviation?.includes('ASV'));
    
    console.log(`   Found ${allBibles.length} Bibles, ${bibles.length} after excluding ASV variants`);
    
    // Define the top 5 translations we want (in order of preference)
    // Based on what's actually available in the API
    const preferredTranslations = [
      'engKJV',     // King James Version
      'BSB',        // Berean Standard Bible
      'WEB',        // World English Bible
      'FBV',        // Free Bible Version
      'engRV'       // Revised Version 1885
    ];
    
    // Try to find a preferred translation
    let selectedBible = null;
    for (const pref of preferredTranslations) {
      selectedBible = bibles.find(b => b.abbreviation === pref);
      if (selectedBible) break;
    }
    
    // Fallback to first available if none of the preferred are found
    if (!selectedBible) {
      selectedBible = bibles[0];
    }
    
    if (!selectedBible) {
      throw new Error('No English Bible translation found');
    }
    
    console.log(`   Using: ${selectedBible.name} (${selectedBible.abbreviation})`);
    const bibleId = selectedBible.id;
    const translation = selectedBible.abbreviation || 'ESV';
    
    // Create indexes
    console.log('\n🗄️  Creating database indexes...');
    await bibleVectorService.createIndexes();
    
    // Get books to process
    const booksToProcess = bibleBooks.filter(book => 
      !progress.completedBooks.includes(book.code)
    );
    
    console.log(`\n📚 Books to process: ${booksToProcess.length}`);
    
    // Process each book
    for (const book of booksToProcess) {
      console.log('\n' + '='.repeat(50));
      
      try {
        const versesProcessed = await vectorizeBook(book, bibleId, translation);
        
        // Update progress
        progress.lastCompleted = book.code;
        progress.completedBooks.push(book.code);
        progress.totalVersesProcessed += versesProcessed;
        progress.lastUpdate = new Date().toISOString();
        saveProgress(progress);
        
        // Get and display current statistics
        const stats = await bibleVectorService.getStatistics();
        console.log('\n📈 Current Statistics:');
        console.log(`   Total verses in database: ${stats.totalVerses}`);
        console.log(`   Books completed: ${progress.completedBooks.length}/66`);
        
        // Dynamic delay between books based on size
        if (booksToProcess.indexOf(book) < booksToProcess.length - 1) {
          const nextBook = booksToProcess[booksToProcess.indexOf(book) + 1];
          const delayTime = calculateBookDelay(nextBook.verses);
          const delayMinutes = Math.floor(delayTime / (60 * 1000));
          
          console.log(`\n⏳ Waiting ${delayMinutes} minutes before next book (${nextBook.name} - ${nextBook.verses} verses)...`);
          console.log('   (You can safely interrupt with Ctrl+C and resume later)');
          await delay(delayTime);
        }
        
      } catch (error) {
        console.error(`\n❌ Failed to process ${book.name}:`, error);
        
        // Log error
        progress.errors.push({
          book: book.code,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
        progress.lastUpdate = new Date().toISOString();
        saveProgress(progress);
        
        // Continue with next book after a shorter delay
        console.log('\n⏳ Waiting 5 minutes before trying next book...');
        await delay(5 * 60 * 1000);
      }
    }
    
    // Final statistics
    console.log('\n' + '='.repeat(50));
    console.log('✅ Vectorization Complete!');
    const stats = await bibleVectorService.getStatistics();
    console.log('\n📊 Final Statistics:');
    console.log(`   Total verses vectorized: ${stats.totalVerses}`);
    console.log('   By translation:', stats.byTranslation);
    console.log('   By book:', Object.keys(stats.byBook).length, 'books');
    
    // Calculate total time
    const totalTime = Date.now() - new Date(progress.startTime).getTime();
    console.log(`\n⏱️  Total time: ${formatDuration(totalTime)}`);
    
    // Close connection
    await bibleVectorService.close();
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    await bibleVectorService.close();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  console.log('Bible Vectorization Master Script');
  console.log('=================================');
  console.log('This script will:');
  console.log('1. Process all 66 books of the Bible sequentially');
  console.log('2. Use theme data when available');
  console.log('3. Track progress and allow resuming');
  console.log('4. Use dynamic delays based on book size:');
  console.log('   - < 100 verses: 2 minutes');
  console.log('   - 100-500 verses: 5 minutes');
  console.log('   - 500-1000 verses: 7 minutes');
  console.log('   - 1000+ verses: 10 minutes');
  console.log('\nEstimated time: ~20-25 hours for all books');
  console.log('You can safely interrupt and resume at any time.\n');
  
  vectorizeAllBooks()
    .then(() => {
      console.log('\n🎉 All books vectorized successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

export { vectorizeAllBooks };
