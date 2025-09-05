import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const BIBLE_API_BASE_URL = 'https://api.scripture.api.bible/v1';

async function testBibleApiKey() {
  const apiKey = process.env.BIBLE_API_KEY;
  
  console.log('Testing Bible API Key...');
  console.log('API Key exists:', !!apiKey);
  console.log('API Key length:', apiKey?.length || 0);
  console.log('API Key (first 8 chars):', apiKey?.substring(0, 8) + '...');
  
  if (!apiKey) {
    console.error('❌ BIBLE_API_KEY is not set in environment variables');
    return;
  }

  try {
    // Test 1: Try to fetch list of Bibles
    console.log('\n📖 Testing /bibles endpoint...');
    const biblesResponse = await fetch(`${BIBLE_API_BASE_URL}/bibles`, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', biblesResponse.status);
    console.log('Response status text:', biblesResponse.statusText);
    
    if (biblesResponse.ok) {
      const data = await biblesResponse.json();
      console.log('✅ API Key is valid!');
      console.log(`Found ${data.data.length} Bibles`);
      
      // Show first few Bibles
      console.log('\nFirst 3 Bibles:');
      data.data.slice(0, 3).forEach((bible: any) => {
        console.log(`- ${bible.name} (${bible.abbreviation}) - ${bible.language.name}`);
      });
    } else {
      console.error('❌ API Key is invalid or expired');
      const errorText = await biblesResponse.text();
      console.error('Error response:', errorText);
    }

    // Test 2: Check rate limit headers
    console.log('\n📊 Rate limit information:');
    console.log('Rate limit:', biblesResponse.headers.get('x-ratelimit-limit'));
    console.log('Remaining:', biblesResponse.headers.get('x-ratelimit-remaining'));
    console.log('Reset time:', biblesResponse.headers.get('x-ratelimit-reset'));

  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

// Run the test
testBibleApiKey().catch(console.error);
