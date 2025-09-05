import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testChartRendering() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('Testing chart rendering fix...\n');

  try {
    // Test with a chart visualization prompt
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Show me a bar chart comparing the number of chapters in the first 5 books of the Bible',
        sessionId: 'test-chart-rendering-' + Date.now(),
        userId: 'test-user',
        agent: 'biblical-scholar'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('\n✅ Streaming complete');
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullResponse += parsed.content;
                  process.stdout.write(parsed.content);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    }

    console.log('\n\n📊 Full response received');
    
    // Check if response contains chart block
    if (fullResponse.includes('```chart')) {
      console.log('✅ Response contains chart visualization block');
      
      // Extract chart data
      const chartMatch = fullResponse.match(/```chart\n([\s\S]*?)\n```/);
      if (chartMatch) {
        try {
          const chartData = JSON.parse(chartMatch[1]);
          console.log('\n📈 Chart data structure:');
          console.log('- Type:', chartData.config?.type || 'Not specified');
          console.log('- Title:', chartData.config?.title || 'No title');
          console.log('- Data points:', chartData.data?.labels?.length || 0);
          console.log('\n✅ Chart data is valid JSON');
        } catch (e) {
          console.error('❌ Failed to parse chart data:', e);
        }
      }
    } else {
      console.log('⚠️  Response does not contain chart visualization block');
    }

    console.log('\n🎯 Test complete! The chart should now render with a fixed height of 400px');
    console.log('📝 To verify visually:');
    console.log('   1. Go to the chat interface');
    console.log('   2. Ask for a chart visualization');
    console.log('   3. The chart should display with proper height');

  } catch (error) {
    console.error('❌ Error testing chart rendering:', error);
  }
}

// Run the test
testChartRendering().catch(console.error);
