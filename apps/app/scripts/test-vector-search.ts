import { bibleVectorService } from '../lib/services/bible-vector.service';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testVectorSearch() {
  try {
    console.log('=== Testing Bible Vector Search ===\n');
    
    // First, let's check if we have any vectors in the database
    const stats = await bibleVectorService.getStatistics();
    console.log('Database statistics:', stats);
    console.log('\n');
    
    // Test different queries
    const queries = [
      'love',
      'faith',
      'kingdom of heaven',
      'forgiveness',
      'Jesus'
    ];
    
    for (const query of queries) {
      console.log(`\nSearching for: "${query}"`);
      console.log('-'.repeat(50));
      
      // Try with different minScore values
      const scores = [0.0, 0.3, 0.5, 0.7];
      
      for (const minScore of scores) {
        const results = await bibleVectorService.searchBibleVectors(query, {
          limit: 5,
          minScore: minScore
        });
        
        console.log(`\nWith minScore ${minScore}: ${results.length} results`);
        
        if (results.length > 0) {
          console.log('Top results:');
          results.slice(0, 3).forEach((result, i) => {
            console.log(`${i + 1}. ${result.reference} (score: ${result.score?.toFixed(3)})`);
            console.log(`   "${result.text.substring(0, 100)}..."`);
          });
          break; // Found results, no need to try lower scores
        }
      }
    }
    
    // Close the connection
    await bibleVectorService.close();
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  }
}

// Run the test
testVectorSearch();
