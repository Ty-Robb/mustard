import { highlightsService } from '../lib/services/highlights.service';
import clientPromise from '../lib/mongodb';

async function testHighlightQuery() {
  console.log('Testing highlight query with different reference formats...\n');

  try {
    // Connect to database
    await clientPromise;

    // Test user ID (you'll need to replace this with a real user ID)
    const userId = 'test-user-id'; // Replace with actual Firebase UID

    // Test different reference formats
    const testReferences = [
      'Genesis 1',      // Chapter-level reference
      'GEN.1.3',       // Verse-specific reference
      '1 John 1',      // Book with number
      '1JN.1.5',       // Book ID with number
    ];

    for (const ref of testReferences) {
      console.log(`\nTesting reference: "${ref}"`);
      
      try {
        const highlights = await highlightsService.getHighlightsByReference(userId, ref);
        console.log(`Found ${highlights.length} highlights`);
        
        if (highlights.length > 0) {
          console.log('Sample highlights:');
          highlights.slice(0, 3).forEach(h => {
            console.log(`  - Reference: ${h.reference}, Text: "${h.text.substring(0, 50)}...", Type: ${h.type}`);
          });
        }
      } catch (error) {
        console.error(`Error fetching highlights for "${ref}":`, error);
      }
    }

    // Test getting all highlights to see what's in the database
    console.log('\n\nGetting all highlights to see reference formats:');
    const allHighlights = await highlightsService.getUserHighlights(userId, { limit: 10 });
    console.log(`Total highlights in database: ${allHighlights.length}`);
    
    if (allHighlights.length > 0) {
      console.log('\nReference formats in database:');
      const uniqueFormats = new Set<string>();
      allHighlights.forEach(h => {
        const format = h.reference.replace(/\d+/g, 'N');
        uniqueFormats.add(format);
      });
      
      uniqueFormats.forEach(format => {
        console.log(`  - ${format}`);
      });
      
      console.log('\nSample highlights:');
      allHighlights.slice(0, 5).forEach(h => {
        console.log(`  - Reference: ${h.reference}, Type: ${h.type}, Text: "${h.text.substring(0, 40)}..."`);
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
  }

  process.exit(0);
}

// Run the test
testHighlightQuery();
