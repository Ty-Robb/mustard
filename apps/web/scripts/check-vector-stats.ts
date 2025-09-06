import { bibleVectorService } from '@/lib/services/bible-vector.service';
import { getVectorizationProgress } from '@/lib/data/bible-books-metadata';

async function checkVectorStats() {
  console.log('Bible Vectorization Statistics');
  console.log('==============================\n');
  
  try {
    // Get stats from MongoDB
    const stats = await bibleVectorService.getStatistics();
    
    console.log('Current Database Statistics:');
    console.log(`Total verses vectorized: ${stats.totalVerses}`);
    console.log('\nBy Translation:');
    Object.entries(stats.byTranslation).forEach(([translation, count]) => {
      console.log(`  ${translation}: ${count} verses`);
    });
    
    console.log('\nBy Book:');
    Object.entries(stats.byBook).forEach(([book, count]) => {
      console.log(`  ${book}: ${count} verses`);
    });
    
    // Get progress from metadata
    const progress = getVectorizationProgress();
    
    console.log('\n\nOverall Progress:');
    console.log(`Books: ${progress.vectorizedBooks}/${progress.totalBooks} (${progress.percentageBooks.toFixed(1)}%)`);
    console.log(`Verses: ${progress.vectorizedVerses}/${progress.totalVerses} (${progress.percentageVerses.toFixed(1)}%)`);
    
    console.log('\n\nNext Steps:');
    console.log('- Genesis is ready to vectorize (themes already created)');
    console.log('- 64 more books need theme files created');
    console.log(`- Estimated total API calls: ~${Math.ceil(progress.totalVerses / 10)} (batches of 10)`);
    console.log(`- Estimated total time: ~${Math.ceil(progress.totalVerses / 10 * 0.3 / 60)} hours`);
    
    await bibleVectorService.close();
  } catch (error) {
    console.error('Error checking statistics:', error);
    await bibleVectorService.close();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  checkVectorStats()
    .then(() => {
      console.log('\nDone!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nScript failed:', error);
      process.exit(1);
    });
}

export { checkVectorStats };
