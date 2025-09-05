import { getChatService } from '../lib/services/chat.service';
import { getVertexAIService } from '../lib/services/vertex-ai.service';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testChatSummaryIntegration() {
  console.log('Testing Chat Summary Integration...\n');

  try {
    // Test 1: Check if Vertex AI is available
    console.log('1. Checking Vertex AI availability...');
    const vertexAI = getVertexAIService();
    if (!vertexAI.isAvailable()) {
      console.error('❌ Vertex AI is not available:', vertexAI.getInitializationError());
      return;
    }
    console.log('✅ Vertex AI is available\n');

    // Test 2: Test summary generation directly
    console.log('2. Testing summary generation...');
    const testQuestion = "What city outside of the Vatican has the highest Christian percentage?";
    console.log(`Question: "${testQuestion}"`);
    
    const summary = await vertexAI.generateResponse(
      'summary-generator',
      [{ role: 'user', content: testQuestion }]
    );
    console.log(`Summary: "${summary}"`);
    console.log('✅ Summary generated successfully\n');

    // Test 3: Test full response with [SUMMARY] and [CONTENT] tags
    console.log('3. Testing full response generation...');
    const fullResponse = await vertexAI.generateResponse(
      'general-assistant',
      [{ role: 'user', content: testQuestion }]
    );
    
    // Check if response contains the expected tags
    const hasSummaryTag = fullResponse.includes('[SUMMARY]') && fullResponse.includes('[/SUMMARY]');
    const hasContentTag = fullResponse.includes('[CONTENT]') && fullResponse.includes('[/CONTENT]');
    
    console.log(`Has [SUMMARY] tags: ${hasSummaryTag ? '✅' : '❌'}`);
    console.log(`Has [CONTENT] tags: ${hasContentTag ? '✅' : '❌'}`);
    
    if (hasSummaryTag && hasContentTag) {
      const summaryMatch = fullResponse.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/);
      const contentMatch = fullResponse.match(/\[CONTENT\]([\s\S]*?)\[\/CONTENT\]/);
      
      if (summaryMatch) {
        console.log(`\nExtracted Summary: "${summaryMatch[1].trim()}"`);
      }
      if (contentMatch) {
        console.log(`\nContent Preview: "${contentMatch[1].trim().substring(0, 100)}..."`);
      }
    }
    console.log('\n✅ Full response generated successfully\n');

    // Test 4: Test parallel generation with ChatService
    console.log('4. Testing parallel summary and content generation...');
    const chatService = getChatService('test-user-id');
    
    let receivedSummary = '';
    let receivedContent = '';
    
    const result = await chatService.generateCompletionWithSummary(
      [{ 
        id: '1', 
        role: 'user', 
        content: testQuestion, 
        timestamp: new Date() 
      }],
      'general-assistant',
      {},
      (chunk) => {
        receivedContent += chunk;
        process.stdout.write('.');
      },
      (summary) => {
        receivedSummary = summary;
        console.log(`\n📝 Summary received: "${summary}"`);
      }
    );
    
    console.log('\n');
    console.log(`Final Summary: "${result.summary}"`);
    console.log(`Content length: ${result.content.length} characters`);
    console.log('✅ Parallel generation completed successfully\n');

    // Test 5: Verify response parsing
    console.log('5. Testing response parsing...');
    const { ResponseParser } = await import('../lib/utils/response-parser');
    const parsed = ResponseParser.parseResponse(result.content);
    
    console.log(`Has summary in parsed response: ${parsed.summary ? '✅' : '❌'}`);
    console.log(`Content type: ${parsed.contentType}`);
    console.log(`Word count: ${parsed.metadata.wordCount}`);
    
    if (parsed.summary) {
      console.log(`Parsed summary: "${parsed.summary}"`);
    }
    
    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testChatSummaryIntegration().catch(console.error);
