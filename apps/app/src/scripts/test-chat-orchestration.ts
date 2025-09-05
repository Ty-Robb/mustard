/**
 * Test script for chat service with orchestration integration
 */

import { getChatService } from '@/lib/services/chat.service';
import { ChatMessage } from '@/types/chat';

// Mock user ID for testing
const TEST_USER_ID = 'test-user-123';

async function testOrchestrationDetection() {
  console.log('🧪 Testing Orchestration Detection...\n');
  
  const chatService = getChatService(TEST_USER_ID);
  
  // Test cases that should trigger orchestration
  const orchestrationTests = [
    'Create a presentation about climate change',
    'Write an essay on artificial intelligence',
    'Build a comprehensive sermon on faith',
    'Design a course curriculum for web development',
    'Create a detailed article about healthy eating'
  ];
  
  // Test cases that should NOT trigger orchestration
  const singleAgentTests = [
    'What is the weather today?',
    'Tell me a joke',
    'What is 2 + 2?',
    'Hello, how are you?'
  ];
  
  console.log('Messages that should trigger orchestration:');
  orchestrationTests.forEach(test => {
    // @ts-ignore - accessing private method for testing
    const shouldOrchestrate = chatService.shouldUseOrchestration(test);
    console.log(`  "${test}" -> ${shouldOrchestrate ? '✅ Orchestration' : '❌ Single Agent'}`);
  });
  
  console.log('\nMessages that should use single agent:');
  singleAgentTests.forEach(test => {
    // @ts-ignore - accessing private method for testing
    const shouldOrchestrate = chatService.shouldUseOrchestration(test);
    console.log(`  "${test}" -> ${shouldOrchestrate ? '❌ Orchestration' : '✅ Single Agent'}`);
  });
}

async function testDeliverableTypeDetection() {
  console.log('\n\n🧪 Testing Deliverable Type Detection...\n');
  
  const chatService = getChatService(TEST_USER_ID);
  
  const testCases = [
    { input: 'Create a presentation about AI', expected: 'presentation' },
    { input: 'Write an essay on climate change', expected: 'essay' },
    { input: 'Draft an article about technology', expected: 'article' },
    { input: 'Prepare a sermon on hope', expected: 'sermon' },
    { input: 'Build a course on JavaScript', expected: 'course' },
    { input: 'Tell me about the weather', expected: 'general' }
  ];
  
  testCases.forEach(({ input, expected }) => {
    // @ts-ignore - accessing private method for testing
    const detected = chatService.detectDeliverableType(input);
    const isCorrect = detected === expected;
    console.log(`  "${input}"`);
    console.log(`    Expected: ${expected}, Got: ${detected} ${isCorrect ? '✅' : '❌'}\n`);
  });
}

async function testOrchestrationExecution() {
  console.log('\n🧪 Testing Orchestration Execution...\n');
  
  const chatService = getChatService(TEST_USER_ID);
  
  // Create a test session
  const session = await chatService.createSession('Test Orchestration');
  console.log(`Created session: ${session.id}`);
  
  // Test messages
  const messages: ChatMessage[] = [
    {
      id: '1',
      role: 'user',
      content: 'Create a short presentation about the benefits of meditation',
      timestamp: new Date()
    }
  ];
  
  console.log('\nSending orchestration request...');
  console.log(`User: "${messages[0].content}"\n`);
  
  try {
    // Test with streaming
    let streamedContent = '';
    const result = await chatService.generateCompletion(
      messages,
      'general-assistant',
      { stream: true },
      (chunk) => {
        streamedContent += chunk;
        process.stdout.write(chunk);
      }
    );
    
    console.log('\n\n✅ Orchestration completed successfully!');
    console.log(`Total response length: ${result.length} characters`);
    
    // Add messages to session
    await chatService.addMessage(session.id, messages[0]);
    await chatService.addMessage(session.id, {
      role: 'assistant',
      content: result,
      metadata: { 
        agentId: 'orchestrator'
      }
    });
    
    // Generate title
    const title = await chatService.generateSessionTitle(session.id);
    console.log(`Generated title: "${title}"`);
    
  } catch (error) {
    console.error('\n❌ Orchestration failed:', error);
  }
}

async function testSingleAgentFallback() {
  console.log('\n\n🧪 Testing Single Agent (Non-Orchestration)...\n');
  
  const chatService = getChatService(TEST_USER_ID);
  
  const messages: ChatMessage[] = [
    {
      id: '1',
      role: 'user',
      content: 'What is the capital of France?',
      timestamp: new Date()
    }
  ];
  
  console.log(`User: "${messages[0].content}"\n`);
  
  try {
    const result = await chatService.generateCompletion(
      messages,
      'general-assistant',
      { stream: false }
    );
    
    console.log('Assistant:', result);
    console.log('\n✅ Single agent response successful!');
    
  } catch (error) {
    console.error('\n❌ Single agent failed:', error);
  }
}

async function main() {
  console.log('🚀 Chat Service Orchestration Integration Test\n');
  console.log('=' .repeat(50));
  
  try {
    await testOrchestrationDetection();
    await testDeliverableTypeDetection();
    
    // Note: The following tests would make actual API calls
    // Uncomment to test with real Vertex AI service
    
    // await testOrchestrationExecution();
    // await testSingleAgentFallback();
    
    console.log('\n\n✅ All tests completed!');
    console.log('\nNote: Execution tests are commented out to avoid API calls.');
    console.log('Uncomment them to test with real Vertex AI service.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
main().catch(console.error);
