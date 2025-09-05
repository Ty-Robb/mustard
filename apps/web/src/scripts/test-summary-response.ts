import { getVertexAIService } from '../lib/services/vertex-ai.service';
import { ResponseParser } from '../lib/utils/response-parser';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testSummaryResponse() {
  console.log('Testing new summary response structure...\n');

  const vertexAIService = getVertexAIService();
  
  if (!vertexAIService.isAvailable()) {
    console.error('Vertex AI service is not available');
    return;
  }

  // Test question
  const testQuestion = "What city outside of the Vatican has the highest Christian percentage?";
  console.log(`Question: ${testQuestion}\n`);

  try {
    // Generate response
    const response = await vertexAIService.generateResponse(
      'general-assistant',
      [{ role: 'user', content: testQuestion }]
    );

    console.log('Raw Response:');
    console.log('=' .repeat(80));
    console.log(response);
    console.log('=' .repeat(80));
    console.log('\n');

    // Parse the response
    const parsed = ResponseParser.parseResponse(response);
    
    console.log('Parsed Response:');
    console.log('-' .repeat(80));
    console.log('Conversational:', parsed.conversational || '(none)');
    console.log('\nSummary:', parsed.summary || '(none)');
    console.log('\nContent Type:', parsed.contentType);
    console.log('\nContent Preview:');
    console.log(parsed.content.substring(0, 200) + '...');
    console.log('\nMetadata:', JSON.stringify(parsed.metadata, null, 2));
    console.log('-' .repeat(80));

    // Test with essay writer
    console.log('\n\nTesting Essay Writer Agent...\n');
    const essayPrompt = "Write a short essay about the importance of community in church life";
    
    const essayResponse = await vertexAIService.generateResponse(
      'essay-writer',
      [{ role: 'user', content: essayPrompt }]
    );

    const parsedEssay = ResponseParser.parseResponse(essayResponse);
    
    console.log('Essay Summary:', parsedEssay.summary || '(none)');
    console.log('\nEssay Content Type:', parsedEssay.contentType);
    console.log('\nEssay Word Count:', parsedEssay.metadata.wordCount);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testSummaryResponse().catch(console.error);
