import { getVertexAIService } from '@/lib/services/vertex-ai.service';
import { VisualizationParser } from '@/lib/utils/visualization-parser';

async function testDualVisualization() {
  console.log('🧪 Testing Dual Visualization Approach\n');

  const vertexAI = getVertexAIService();
  
  if (!vertexAI.isAvailable()) {
    console.error('❌ Vertex AI service is not available');
    return;
  }

  // Test cases for different agents
  const testCases = [
    {
      name: 'General Assistant - Methodist Church Split',
      agentId: 'general-assistant',
      prompt: 'Explain the recent Methodist Church split, showing the statistics of how many churches left (about 25% or 7,600 churches) and the timeline from 2019 to 2023.'
    },
    {
      name: 'Biblical Scholar - Timeline',
      agentId: 'biblical-scholar',
      prompt: 'Show me a timeline of Paul\'s missionary journeys with dates and locations.'
    },
    {
      name: 'Essay Writer - Theological Comparison',
      agentId: 'essay-writer',
      prompt: 'Write a brief comparison of Catholic vs Protestant views on salvation, including a comparison table.'
    },
    {
      name: 'Bible Study Leader - Group Progress',
      agentId: 'bible-study-leader',
      prompt: 'Show our Bible study group\'s attendance over the last 6 weeks and create a schedule for the next month studying the Gospel of John.'
    },
    {
      name: 'Data Visualization Specialist - Complex Analysis',
      agentId: 'data-visualization',
      prompt: 'Create a comprehensive visualization showing church growth patterns across different age demographics over the past 5 years.'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📊 Testing: ${testCase.name}`);
    console.log(`Agent: ${testCase.agentId}`);
    console.log(`Prompt: ${testCase.prompt}\n`);

    try {
      // Generate response
      const response = await vertexAI.generateResponse(
        testCase.agentId,
        [{ role: 'user', content: testCase.prompt }]
      );

      // Parse visualizations
      const { cleanContent, attachments } = VisualizationParser.processResponse(response);

      // Display results
      console.log('Response Preview:');
      console.log(cleanContent.substring(0, 200) + '...\n');

      if (attachments.length > 0) {
        console.log(`✅ Found ${attachments.length} visualization(s):`);
        attachments.forEach((attachment, index) => {
          console.log(`\n  ${index + 1}. ${attachment.type.toUpperCase()}: ${attachment.name}`);
          
          if (attachment.type === 'chart') {
            const chartData = attachment.data as any;
            const chartConfig = attachment.config as any;
            console.log(`     Type: ${chartConfig.type}`);
            console.log(`     Title: ${chartConfig.title}`);
            
            if (chartData.labels) {
              console.log(`     Labels: ${chartData.labels.join(', ')}`);
            } else if (chartData.values) {
              console.log(`     Categories: ${chartData.values.map((v: any) => v.name).join(', ')}`);
            }
          } else if (attachment.type === 'table') {
            const tableData = attachment.data as any;
            console.log(`     Headers: ${tableData.headers.join(', ')}`);
            console.log(`     Rows: ${tableData.rows.length}`);
          }
        });
      } else {
        console.log('⚠️  No visualizations found in response');
      }

      console.log('\n' + '─'.repeat(80));
    } catch (error) {
      console.error(`❌ Error testing ${testCase.name}:`, error);
    }
  }

  console.log('\n✨ Dual visualization testing complete!');
}

// Run the test
testDualVisualization().catch(console.error);
