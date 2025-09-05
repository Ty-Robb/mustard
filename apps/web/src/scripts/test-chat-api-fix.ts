import { getChatService } from '../lib/services/chat.service';
import { getVertexAIService } from '../lib/services/vertex-ai.service';

async function testVertexAIService() {
  console.log('Testing Vertex AI Service...\n');
  
  const vertexAIService = getVertexAIService();
  
  // Check if service is available
  console.log('Is Vertex AI available?', vertexAIService.isAvailable());
  console.log('Initialization error:', vertexAIService.getInitializationError());
  
  // Get all agents
  const agents = vertexAIService.getAllAgents();
  console.log('\nVertex AI Agents:', agents.length);
  agents.forEach(agent => {
    console.log(`- ${agent.name}: ${agent.description}`);
  });
}

async function testChatService() {
  console.log('\n\nTesting Chat Service...\n');
  
  // Create a mock user ID for testing
  const userId = 'test-user-123';
  const chatService = getChatService(userId);
  
  try {
    // Get all agents (including Vertex AI agents)
    const allAgents = await chatService.getAllAgents();
    console.log('Total agents available:', allAgents.length);
    console.log('\nAll agents:');
    allAgents.forEach(agent => {
      console.log(`- ${agent.name} (${agent.provider}): ${agent.description}`);
    });
    
    // Check if Vertex AI agents are included
    const vertexAgents = allAgents.filter(agent => agent.provider === 'vertex-ai');
    console.log(`\nVertex AI agents found: ${vertexAgents.length}`);
    
  } catch (error) {
    console.error('Error testing chat service:', error);
  }
}

async function main() {
  try {
    await testVertexAIService();
    await testChatService();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

main();
