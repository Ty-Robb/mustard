import { VertexAIService } from '@/lib/services/vertex-ai.service';
import { VisualizationParser } from '@/lib/utils/visualization-parser';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testMethodistChartGeneration() {
  console.log('Testing Methodist Church split visualization generation...\n');

  const vertexAI = new VertexAIService();
  
  // Test with the exact prompt from the user
  const userPrompt = "show me the split between the methodist church showing the split that recently happened";
  
  console.log('User prompt:', userPrompt);
  console.log('\n---\n');

  try {
    // Test with General Assistant agent
    console.log('Testing with General Assistant agent...');
    const response = await vertexAI.generateResponse(
      'general-assistant',
      [{ role: 'user', content: userPrompt }]
    );

    console.log('AI Response:');
    console.log(response);
    console.log('\n---\n');

    // Check if visualization was generated
    const hasVisualization = VisualizationParser.containsVisualization(response);
    console.log('Contains visualization?', hasVisualization);

    if (hasVisualization) {
      const { cleanContent, attachments } = VisualizationParser.processResponse(response);
      console.log('\nClean content (first 500 chars):');
      console.log(cleanContent.substring(0, 500) + '...');
      console.log('\nAttachments found:', attachments.length);
      
      attachments.forEach((attachment, index) => {
        console.log(`\nAttachment ${index + 1}:`);
        console.log('Type:', attachment.type);
        console.log('Name:', attachment.name);
        console.log('Config:', JSON.stringify(attachment.config, null, 2));
        if (attachment.type === 'chart') {
          console.log('Chart data:', JSON.stringify(attachment.data, null, 2));
        } else if (attachment.type === 'table' && attachment.data) {
          const tableData = attachment.data as any;
          console.log('Table headers:', tableData.headers);
          console.log('Table rows (first 3):', tableData.rows?.slice(0, 3));
        }
      });
    } else {
      console.log('\nNo visualization JSON found in response!');
      console.log('This is the issue - the AI is not generating visualization JSON.');
      
      // Check if the response mentions groups or statistics that should have a visualization
      const shouldHaveVisualization = VisualizationParser.shouldAddVisualization(response);
      console.log('\nShould have visualization based on content?', shouldHaveVisualization);
      
      if (shouldHaveVisualization) {
        const suggestedType = VisualizationParser.suggestVisualizationType(response);
        console.log('Suggested visualization type:', suggestedType);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testMethodistChartGeneration().catch(console.error);
