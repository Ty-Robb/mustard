import { VisualizationParser } from '@/lib/utils/visualization-parser';

// Simulate the AI response with visualization
const aiResponse = `Here is a visualization of the approximate split of U.S. churches as of the end of the disaffiliation period.

\`\`\`json
{
  "type": "chart",
  "data": {
    "values": [
      {
        "name": "Churches Remaining in UMC",
        "value": 75,
        "color": "#3b82f6"
      },
      {
        "name": "Disaffiliated Churches",
        "value": 25,
        "color": "#ef4444"
      }
    ]
  },
  "config": {
    "type": "doughnut",
    "title": "U.S. UMC Disaffiliation Split (Approx. as of Dec 2023)"
  }
}
\`\`\`

*Source Note: These percentages are based on reports from UM News and other church news outlets.*`;

console.log('🧪 Testing Complete Visualization Flow\n');

// Step 1: Process the response
console.log('Step 1: Processing AI response...');
const { cleanContent, attachments } = VisualizationParser.processResponse(aiResponse);

console.log('Clean content:', cleanContent);
console.log('Attachments found:', attachments.length);

// Step 2: Simulate saving to database
console.log('\nStep 2: Simulating message save...');
const messageToSave = {
  role: 'assistant',
  content: cleanContent,
  metadata: {
    agentId: 'general-assistant',
    attachments: attachments.length > 0 ? attachments : undefined
  }
};

console.log('Message to save:', JSON.stringify(messageToSave, null, 2));

// Step 3: Verify attachment structure
console.log('\nStep 3: Verifying attachment structure...');
if (attachments.length > 0) {
  const attachment = attachments[0];
  console.log('Attachment ID:', attachment.id);
  console.log('Attachment type:', attachment.type);
  console.log('Attachment name:', attachment.name);
  console.log('Has data?', !!attachment.data);
  console.log('Has config?', !!attachment.config);
  
  // Verify it matches what ChartRenderer expects
  if (attachment.type === 'chart') {
    const chartData = attachment.data as any;
    const chartConfig = attachment.config as any;
    
    console.log('\nChart validation:');
    console.log('Config type:', chartConfig.type);
    console.log('Config title:', chartConfig.title);
    console.log('Data has values?', !!chartData.values);
    console.log('Values count:', chartData.values?.length);
  }
}

// Step 4: Test direct rendering
console.log('\nStep 4: Testing if data is ready for ChartRenderer...');
if (attachments.length > 0 && attachments[0].type === 'chart') {
  console.log('✅ Data is properly formatted for ChartRenderer');
  console.log('ChartRenderer props would be:');
  console.log('- data:', attachments[0].data);
  console.log('- config:', attachments[0].config);
} else {
  console.log('❌ No chart data found');
}

console.log('\n✨ Test complete!');
