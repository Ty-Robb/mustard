import { testConnection } from '@/lib/mongodb'
import { highlightsService } from '@/lib/services/highlights.service'

async function testHighlightMatching() {
  console.log('🧪 Testing Highlight Reference Matching...\n')

  try {
    // Test MongoDB connection
    const connected = await testConnection()
    if (!connected) {
      throw new Error('Failed to connect to MongoDB')
    }

    // Test user ID (you'll need to replace this with a real user ID from your system)
    const testUserId = 'test-user-123' // Replace with actual Firebase UID

    // Create test highlights with different reference formats
    const testHighlights = [
      {
        reference: '1JN.1.5',
        text: 'This then is the message which we have heard of him',
        type: 'manual' as const,
        color: '#fef3c7',
        note: 'Test highlight 1',
        tags: ['test']
      },
      {
        reference: '1JN.1.6',
        text: 'If we say that we have fellowship with him',
        type: 'manual' as const,
        color: '#dbeafe',
        note: 'Test highlight 2',
        tags: ['test']
      },
      {
        reference: 'GEN.1.1',
        text: 'In the beginning God created the heaven and the earth',
        type: 'manual' as const,
        color: '#fef3c7',
        note: 'Test highlight 3',
        tags: ['test']
      }
    ]

    console.log('📝 Creating test highlights...')
    const createdHighlights = []
    for (const highlight of testHighlights) {
      const created = await highlightsService.createHighlight(testUserId, highlight)
      createdHighlights.push(created)
      console.log(`✅ Created highlight: ${highlight.reference}`)
    }

    // Test different reference formats
    console.log('\n🔍 Testing reference matching...\n')

    const testCases = [
      { query: '1 John 1', expected: 2, description: 'Chapter reference "1 John 1"' },
      { query: '1John 1', expected: 2, description: 'Chapter reference "1John 1" (no space)' },
      { query: 'Genesis 1', expected: 1, description: 'Chapter reference "Genesis 1"' },
      { query: 'Gen 1', expected: 1, description: 'Chapter reference "Gen 1"' },
      { query: '1JN.1.5', expected: 1, description: 'Exact verse reference "1JN.1.5"' },
    ]

    for (const testCase of testCases) {
      console.log(`Testing: ${testCase.description}`)
      console.log(`Query: "${testCase.query}"`)
      
      const results = await highlightsService.getHighlightsByReference(testUserId, testCase.query)
      console.log(`Found: ${results.length} highlights (expected: ${testCase.expected})`)
      
      if (results.length === testCase.expected) {
        console.log('✅ PASS')
      } else {
        console.log('❌ FAIL')
        console.log('Found highlights:', results.map(h => h.reference))
      }
      console.log('')
    }

    // Clean up test highlights
    console.log('🧹 Cleaning up test highlights...')
    for (const highlight of createdHighlights) {
      if (highlight._id) {
        await highlightsService.deleteHighlight(testUserId, highlight._id.toString())
      }
    }
    console.log('✅ Test highlights deleted')

    console.log('\n✨ All tests completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }

  process.exit(0)
}

// Run the test
testHighlightMatching()
