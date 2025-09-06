import { getVertexAIService } from '@/lib/services/vertex-ai.service';
import { VisualizationParser } from '@/lib/utils/visualization-parser';
import { getChatService } from '@/lib/services/chat.service';
import { adminAuth } from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';
import { ChatMessage } from '@/types/chat';

// Test prompts that should definitely trigger visualizations
const TEST_PROMPTS = [
  {
    agentId: 'data-visualization',
    prompt: 'Show me a pie chart of church budget breakdown by ministry',
    expectedType: 'chart'
  },
  {
    agentId: 'essay-writer',
    prompt: 'Compare Methodist and Baptist church governance structures',
    expectedType: 'table'
  },
  {
    agentId: 'general-assistant',
    prompt: 'Show me church attendance growth over the last 5 years',
    expectedType: 'chart'
  }
];

async function testAIVisualizationGeneration() {
  console.log('=== Testing AI Visualization Generation ===\n');
  
  const vertexAI = getVertexAIService();
  
  if (!vertexAI.isAvailable()) {
    console.error('❌ VertexAI service is not available:', vertexAI.getInitializationError());
    return;
  }
  
  for (const test of TEST_PROMPTS) {
    console.log(`\n📝 Testing prompt: "${test.prompt}"`);
    console.log(`   Agent: ${test.agentId}`);
    console.log(`   Expected: ${test.expectedType}\n`);
    
    try {
      // Generate AI response
      const response = await vertexAI.generateResponse(
        test.agentId,
        [{ role: 'user' as const, content: test.prompt }]
      );
      
      console.log('✅ AI Response received');
      console.log('   Length:', response.length, 'characters');
      
      // Check if response contains JSON blocks
      const jsonMatches = response.match(/```json[\s\S]*?```/g);
      console.log('   JSON blocks found:', jsonMatches?.length || 0);
      
      if (jsonMatches) {
        jsonMatches.forEach((match: string, index: number) => {
          console.log(`\n   JSON Block ${index + 1}:`);
          console.log('   ' + match.substring(0, 100) + '...');
        });
      }
      
      // Test visualization parser
      console.log('\n📊 Testing VisualizationParser...');
      const { cleanContent, attachments } = VisualizationParser.processResponse(response);
      
      console.log('   Clean content length:', cleanContent.length);
      console.log('   Attachments found:', attachments.length);
      
      if (attachments.length > 0) {
        attachments.forEach((attachment, index) => {
          console.log(`\n   Attachment ${index + 1}:`);
          console.log('   - ID:', attachment.id);
          console.log('   - Type:', attachment.type);
          console.log('   - Name:', attachment.name);
          console.log('   - Has data:', !!attachment.data);
          console.log('   - Has config:', !!attachment.config);
          
          if (attachment.type === 'chart' && attachment.config) {
            console.log('   - Chart type:', (attachment.config as any).type);
          }
        });
      } else {
        console.log('   ⚠️  No attachments extracted!');
        
        // Show a sample of the response for debugging
        console.log('\n   Response sample:');
        console.log('   ' + response.substring(0, 500) + '...');
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

async function testVisualizationParserDirectly() {
  console.log('\n=== Testing VisualizationParser Directly ===\n');
  
  // Test with a known good visualization response
  const sampleResponse = `
Here's the church budget breakdown:

\`\`\`json
{
  "type": "chart",
  "data": {
    "values": [
      {"name": "Worship & Music", "value": 25, "color": "#3b82f6"},
      {"name": "Youth Ministry", "value": 20, "color": "#10b981"},
      {"name": "Outreach", "value": 15, "color": "#f59e0b"},
      {"name": "Administration", "value": 20, "color": "#ef4444"},
      {"name": "Building & Maintenance", "value": 20, "color": "#8b5cf6"}
    ]
  },
  "config": {
    "type": "pie",
    "title": "Church Budget Distribution"
  }
}
\`\`\`

This shows how the budget is allocated across different ministries.
`;

  console.log('Testing with sample response containing visualization...');
  const { cleanContent, attachments } = VisualizationParser.processResponse(sampleResponse);
  
  console.log('Clean content:', cleanContent);
  console.log('Attachments:', attachments.length);
  
  if (attachments.length > 0) {
    console.log('\n✅ Parser working correctly!');
    console.log('Attachment details:', JSON.stringify(attachments[0], null, 2));
  } else {
    console.log('\n❌ Parser failed to extract visualization!');
  }
}

async function testChatServiceIntegration() {
  console.log('\n=== Testing Chat Service Integration ===\n');
  
  // Get a test user token (you'll need to replace this with a real token)
  const TEST_USER_ID = 'test-user-' + Date.now();
  
  try {
    const chatService = getChatService(TEST_USER_ID);
    
    // Create a test session
    const session = await chatService.createSession('Visualization Test', 'data-visualization');
    console.log('✅ Created test session:', session.id);
    
    // Send a message that should generate a visualization
    const userMessage: ChatMessage = {
      id: new ObjectId().toString(),
      role: 'user' as const,
      content: 'Show me a bar chart of monthly attendance for the last 6 months',
      timestamp: new Date(),
      metadata: { agentId: 'data-visualization' }
    };
    
    // Note: addMessage will add the required fields (id, timestamp)
    console.log('✅ Preparing user message');
    
    // Generate AI response
    const response = await chatService.generateCompletion(
      [userMessage] as ChatMessage[],
      'data-visualization'
    );
    
    console.log('✅ Generated AI response');
    console.log('   Response length:', response.length);
    
    // Check if response contains visualization
    const { attachments } = VisualizationParser.processResponse(response);
    console.log('   Attachments in response:', attachments.length);
    
    // Retrieve the session to check if attachments were saved
    const updatedSession = await chatService.getSession(session.id);
    
    if (!updatedSession) {
      console.log('❌ Failed to retrieve updated session');
      return;
    }
    
    const messagesWithAttachments = updatedSession.messages.filter(m => m.metadata?.attachments);
    
    console.log('\n📁 Checking saved messages:');
    console.log('   Total messages:', updatedSession.messages.length);
    console.log('   Messages with attachments:', messagesWithAttachments.length);
    
    if (messagesWithAttachments.length > 0) {
      messagesWithAttachments.forEach((msg, index) => {
        console.log(`\n   Message ${index + 1} attachments:`, msg.metadata?.attachments);
      });
    }
    
    // Clean up
    await chatService.deleteSession(session.id);
    console.log('\n✅ Cleaned up test session');
    
  } catch (error) {
    console.error('❌ Chat service test error:', error);
  }
}

async function main() {
  console.log('🔍 Chat Visualization Diagnostics\n');
  
  // Test 1: AI Generation
  await testAIVisualizationGeneration();
  
  // Test 2: Parser
  await testVisualizationParserDirectly();
  
  // Test 3: Full Integration
  await testChatServiceIntegration();
  
  console.log('\n✅ Diagnostics complete!');
}

// Run the tests
main().catch(console.error);
