import { getVertexAIService } from '../lib/services/vertex-ai.service';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testChatResponseFormat() {
  console.log('Testing Chat Response Format...\n');

  const vertexAIService = getVertexAIService();
  
  if (!vertexAIService.isAvailable()) {
    console.error('Vertex AI service is not available');
    return;
  }

  // Test questions
  const testQuestions = [
    "What city outside of the Vatican has the highest Christian percentage?",
    "Explain the difference between justification and sanctification",
    "How do I improve youth engagement in church?",
    "Write a short sermon about faith and doubt"
  ];

  for (const question of testQuestions) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`QUESTION: ${question}`);
    console.log(`${'='.repeat(80)}\n`);

    try {
      // Test with general-assistant (should provide [SUMMARY] and [CONTENT])
      console.log('Testing with general-assistant agent:');
      const response = await vertexAIService.generateResponse(
        'general-assistant',
        [{ role: 'user', content: question }]
      );

      // Check if response contains proper format
      const hasSummary = response.includes('[SUMMARY]') && response.includes('[/SUMMARY]');
      const hasContent = response.includes('[CONTENT]') && response.includes('[/CONTENT]');

      console.log(`\nFormat Check:`);
      console.log(`- Has [SUMMARY] tags: ${hasSummary}`);
      console.log(`- Has [CONTENT] tags: ${hasContent}`);

      if (hasSummary && hasContent) {
        const summaryMatch = response.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/);
        const contentMatch = response.match(/\[CONTENT\]([\s\S]*?)\[\/CONTENT\]/);
        
        if (summaryMatch) {
          console.log(`\nExtracted Summary:`);
          console.log(summaryMatch[1].trim());
        }
        
        if (contentMatch) {
          console.log(`\nExtracted Content (first 200 chars):`);
          console.log(contentMatch[1].trim().substring(0, 200) + '...');
        }
      } else {
        console.log(`\nWARNING: Response does not follow expected format!`);
        console.log(`Response preview (first 500 chars):`);
        console.log(response.substring(0, 500) + '...');
      }

      // Also test with summary-generator for comparison
      console.log('\n---\nTesting with summary-generator agent:');
      const summaryOnly = await vertexAIService.generateResponse(
        'summary-generator',
        [{ role: 'user', content: question }]
      );
      console.log(`Summary: ${summaryOnly}`);

    } catch (error) {
      console.error(`Error testing question: ${error}`);
    }
  }
}

// Run the test
testChatResponseFormat().catch(console.error);
