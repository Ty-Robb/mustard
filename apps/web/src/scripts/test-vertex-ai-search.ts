/**
 * Test script for Vertex AI Search functionality
 */

import { VertexAIService } from '../lib/services/vertex-ai.service';
import { genkitService } from '../lib/services/genkit.service';
import { getAgent, defaultAgentRegistry } from '../lib/agents/agent-registry';

async function testVertexAISearch() {
  console.log('🔍 Testing Vertex AI Search functionality...\n');

  const vertexAI = new VertexAIService();

  // Test 1: Direct Vertex AI Search
  console.log('Test 1: Direct Vertex AI Search');
  console.log('================================');
  try {
    const searchQuery = 'latest developments in AI and machine learning 2024';
    console.log(`Query: "${searchQuery}"`);
    
    const response = await vertexAI.generateContentWithSearch(
      `Search for information about: ${searchQuery}
      
Please provide the top 5 most relevant search results with:
1. Title of the source
2. A brief snippet or summary
3. The source URL (if available)

Format the response as a list of search results.`,
      'gemini-2.5-flash',
      { temperature: 0.3, maxTokens: 1024 }
    );

    console.log('\nResponse:');
    console.log(response);
    console.log('\n');
  } catch (error) {
    console.error('Error in direct search test:', error);
  }

  // Test 2: Genkit Service with Research Agent
  console.log('\nTest 2: Genkit Service with Research Agent');
  console.log('==========================================');
  try {
    const researchAgent = getAgent(defaultAgentRegistry, 'research-agent');
    if (!researchAgent) {
      console.error('Research agent not found');
      return;
    }

    const result = await genkitService.executeFlow('research-agent', {
      task: 'Research the impact of artificial intelligence on healthcare in 2024',
      agent: researchAgent
    });

    console.log('Task: Research the impact of artificial intelligence on healthcare in 2024');
    console.log('\nResult:');
    console.log(result.result);
    console.log('\nMetadata:');
    console.log(JSON.stringify(result.metadata, null, 2));
  } catch (error) {
    console.error('Error in Genkit research test:', error);
  }

  // Test 3: Critical Appraisal with Multiple Searches
  console.log('\n\nTest 3: Critical Appraisal with Multiple Perspectives');
  console.log('====================================================');
  try {
    const criticalAgent = getAgent(defaultAgentRegistry, 'critical-appraiser');
    if (!criticalAgent) {
      console.error('Critical appraisal agent not found');
      return;
    }

    const result = await genkitService.executeFlow('critical-appraiser', {
      task: 'Evaluate the pros and cons of remote work for software development teams',
      agent: criticalAgent
    });

    console.log('Task: Evaluate the pros and cons of remote work for software development teams');
    console.log('\nResult (first 500 chars):');
    console.log(result.result.substring(0, 500) + '...');
    console.log('\nSources found:', result.metadata?.sources?.length || 0);
  } catch (error) {
    console.error('Error in critical appraisal test:', error);
  }

  console.log('\n✅ Vertex AI Search tests completed!');
}

// Run the test
testVertexAISearch().catch(console.error);
