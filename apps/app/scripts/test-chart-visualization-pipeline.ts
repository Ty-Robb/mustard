import { VisualizationParser } from '@/lib/utils/visualization-parser';
import { VertexAIService } from '@/lib/services/vertex-ai.service';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testChartVisualizationPipeline() {
  console.log('Testing Chart Visualization Pipeline...\n');

  // Test 1: Check if AI generates visualization blocks
  console.log('=== Test 1: AI Visualization Generation ===');
  const testPrompt = 'Compare the membership statistics of major Christian denominations: Catholic Church has 1.3 billion members, Protestant churches have 800 million, Orthodox churches have 300 million, and Anglican churches have 85 million members.';
  
  try {
    const vertexService = new VertexAIService();
    const response = await vertexService.generateResponse(
      'general-assistant', // Using general assistant agent which has visualization prompts
      [{ role: 'user', content: testPrompt }]
    );

    console.log('AI Response:');
    console.log('-------------------');
    console.log(response);
    console.log('-------------------\n');

    // Test 2: Check if parser detects visualizations
    console.log('=== Test 2: Visualization Detection ===');
    const containsViz = VisualizationParser.containsVisualization(response);
    console.log('Contains visualization:', containsViz);

    // Test 3: Extract visualizations
    console.log('\n=== Test 3: Visualization Extraction ===');
    const visualizations = VisualizationParser.extractVisualizations(response);
    console.log('Extracted visualizations:', visualizations.length);
    
    if (visualizations.length > 0) {
      visualizations.forEach((viz, index) => {
        console.log(`\nVisualization ${index + 1}:`);
        console.log('Type:', viz.type);
        console.log('Config:', JSON.stringify(viz.config, null, 2));
        console.log('Data:', JSON.stringify(viz.data, null, 2));
      });
    }

    // Test 4: Process response (clean content + attachments)
    console.log('\n=== Test 4: Response Processing ===');
    const processed = VisualizationParser.processResponse(response);
    console.log('Clean content length:', processed.cleanContent.length);
    console.log('Attachments created:', processed.attachments.length);
    
    if (processed.attachments.length > 0) {
      console.log('\nAttachments:');
      processed.attachments.forEach((att, index) => {
        console.log(`${index + 1}. ${att.name} (${att.type})`);
      });
    }

  } catch (error) {
    console.error('Error in visualization pipeline:', error);
  }

  // Test 5: Test with a manually crafted response
  console.log('\n=== Test 5: Manual Visualization Test ===');
  const manualResponse = `
Here's a comparison of Christian denominations by membership:

\`\`\`json
{
  "type": "chart",
  "data": {
    "values": [
      { "name": "Catholic Church", "value": 1300, "color": "#3b82f6" },
      { "name": "Protestant Churches", "value": 800, "color": "#10b981" },
      { "name": "Orthodox Churches", "value": 300, "color": "#f59e0b" },
      { "name": "Anglican Churches", "value": 85, "color": "#ef4444" }
    ]
  },
  "config": {
    "type": "pie",
    "title": "Christian Denominations by Membership (millions)",
    "showLegend": true
  }
}
\`\`\`

The Catholic Church remains the largest Christian denomination globally.
`;

  const manualViz = VisualizationParser.extractVisualizations(manualResponse);
  console.log('Manual test - visualizations found:', manualViz.length);
  
  if (manualViz.length > 0) {
    console.log('Manual test - visualization type:', manualViz[0].type);
    console.log('Manual test - config:', JSON.stringify(manualViz[0].config, null, 2));
  }

  // Test 6: Generate sample visualizations
  console.log('\n=== Test 6: Sample Visualization Generation ===');
  const sampleChart = VisualizationParser.generateSampleChart('bar');
  console.log('Sample chart generated:', sampleChart.type);
  console.log('Sample chart config:', JSON.stringify(sampleChart.config, null, 2));
}

// Run the test
testChartVisualizationPipeline().catch(console.error);
