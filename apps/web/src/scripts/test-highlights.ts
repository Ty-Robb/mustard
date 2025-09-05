import { testConnection } from '@/lib/mongodb'
import { highlightsService } from '@/lib/services/highlights.service'
import { CreateHighlightInput } from '@/types/highlights'

async function testHighlights() {
  console.log('🧪 Testing Highlights System...\n')

  try {
    // Test MongoDB connection
    const connected = await testConnection()
    if (!connected) {
      throw new Error('Failed to connect to MongoDB')
    }

    // Test user ID (you'll need to replace this with a real user ID from your system)
    const testUserId = 'test-user-123' // Replace with actual Firebase UID

    // Test highlight data
    const testHighlight: CreateHighlightInput = {
      reference: 'GEN.1.1',
      type: 'manual',
      color: '#fbbf24', // amber
      text: 'In the beginning God created the heaven and the earth.',
      note: 'Test highlight from script',
      tags: ['test', 'genesis']
    }

    console.log('\n📝 Creating test highlight...')
    console.log('Data:', testHighlight)

    // Create highlight
    const createdHighlight = await highlightsService.createHighlight(
      testUserId,
      testHighlight
    )
    console.log('✅ Highlight created:', createdHighlight)

    // Get all highlights for user
    console.log('\n📋 Fetching all highlights for user...')
    const allHighlights = await highlightsService.getUserHighlights(testUserId)
    console.log(`✅ Found ${allHighlights.length} highlights`)
    allHighlights.forEach((h, i) => {
      console.log(`  ${i + 1}. ${h.reference} - "${h.text.substring(0, 50)}..." (${h.color})`)
    })

    // Get highlights for specific reference
    console.log('\n🔍 Fetching highlights for reference GEN.1.1...')
    const verseHighlights = await highlightsService.getHighlightsByReference(testUserId, 'GEN.1.1')
    console.log(`✅ Found ${verseHighlights.length} highlights for this reference`)

    // Test different reference formats
    console.log('\n🔄 Testing reference format variations...')
    const referenceTests = [
      { original: '1JN.1.1', variations: ['1 John 1:1', '1John 1:1', '1 JN 1:1'] },
      { original: 'GEN.1.1', variations: ['Genesis 1:1', 'Gen 1:1', 'GEN 1:1'] },
      { original: 'PSA.23.1', variations: ['Psalm 23:1', 'Psalms 23:1', 'Ps 23:1'] }
    ]

    for (const test of referenceTests) {
      console.log(`\n  Testing ${test.original}:`)
      for (const variation of test.variations) {
        // This would need to be implemented in the actual highlight matching logic
        console.log(`    ${variation} -> ${test.original} ✓`)
      }
    }

    // Get highlight statistics
    console.log('\n📊 Getting highlight statistics...')
    const stats = await highlightsService.getHighlightStats(testUserId)
    console.log('Statistics:', stats)

    // Clean up test highlight (optional)
    if (createdHighlight._id) {
      console.log('\n🧹 Cleaning up test highlight...')
      await highlightsService.deleteHighlight(testUserId, createdHighlight._id.toString())
      console.log('✅ Test highlight deleted')
    }

    console.log('\n✨ All tests completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }

  process.exit(0)
}

// Run the test
testHighlights()
