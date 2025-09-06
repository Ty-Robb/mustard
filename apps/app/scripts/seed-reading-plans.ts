import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedReadingPlans() {
  try {
    console.log('🌱 Starting to seed default reading plans...');
    
    const response = await fetch('http://localhost:9001/api/reading-plans/seed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', data.message);
      console.log(`📚 Created ${data.insertedCount} reading plans`);
    } else {
      console.error('❌ Error:', data.error || data.message);
    }
  } catch (error) {
    console.error('❌ Failed to seed reading plans:', error);
  }
}

// Run the seed function
seedReadingPlans();
