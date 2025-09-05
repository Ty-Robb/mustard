// Debug script to check what highlights are in the database
const { MongoClient } = require('mongodb');

async function debugHighlights() {
  console.log('🔍 Debugging Highlights in Database...\n');

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    // Replace with your actual user ID
    const userId = process.env.TEST_USER_ID || 'test-user-123';
    console.log('Using user ID:', userId);
    
    const dbName = `user_${userId}`;
    const db = client.db(dbName);
    const highlights = db.collection('highlights');

    // Get all highlights
    console.log('\n📋 All highlights in database:');
    const allHighlights = await highlights.find({}).toArray();
    console.log(`Total highlights: ${allHighlights.length}\n`);
    
    allHighlights.forEach((h, i) => {
      console.log(`${i + 1}. Reference: ${h.reference}`);
      console.log(`   Type: ${h.type}`);
      console.log(`   Text: "${h.text.substring(0, 50)}..."`);
      console.log(`   Color: ${h.color}`);
      console.log(`   Created: ${h.createdAt}`);
      console.log('');
    });

    // Test specific queries
    console.log('\n🔍 Testing queries:');
    
    const testQueries = [
      {
        name: 'Genesis 1 (human readable)',
        query: {
          $or: [
            { reference: { $regex: '^GEN\\.1\\.', $options: 'i' } },
            { reference: { $regex: '^GENESIS\\.1\\.', $options: 'i' } },
            { reference: { $regex: '^Genesis\\s+1:', $options: 'i' } },
            { reference: { $regex: '^Genesis\\s+1\\.', $options: 'i' } },
            { reference: 'Genesis 1' }
          ]
        }
      },
      {
        name: 'Simple regex for GEN.1',
        query: { reference: { $regex: '^GEN\\.1\\.' } }
      },
      {
        name: 'All manual highlights',
        query: { type: 'manual' }
      }
    ];

    for (const test of testQueries) {
      console.log(`\nQuery: ${test.name}`);
      console.log('MongoDB query:', JSON.stringify(test.query, null, 2));
      const results = await highlights.find(test.query).toArray();
      console.log(`Found: ${results.length} highlights`);
      if (results.length > 0) {
        console.log('References:', results.map(h => h.reference));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

// Run the debug script
debugHighlights();
