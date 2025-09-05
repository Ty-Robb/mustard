import { getChatService } from '@/lib/services/chat.service';
import { getVertexAIService } from '@/lib/services/vertex-ai.service';

async function testChatWithVertexAI() {
  console.log('🧪 Testing Chat with Vertex AI Integration\n');

  try {
    // Test 1: Check Vertex AI availability
    console.log('1️⃣ Checking Vertex AI Service...');
    const vertexAI = getVertexAIService();
    
    if (!vertexAI.isAvailable()) {
      const error = vertexAI.getInitializationError();
      console.error('❌ Vertex AI is not available:', error);
      console.log('\n💡 Make sure you have set up:');
      console.log('   - GOOGLE_CLOUD_PROJECT_ID');
      console.log('   - GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY');
      return;
    }
    
    console.log('✅ Vertex AI service is available\n');

    // Test 2: List all available agents
    console.log('2️⃣ Available Agents:');
    const agents = vertexAI.getAllAgents();
    agents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.id})`);
      console.log(`     ${agent.description}`);
    });
    console.log();

    // Test 3: Test chat service
    console.log('3️⃣ Testing Chat Service...');
    const chatService = getChatService('test-user-123');
    
    const availableAgents = await chatService.getAllAgents();
    console.log(`✅ Chat service found ${availableAgents.length} agents\n`);

    // Test 4: Test a simple conversation
    console.log('4️⃣ Testing Conversation with General Assistant...');
    const testMessages = [
      {
        id: '1',
        role: 'user' as const,
        content: 'Hello! Can you help me understand what services you provide for ministry work?',
        timestamp: new Date()
      }
    ];

    try {
      const response = await chatService.generateCompletion(
        testMessages,
        'general-assistant',
        { temperature: 0.7 }
      );
      
      console.log('✅ Response received:');
      console.log('---');
      console.log(response.substring(0, 200) + '...');
      console.log('---\n');
    } catch (error) {
      console.error('❌ Error generating response:', error);
    }

    // Test 5: Test biblical scholar
    console.log('5️⃣ Testing Biblical Scholar...');
    const biblicalMessages = [
      {
        id: '2',
        role: 'user' as const,
        content: 'What is the significance of the number 40 in the Bible?',
        timestamp: new Date()
      }
    ];

    try {
      const response = await chatService.generateCompletion(
        biblicalMessages,
        'biblical-scholar',
        { temperature: 0.3 }
      );
      
      console.log('✅ Biblical Scholar response:');
      console.log('---');
      console.log(response.substring(0, 200) + '...');
      console.log('---\n');
    } catch (error) {
      console.error('❌ Error with Biblical Scholar:', error);
    }

    console.log('✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testChatWithVertexAI()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { testChatWithVertexAI };
