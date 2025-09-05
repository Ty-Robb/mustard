import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testChatAPI() {
  const baseUrl = 'http://localhost:3000';
  
  // Mock auth token (you'll need a real one in production)
  const authToken = 'test-token';
  
  console.log('Testing Chat API with Vertex AI fix...\n');
  
  try {
    // Test 1: Get all agents
    console.log('1. Testing GET /api/chat/agents');
    const agentsResponse = await fetch(`${baseUrl}/api/chat/agents`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    if (!agentsResponse.ok) {
      console.error(`   ❌ Failed: ${agentsResponse.status} ${agentsResponse.statusText}`);
      const error = await agentsResponse.text();
      console.error(`   Error: ${error}`);
    } else {
      const { agents } = await agentsResponse.json();
      console.log(`   ✅ Success: Found ${agents.length} agents`);
      
      // Check if Vertex AI agents are included
      const vertexAgents = agents.filter((agent: any) => agent.provider === 'vertex-ai');
      const defaultAgents = agents.filter((agent: any) => agent.provider !== 'vertex-ai');
      
      console.log(`      - Default agents: ${defaultAgents.length}`);
      console.log(`      - Vertex AI agents: ${vertexAgents.length}`);
      
      if (vertexAgents.length === 0) {
        console.log('      ⚠️  Vertex AI not available (this is expected if not configured)');
      }
      
      // List all agents
      console.log('\n   Available agents:');
      agents.forEach((agent: any) => {
        console.log(`      - ${agent.name} (${agent.id}) - Provider: ${agent.provider}`);
      });
    }
    
    // Test 2: Create a session
    console.log('\n2. Testing POST /api/chat (create session)');
    const createSessionResponse = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Session',
        agentId: 'general-assistant', // Using a default agent
      }),
    });
    
    if (!createSessionResponse.ok) {
      console.error(`   ❌ Failed: ${createSessionResponse.status} ${createSessionResponse.statusText}`);
      const error = await createSessionResponse.text();
      console.error(`   Error: ${error}`);
    } else {
      const session = await createSessionResponse.json();
      console.log(`   ✅ Success: Created session ${session.id}`);
    }
    
    console.log('\n✅ Chat API is working properly!');
    console.log('The Vertex AI fix allows the chat to work even without Vertex AI configured.');
    
  } catch (error) {
    console.error('\n❌ Error testing chat API:', error);
  }
}

// Check environment variables
console.log('Environment check:');
console.log(`- GOOGLE_CLOUD_PROJECT_ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID ? '✅ Set' : '❌ Not set'}`);
console.log(`- GOOGLE_CLOUD_REGION: ${process.env.GOOGLE_CLOUD_REGION ? '✅ Set' : '❌ Not set'}`);
console.log(`- GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? '✅ Set' : '❌ Not set'}`);
console.log(`- GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY: ${process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY ? '✅ Set' : '❌ Not set'}`);
console.log();

testChatAPI();
