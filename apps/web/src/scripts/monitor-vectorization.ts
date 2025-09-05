import { bibleVectorService } from '@/lib/services/bible-vector.service';
import { getBookByCode } from '@/lib/data/bible-books-metadata';

async function monitorProgress(bookCode: string) {
  const book = getBookByCode(bookCode);
  if (!book) {
    console.error(`Book ${bookCode} not found`);
    return;
  }

  console.log(`Monitoring vectorization progress for ${book.name}...`);
  console.log('Press Ctrl+C to stop\n');

  let lastCount = 0;
  const startTime = Date.now();

  const checkProgress = async () => {
    try {
      const stats = await bibleVectorService.getStatistics();
      const bookStats = stats.byBook[bookCode] || 0;
      
      if (bookStats !== lastCount) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const rate = bookStats / (elapsed / 60); // verses per minute
        const remaining = book.verses - bookStats;
        const eta = remaining / rate; // minutes
        
        console.log(`[${new Date().toLocaleTimeString()}] ${book.name}: ${bookStats}/${book.verses} verses (${Math.round(bookStats / book.verses * 100)}%)`);
        console.log(`  Rate: ${Math.round(rate)} verses/min | ETA: ${Math.round(eta)} minutes`);
        console.log('');
        
        lastCount = bookStats;
      }
      
      // Check if complete
      if (bookStats >= book.verses) {
        console.log(`✅ ${book.name} vectorization complete!`);
        console.log(`Total time: ${Math.round((Date.now() - startTime) / 1000 / 60)} minutes`);
        await bibleVectorService.close();
        process.exit(0);
      }
    } catch (error) {
      console.error('Error checking progress:', error);
    }
  };

  // Check every 10 seconds
  setInterval(checkProgress, 10000);
  
  // Initial check
  await checkProgress();
}

// Get book code from command line
const bookCode = process.argv[2]?.toUpperCase();

if (!bookCode) {
  console.error('Please provide a book code to monitor');
  console.error('Usage: npm run monitor-progress EXO');
  process.exit(1);
}

if (require.main === module) {
  monitorProgress(bookCode).catch(error => {
    console.error('Monitor failed:', error);
    process.exit(1);
  });
}
