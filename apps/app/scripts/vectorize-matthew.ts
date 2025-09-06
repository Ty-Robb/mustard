import { bibleService } from '@/lib/services/bible.service';
import { bibleVectorService } from '@/lib/services/bible-vector.service';
import { BibleVector } from '@repo/types';
import { getChapterTheme, getVerseThemes } from '@/lib/data/matthew-themes';

// Helper function to parse verses from chapter content
function parseVersesFromChapter(chapterContent: string, chapterNumber: number): Array<{
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
      reference: `Matthew ${chapterNumber}:${verseNumber}`
    });
  }
  
  return verses;
}

// Helper to add delay between API calls to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function vectorizeMatthew() {
  console.log('Starting Matthew vectorization process...');
  
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
    
    // Step 2: Get books and find Matthew
    console.log('Fetching books...');
    const books = await bibleService.getBooks(bibleId);
    const matthew = books.find(b => b.id.startsWith('MAT'));
    
    if (!matthew) {
      throw new Error('Matthew not found in this Bible');
    }
    
    console.log(`Found Matthew: ${matthew.name}`);
    
    // Step 3: Create indexes before importing
    console.log('Creating database indexes...');
    await bibleVectorService.createIndexes();
    
    // Step 4: Process each chapter
    const totalChapters = 28;
    let totalVersesProcessed = 0;
    
    for (let chapterNum = 1; chapterNum <= totalChapters; chapterNum++) {
      console.log(`\nProcessing chapter ${chapterNum}/${totalChapters}...`);
      
      const chapterId = `${matthew.id}.${chapterNum}`;
      
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
        const verses = parseVersesFromChapter(chapter.content || '', chapterNum);
        
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
          
          // Create contextual embedding text
          const contextualText = bibleVectorService.createContextualText(
            {
              reference: verse.reference,
              text: verse.text,
              chapter: chapterNum,
              verseNumber: verse.number
            },
            {
              name: 'Matthew',
              description: 'The Gospel of Matthew presents Jesus as the promised Messiah and King',
              chapterTheme: getChapterTheme(chapterNum),
              themes: getVerseThemes(chapterNum, verse.number)
            },
            prevVerse,
            nextVerse
          );
          
          // Generate embedding
          console.log(`Generating embedding for ${verse.reference}...`);
          const embedding = await bibleVectorService.generateEmbedding(contextualText);
          
          // Create vector object
          const vector: BibleVector = {
            reference: verse.reference,
            book: 'MAT',
            bookName: 'Matthew',
            chapter: chapterNum,
            verse: verse.number,
            text: verse.text,
            translation: translation,
            chapterContext: getChapterTheme(chapterNum),
            verseContext: contextualText,
            embedding: embedding,
            embeddingModel: 'text-embedding-004',
            embeddingDate: new Date(),
            testament: 'new',
            genre: 'gospel',
            themes: getVerseThemes(chapterNum, verse.number)
          };
          
          vectorBatch.push(vector);
          
          // Store batch when full or at end
          if (vectorBatch.length >= batchSize || i === verses.length - 1) {
            await bibleVectorService.storeBibleVectorsBatch(vectorBatch);
            totalVersesProcessed += vectorBatch.length;
            console.log(`Stored ${vectorBatch.length} verses. Total processed: ${totalVersesProcessed}`);
            vectorBatch.length = 0; // Clear batch
            
            // Small delay to avoid rate limiting
            await delay(100);
          }
        }
        
        // Delay between chapters to avoid rate limiting
        await delay(1000);
        
      } catch (error) {
        console.error(`Error processing chapter ${chapterNum}:`, error);
        // Continue with next chapter
      }
    }
    
    // Step 5: Get and display statistics
    console.log('\n=== Vectorization Complete ===');
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

// Run the script
if (require.main === module) {
  console.log('Matthew Vectorization Script');
  console.log('============================');
  console.log('This script will:');
  console.log('1. Fetch the Gospel of Matthew from the Bible API');
  console.log('2. Generate embeddings for each verse with context');
  console.log('3. Store the vectors in MongoDB');
  console.log('4. Create necessary indexes for vector search');
  console.log('\nEstimated time: 10-15 minutes');
  console.log('Storage required: ~8.5MB\n');
  
  vectorizeMatthew()
    .then(() => {
      console.log('\nScript completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nScript failed:', error);
      process.exit(1);
    });
}

export { vectorizeMatthew };
