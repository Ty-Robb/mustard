import { getChatService } from '../lib/services/chat.service';
import { getVertexAIService } from '../lib/services/vertex-ai.service';
import { ChatMessage } from '../types/chat';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Mock user ID for testing
const TEST_USER_ID = 'test-user-123';

async function testDualAgentSummary() {
  console.log('Testing Dual Agent Summary System...\n');

  const chatService = getChatService(TEST_USER_ID);
  const vertexAIService = getVertexAIService();
  
  if (!vertexAIService.isAvailable()) {
    console.error('Vertex AI service is not available');
    return;
  }

  // Test question
  const testQuestion = "What city outside of the Vatican has the highest Christian percentage?";
  console.log(`Question: ${testQuestion}\n`);

  // Test messages
  const messages: ChatMessage[] = [
    { 
      id: '1',
      role: 'user',
      content: testQuestion,
      timestamp: new Date()
    }
  ];

  let summaryReceived = false;
  let summaryTime = 0;
  let contentStartTime = 0;
  let fullContent = '';

  console.log('Starting parallel generation...\n');
  const startTime = Date.now();

  try {
    // Test the dual response generation
    const result = await chatService.generateCompletionWithSummary(
      messages,
      'general-assistant',
      { stream: true },
      (chunk) => {
        if (!contentStartTime) {
          contentStartTime = Date.now() - startTime;
          console.log(`\n[${contentStartTime}ms] Content streaming started`);
        }
        fullContent += chunk;
        process.stdout.write('.');
      },
      (summary) => {
        summaryTime = Date.now() - startTime;
        summaryReceived = true;
        console.log(`[${summaryTime}ms] Summary received:`);
        console.log('-'.repeat(80));
        console.log(summary);
        console.log('-'.repeat(80));
      }
    );

    const totalTime = Date.now() - startTime;
    console.log('\n\n' + '='.repeat(80));
    console.log('RESULTS:');
    console.log('='.repeat(80));
    console.log(`Summary received: ${summaryReceived ? 'YES' : 'NO'}`);
    console.log(`Summary time: ${summaryTime}ms`);
    console.log(`Content start time: ${contentStartTime}ms`);
    console.log(`Total time: ${totalTime}ms`);
    console.log(`\nSummary: ${result.summary}`);
    console.log(`\nContent length: ${result.content.length} characters`);
    console.log('='.repeat(80));

    // Test with different agents
    console.log('\n\nTesting with Essay Writer Agent...\n');
    
    const essayPrompt = "Write a short essay about the importance of community in church life";
    const essayStartTime = Date.now();
    
    const essayResult = await chatService.generateCompletionWithSummary(
      [{ 
        id: '2',
        role: 'user',
        content: essayPrompt,
        timestamp: new Date()
      }],
      'essay-writer',
      { stream: false },
      undefined,
      (summary) => {
        const time = Date.now() - essayStartTime;
        console.log(`[${time}ms] Essay summary: ${summary}`);
      }
    );

    console.log(`\nEssay generation complete in ${Date.now() - essayStartTime}ms`);
    console.log(`Summary: ${essayResult.summary}`);
    console.log(`Content length: ${essayResult.content.length} characters`);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testDualAgentSummary().catch(console.error);
