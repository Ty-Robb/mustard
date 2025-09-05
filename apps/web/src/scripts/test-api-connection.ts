import { bibleVectorService } from '@/lib/services/bible-vector.service';

async function testAPIConnection() {
  console.log('Testing API Connection...\n');
  
  console.log('Environment variables check:');
  console.log('- MONGODB_URI:', !!process.env.MONGODB_URI);
  console.log('- GEMINI_API_KEY:', !!process.env.GEMINI_API_KEY);
  console.log();
  
  try {
    // Test 1: Get statistics
    console.log('1. Testing database connection with getStatistics...');
    const stats = await bibleVectorService.getStatistics();
    console.log('✓ Statistics retrieved successfully:');
    console.log('  Total verses:', stats.totalVerses);
    console.log('  By translation:', stats.byTranslation);
    console.log('  By book:', stats.byBook);
    console.log();
    
    // Test 2: Simple search
    console.log('2. Testing search functionality...');
    const searchResults = await bibleVectorService.searchBibleVectors('love', {
      limit: 3,
      minScore: 0.5
    });
    console.log(`✓ Search returned ${searchResults.length} results`);
    if (searchResults.length > 0) {
      console.log('  First result:', {
        reference: searchResults[0].reference,
        score: searchResults[0].score,
        text: searchResults[0].text.substring(0, 50) + '...'
      });
    }
    console.log();
    
    console.log('✅ All tests passed! The API connection is working properly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('\nError details:');
    if (error instanceof Error) {
      console.error('- Message:', error.message);
      console.error('- Stack:', error.stack);
    }
  } finally {
    await bibleVectorService.close();
  }
}

// Run the test
if (require.main === module) {
  console.log('API Connection Test');
  console.log('==================\n');
  
  testAPIConnection()
    .then(() => {
      console.log('\nTest completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nTest failed:', error);
      process.exit(1);
    });
}

export { testAPIConnection };
