import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testChatStreaming() {
  console.log('Testing chat streaming fix...\n');

  // Test message
  const testMessage = "What is Christianity's biggest problem?";
  
  try {
    // First, get auth token (you'll need to replace this with actual auth)
    console.log('Note: This test requires authentication. Please ensure you have a valid auth token.\n');
    
    // Test the streaming endpoint
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add actual auth header here
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE',
      },
      body: JSON.stringify({
        action: 'generateCompletion',
        messages: [{ role: 'user', content: testMessage }],
        agentId: 'general-assistant',
        options: {
          stream: true,
          temperature: 0.7,
        },
        stream: true,
      }),
    });

    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      const error = await response.text();
      console.error('Error:', error);
      return;
    }

    console.log('Streaming response received. Reading chunks...\n');

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (!reader) {
      console.error('No response body');
      return;
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('\n\nStreaming complete!');
            console.log('Full response length:', fullResponse.length);
            console.log('Full response preview:', fullResponse.substring(0, 200) + '...');
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullResponse += parsed.content;
              process.stdout.write(parsed.content);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Instructions for running the test
console.log('=== Chat Streaming Fix Test ===\n');
console.log('To run this test:');
console.log('1. Make sure your Next.js app is running (npm run dev)');
console.log('2. Get a valid auth token from your browser session');
console.log('3. Add the token to this script');
console.log('4. Run: npm run test:chat-streaming-fix\n');

// Uncomment to run the test
// testChatStreaming();
