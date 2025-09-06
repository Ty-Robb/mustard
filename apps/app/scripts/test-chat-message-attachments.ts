import { ChatMessage } from '@/types/chat';
import { VisualizationParser } from '@/lib/utils/visualization-parser';

// Test data - a message with chart attachment
const testMessage: ChatMessage = {
  id: 'test-123',
  role: 'assistant',
  content: 'Here is a comparison of Christian denominations by membership.',
  timestamp: new Date(),
  metadata: {
    agentId: 'general-assistant',
    attachments: [
      {
        id: 'viz-test-1',
        type: 'chart',
        name: 'Christian Denominations by Membership',
        data: {
          values: [
            { name: 'Catholic', value: 1300, color: '#3b82f6' },
            { name: 'Protestant', value: 800, color: '#10b981' },
            { name: 'Orthodox', value: 300, color: '#f59e0b' },
            { name: 'Anglican', value: 85, color: '#ef4444' }
          ]
        },
        config: {
          type: 'pie',
          title: 'Christian Denominations by Membership (millions)',
          showLegend: true
        }
      }
    ]
  }
};

console.log('Test ChatMessage with Attachments');
console.log('=================================\n');

console.log('Message ID:', testMessage.id);
console.log('Role:', testMessage.role);
console.log('Content:', testMessage.content);
console.log('Has metadata:', !!testMessage.metadata);
console.log('Has attachments:', !!testMessage.metadata?.attachments);
console.log('Number of attachments:', testMessage.metadata?.attachments?.length || 0);

if (testMessage.metadata?.attachments) {
  console.log('\nAttachment Details:');
  testMessage.metadata.attachments.forEach((att, index) => {
    console.log(`\nAttachment ${index + 1}:`);
    console.log('- ID:', att.id);
    console.log('- Type:', att.type);
    console.log('- Name:', att.name);
    console.log('- Has data:', !!att.data);
    console.log('- Has config:', !!att.config);
    
    if (att.type === 'chart' && att.config) {
      console.log('- Chart type:', (att.config as any).type);
      console.log('- Chart title:', (att.config as any).title);
    }
  });
}

// Test the visualization parser with a full response
console.log('\n\nTesting Full Response Processing');
console.log('================================\n');

const fullResponse = `
Here's a comparison of Christian denominations:

\`\`\`json
{
  "type": "chart",
  "data": {
    "values": [
      { "name": "Catholic", "value": 1300, "color": "#3b82f6" },
      { "name": "Protestant", "value": 800, "color": "#10b981" },
      { "name": "Orthodox", "value": 300, "color": "#f59e0b" },
      { "name": "Anglican", "value": 85, "color": "#ef4444" }
    ]
  },
  "config": {
    "type": "pie",
    "title": "Christian Denominations by Membership (millions)",
    "showLegend": true
  }
}
\`\`\`

The Catholic Church is the largest denomination.
`;

const processed = VisualizationParser.processResponse(fullResponse);
console.log('Clean content:', processed.cleanContent);
console.log('Attachments created:', processed.attachments.length);

// Create a full message object as it would be saved
const fullMessage: ChatMessage = {
  id: 'msg-' + Date.now(),
  role: 'assistant',
  content: processed.cleanContent,
  timestamp: new Date(),
  metadata: {
    agentId: 'general-assistant',
    attachments: processed.attachments.length > 0 ? processed.attachments : undefined
  }
};

console.log('\nFull Message Object:');
console.log(JSON.stringify(fullMessage, null, 2));
