import { getVertexAIService } from '@/lib/services/vertex-ai.service';
import { VisualizationParser } from '@/lib/utils/visualization-parser';
import { getChatService } from '@/lib/services/chat.service';

// Simulate the full chat flow as done by the UI
async function testFullChatFlow() {
  console.log('=== Testing Full Chat Flow with Visualizations ===\n');
  
  const TEST_USER_ID = 'test-user-' + Date.now();
  const chatService = getChatService(TEST_USER_ID);
  
  try {
    // 1. Create a session
    const session = await chatService.createSession('Visualization Test', 'data-visualization');
    console.log('✅ Created session:', session.id);
    
    // 2. Simulate the API flow for sending a message
    const userMessage = 'Show me a pie chart of church budget breakdown by ministry';
    const agentId = 'data-visualization';
    
    // Add user message
    await chatService.addMessage(session.id, {
      role: 'user',
      content: userMessage,
      metadata: { agentId }
    });
    console.log('✅ Added user message');
    
    // Generate AI response
    const messages = [{
      role: 'user' as const,
      content: userMessage,
      id: 'test',
      timestamp: new Date()
    }];
    
    const response = await chatService.generateCompletion(messages, agentId);
    console.log('✅ Generated AI response');
    console.log('   Response length:', response.length);
    
    // Process visualization data (as done in the API)
    const { cleanContent, attachments } = VisualizationParser.processResponse(response);
    console.log('   Clean content length:', cleanContent.length);
    console.log('   Attachments found:', attachments.length);
    
    if (attachments.length > 0) {
      console.log('\n📊 Visualization details:');
      attachments.forEach((att, i) => {
        console.log(`   Attachment ${i + 1}:`, {
          type: att.type,
          name: att.name,
          hasData: !!att.data,
          hasConfig: !!att.config
        });
      });
    }
    
    // Add assistant response with attachments (as done in the API)
    await chatService.addMessage(session.id, {
      role: 'assistant',
      content: cleanContent,
      metadata: { 
        agentId, 
        attachments: attachments.length > 0 ? attachments : undefined
      }
    });
    console.log('✅ Added assistant response with attachments');
    
    // 3. Reload session to verify attachments were saved
    const updatedSession = await chatService.getSession(session.id);
    if (!updatedSession) {
      console.log('❌ Failed to reload session');
      return;
    }
    
    console.log('\n📁 Verifying saved messages:');
    console.log('   Total messages:', updatedSession.messages.length);
    
    updatedSession.messages.forEach((msg, i) => {
      console.log(`\n   Message ${i + 1}:`);
      console.log('   - Role:', msg.role);
      console.log('   - Content length:', msg.content.length);
      console.log('   - Has attachments:', !!msg.metadata?.attachments);
      
      if (msg.metadata?.attachments) {
        console.log('   - Attachments:', msg.metadata.attachments.length);
        msg.metadata.attachments.forEach((att, j) => {
          console.log(`     Attachment ${j + 1}:`, {
            id: att.id,
            type: att.type,
            name: att.name
          });
        });
      }
    });
    
    // 4. Test multiple visualization types
    console.log('\n\n=== Testing Multiple Visualization Types ===\n');
    
    const testCases = [
      {
        prompt: 'Compare Methodist and Baptist church structures in a table',
        expectedType: 'table'
      },
      {
        prompt: 'Show church growth over the last 5 years as a line chart',
        expectedType: 'chart'
      }
    ];
    
    for (const test of testCases) {
      console.log(`\n📝 Testing: "${test.prompt}"`);
      
      // Add user message
      await chatService.addMessage(session.id, {
        role: 'user',
        content: test.prompt,
        metadata: { agentId }
      });
      
      // Generate response
      const testResponse = await chatService.generateCompletion(
        [...updatedSession.messages, {
          role: 'user' as const,
          content: test.prompt,
          id: 'test',
          timestamp: new Date()
        }],
        agentId
      );
      
      // Process and save
      const { cleanContent: testClean, attachments: testAttachments } = 
        VisualizationParser.processResponse(testResponse);
      
      await chatService.addMessage(session.id, {
        role: 'assistant',
        content: testClean,
        metadata: { 
          agentId, 
          attachments: testAttachments.length > 0 ? testAttachments : undefined
        }
      });
      
      console.log('   ✅ Response saved');
      console.log('   Attachments:', testAttachments.length);
      if (testAttachments.length > 0) {
        console.log('   Types:', testAttachments.map(a => a.type).join(', '));
      }
    }
    
    // 5. Final verification
    const finalSession = await chatService.getSession(session.id);
    if (finalSession) {
      const messagesWithViz = finalSession.messages.filter(m => m.metadata?.attachments);
      console.log('\n\n📊 Final Summary:');
      console.log('   Total messages:', finalSession.messages.length);
      console.log('   Messages with visualizations:', messagesWithViz.length);
      console.log('   Total visualizations:', 
        messagesWithViz.reduce((sum, m) => sum + (m.metadata?.attachments?.length || 0), 0)
      );
    }
    
    // Clean up
    await chatService.deleteSession(session.id);
    console.log('\n✅ Test session cleaned up');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
async function main() {
  console.log('🔍 Chat Visualization End-to-End Test\n');
  
  const vertexAI = getVertexAIService();
  if (!vertexAI.isAvailable()) {
    console.error('❌ VertexAI service is not available:', vertexAI.getInitializationError());
    return;
  }
  
  await testFullChatFlow();
  
  console.log('\n✅ E2E test complete!');
}

main().catch(console.error);
