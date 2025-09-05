// Simple test script that can be run with Node.js
const { MongoClient } = require('mongodb');

async function testHighlightMatching() {
  console.log('🧪 Testing Highlight Reference Matching...\n');

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    // Test user ID
    const testUserId = 'test-user-123';
    const dbName = `user_${testUserId}`;
    const db = client.db(dbName);
    const highlights = db.collection('highlights');

    // Clear existing test highlights
    await highlights.deleteMany({ tags: 'test' });

    // Create test highlights
    const testHighlights = [
      {
        reference: '1JN.1.5',
        text: 'This then is the message which we have heard of him',
        type: 'manual',
        color: '#fef3c7',
        note: 'Test highlight 1',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        reference: '1JN.1.6',
        text: 'If we say that we have fellowship with him',
        type: 'manual',
        color: '#dbeafe',
        note: 'Test highlight 2',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        reference: 'GEN.1.1',
        text: 'In the beginning God created the heaven and the earth',
        type: 'manual',
        color: '#fef3c7',
        note: 'Test highlight 3',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log('📝 Creating test highlights...');
    const result = await highlights.insertMany(testHighlights);
    console.log(`✅ Created ${result.insertedCount} highlights\n`);

    // Test different reference formats
    console.log('🔍 Testing reference matching...\n');

    const testCases = [
      { 
        query: '1 John 1', 
        expected: 2, 
        description: 'Chapter reference "1 John 1"',
        mongoQuery: {
          $or: [
            { reference: { $regex: '^1JO\\.1\\.', $options: 'i' } },
            { reference: { $regex: '^1JN\\.1\\.', $options: 'i' } },
            { reference: { $regex: '^1JOHN\\.1\\.', $options: 'i' } },
            { reference: { $regex: '^1 John\\s+1:', $options: 'i' } },
            { reference: { $regex: '^1 John\\s+1\\.', $options: 'i' } },
            { reference: '1 John 1' }
          ]
        }
      },
      { 
        query: 'Genesis 1', 
        expected: 1, 
        description: 'Chapter reference "Genesis 1"',
        mongoQuery: {
          $or: [
            { reference: { $regex: '^GEN\\.1\\.', $options: 'i' } },
            { reference: { $regex: '^GENESIS\\.1\\.', $options: 'i' } },
            { reference: { $regex: '^Genesis\\s+1:', $options: 'i' } },
            { reference: { $regex: '^Genesis\\s+1\\.', $options: 'i' } },
            { reference: 'Genesis 1' }
          ]
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`Testing: ${testCase.description}`);
      console.log(`Query: "${testCase.query}"`);
      console.log('MongoDB Query:', JSON.stringify(testCase.mongoQuery, null, 2));
      
      const results = await highlights.find(testCase.mongoQuery).toArray();
      console.log(`Found: ${results.length} highlights (expected: ${testCase.expected})`);
      
      if (results.length === testCase.expected) {
        console.log('✅ PASS');
      } else {
        console.log('❌ FAIL');
        console.log('Found highlights:', results.map(h => h.reference));
      }
      console.log('');
    }

    // Clean up test highlights
    console.log('🧹 Cleaning up test highlights...');
    await highlights.deleteMany({ tags: 'test' });
    console.log('✅ Test highlights deleted');

    console.log('\n✨ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
  }
}

// Run the test
testHighlightMatching();
