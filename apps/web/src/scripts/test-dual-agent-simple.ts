import { getVertexAIService } from '../lib/services/vertex-ai.service';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testDualAgentSimple() {
  console.log('Testing Dual Agent Summary System (Simple)...\n');

  const vertexAIService = getVertexAIService();
  
  if (!vertexAIService.isAvailable()) {
    console.error('Vertex AI service is not available');
    return;
  }

  // Test question
  const testQuestion = "What city outside of the Vatican has the highest Christian percentage?";
  console.log(`Question: ${testQuestion}\n`);

  console.log('Starting parallel generation...\n');
  const startTime = Date.now();

  let summaryTime = 0;
  let contentTime = 0;

  try {
    // Start both requests in parallel
    const summaryPromise = vertexAIService.generateResponse(
      'summary-generator',
      [{ role: 'user', content: testQuestion }]
    ).then(summary => {
      summaryTime = Date.now() - startTime;
      console.log(`[${summaryTime}ms] Summary received:`);
      console.log('-'.repeat(80));
      console.log(summary);
      console.log('-'.repeat(80));
      return summary;
    });

    const contentPromise = vertexAIService.generateResponse(
      'general-assistant',
      [{ role: 'user', content: testQuestion }]
    ).then(content => {
      contentTime = Date.now() - startTime;
      console.log(`\n[${contentTime}ms] Full content received (${content.length} characters)`);
      return content;
    });

    // Wait for both to complete
    const [summary, content] = await Promise.all([summaryPromise, contentPromise]);

    const totalTime = Date.now() - startTime;
    console.log('\n' + '='.repeat(80));
    console.log('RESULTS:');
    console.log('='.repeat(80));
    console.log(`Summary time: ${summaryTime}ms`);
    console.log(`Content time: ${contentTime}ms`);
    console.log(`Total time: ${totalTime}ms`);
    console.log(`Time saved by parallel processing: ${contentTime - totalTime}ms`);
    console.log(`\nSummary (${summary.length} chars): ${summary}`);
    console.log(`\nContent preview (first 200 chars): ${content.substring(0, 200)}...`);
    console.log('='.repeat(80));

    // Test with essay writer
    console.log('\n\nTesting with Essay Writer...\n');
    
    const essayPrompt = "Write a short essay about the importance of community in church life";
    const essayStartTime = Date.now();
    
    const [essaySummary, essayContent] = await Promise.all([
      vertexAIService.generateResponse(
        'summary-generator',
        [{ role: 'user', content: essayPrompt }]
      ),
      vertexAIService.generateResponse(
        'essay-writer',
        [{ role: 'user', content: essayPrompt }]
      )
    ]);

    console.log(`Essay generation complete in ${Date.now() - essayStartTime}ms`);
    console.log(`Summary: ${essaySummary}`);
    console.log(`Content length: ${essayContent.length} characters`);

    // Compare models
    console.log('\n\nModel Comparison:');
    console.log('Summary Agent: gemini-1.5-flash (fast, efficient)');
    console.log('Content Agents: gemini-2.5-pro (comprehensive, detailed)');
    console.log('\nThe summary agent provides immediate feedback while the main content is being generated.');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testDualAgentSimple().catch(console.error);
