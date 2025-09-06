import { getVertexAIService } from '@/lib/services/vertex-ai.service';
import { VisualizationParser } from '@/lib/utils/visualization-parser';

async function testMethodistVisualization() {
  console.log('Testing Methodist Church split visualization...\n');

  const vertexAI = getVertexAIService();
  
  if (!vertexAI.isAvailable()) {
    console.error('VertexAI service is not available:', vertexAI.getInitializationError());
    return;
  }

  // Test with explicit visualization request
  const prompts = [
    {
      agentId: 'general-assistant',
      message: 'Show me the split between the Methodist Church with a chart showing the division that recently happened. Include a pie chart showing the percentage of churches that left vs stayed.'
    },
    {
      agentId: 'data-visualization',
      message: 'Create a visualization showing the Methodist Church split, including how many churches left to form the Global Methodist Church vs how many stayed in the UMC'
    }
  ];

  for (const { agentId, message } of prompts) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing with ${agentId}:`);
    console.log(`Prompt: "${message}"`);
    console.log(`${'='.repeat(80)}\n`);

    try {
      const response = await vertexAI.generateResponse(
        agentId,
        [{ role: 'user', content: message }]
      );

      console.log('Raw Response:');
      console.log(response);
      console.log('\n' + '-'.repeat(80) + '\n');

      // Process visualization
      const { cleanContent, attachments } = VisualizationParser.processResponse(response);
      
      console.log('Clean Content:');
      console.log(cleanContent);
      console.log('\n' + '-'.repeat(80) + '\n');
      
      console.log('Attachments Found:', attachments.length);
      if (attachments.length > 0) {
        console.log('Attachments:', JSON.stringify(attachments, null, 2));
      }

    } catch (error) {
      console.error(`Error with ${agentId}:`, error);
    }
  }
}

// Run the test
testMethodistVisualization().catch(console.error);
