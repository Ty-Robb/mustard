import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testChatAPI() {
  console.log('Testing Chat API Error Debug...\n');

  // Check environment variables
  console.log('1. Checking environment variables:');
  console.log('   - FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing');
  console.log('   - FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✓ Set' : '✗ Missing');
  console.log('   - FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✓ Set' : '✗ Missing');
  console.log('   - GOOGLE_CLOUD_PROJECT:', process.env.GOOGLE_CLOUD_PROJECT ? '✓ Set' : '✗ Missing');
  console.log('   - GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? '✓ Set' : '✗ Missing');

  // Test Firebase Admin initialization
  console.log('\n2. Testing Firebase Admin initialization:');
  try {
    const { adminAuth } = await import('@/lib/firebase-admin');
    console.log('   ✓ Firebase Admin imported successfully');
    
    // Try to verify a test token (this will fail but shows if admin is initialized)
    try {
      await adminAuth.verifyIdToken('test-token');
    } catch (error: any) {
      if (error.message.includes('Decoding Firebase ID token failed')) {
        console.log('   ✓ Firebase Admin is initialized (token verification failed as expected)');
      } else {
        console.log('   ✗ Firebase Admin error:', error.message);
      }
    }
  } catch (error: any) {
    console.log('   ✗ Failed to import Firebase Admin:', error.message);
  }

  // Test chat service
  console.log('\n3. Testing Chat Service:');
  try {
    const { getChatService } = await import('@/lib/services/chat.service');
    const chatService = getChatService('test-user-id');
    console.log('   ✓ Chat service created successfully');
    
    // Test getting agents
    try {
      const agents = await chatService.getAllAgents();
      console.log(`   ✓ Retrieved ${agents.length} agents`);
      agents.forEach((agent, index) => {
        console.log(`      ${index + 1}. ${agent.name} (${agent.id})`);
      });
    } catch (error: any) {
      console.log('   ✗ Failed to get agents:', error.message);
    }
  } catch (error: any) {
    console.log('   ✗ Failed to create chat service:', error.message);
  }

  // Test Vertex AI connection
  console.log('\n4. Testing Vertex AI connection:');
  try {
    const { VertexAIService } = await import('@/lib/services/vertex-ai.service');
    const vertexService = new VertexAIService();
    console.log('   ✓ Vertex AI service created');
    
    // Test a simple completion
    try {
      const response = await vertexService.generateResponse(
        'general-assistant',
        [{ role: 'user', content: 'Say "test successful"' }]
      );
      console.log('   ✓ Vertex AI response:', response.substring(0, 50));
    } catch (error: any) {
      console.log('   ✗ Vertex AI error:', error.message);
    }
  } catch (error: any) {
    console.log('   ✗ Failed to create Vertex AI service:', error.message);
  }

  console.log('\n5. Common issues and solutions:');
  console.log('   - "User not authenticated": Make sure you\'re signed in');
  console.log('   - "No agent available": Wait for agents to load or refresh the page');
  console.log('   - "Firebase Admin SDK error": Check Firebase environment variables');
  console.log('   - "API request failed": Check browser console for detailed error');
  console.log('\n   To see detailed logs:');
  console.log('   1. Open browser DevTools (F12)');
  console.log('   2. Go to Console tab');
  console.log('   3. Try sending a message');
  console.log('   4. Look for [useChat] and [Chat API] logs');
}

// Run the test
testChatAPI().catch(console.error);
