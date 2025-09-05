import { getVertexAIService } from '@/lib/services/vertex-ai.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🔍 Vertex AI Configuration Test');
console.log('================================\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('------------------------');

const envVars = {
  'GOOGLE_CLOUD_PROJECT_ID': process.env.GOOGLE_CLOUD_PROJECT_ID,
  'GOOGLE_CLOUD_REGION': process.env.GOOGLE_CLOUD_REGION,
  'GOOGLE_APPLICATION_CREDENTIALS': process.env.GOOGLE_APPLICATION_CREDENTIALS,
  'GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY': process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY
};

for (const [key, value] of Object.entries(envVars)) {
  if (value) {
    if (key === 'GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY') {
      console.log(`✅ ${key}: [SET - ${value.length} characters]`);
    } else if (key === 'GOOGLE_APPLICATION_CREDENTIALS') {
      console.log(`✅ ${key}: ${value}`);
      // Check if file exists
      const fs = require('fs');
      if (fs.existsSync(value)) {
        console.log(`   ✅ File exists`);
      } else {
        console.log(`   ❌ File not found!`);
      }
    } else {
      console.log(`✅ ${key}: ${value}`);
    }
  } else {
    console.log(`❌ ${key}: [NOT SET]`);
  }
}

console.log('\n🔧 Vertex AI Service Status:');
console.log('---------------------------');

const vertexAIService = getVertexAIService();

if (vertexAIService.isAvailable()) {
  console.log('✅ Vertex AI Service is initialized and available');
  
  // Get all agents
  const agents = vertexAIService.getAllAgents();
  console.log(`\n📚 Available Agents (${agents.length}):`);
  agents.forEach(agent => {
    console.log(`   - ${agent.name} (${agent.id})`);
    console.log(`     Model: ${agent.modelName || 'default'}`);
  });
  
  // Test a simple request
  console.log('\n🧪 Testing API Connection...');
  vertexAIService.generateResponse(
    'general-assistant',
    [{ role: 'user', content: 'Say "Hello, Vertex AI is working!" if you can read this.' }]
  ).then(response => {
    console.log('✅ API Response:', response);
    process.exit(0);
  }).catch((error: any) => {
    console.error('❌ API Test Failed:', error.message);
    if (error.message.includes('GoogleAuthError')) {
      console.log('\n⚠️  Authentication Issue Detected!');
      console.log('   This usually means:');
      console.log('   1. Missing or invalid service account credentials');
      console.log('   2. Service account lacks necessary permissions');
      console.log('   3. Wrong project ID or region');
    }
    process.exit(1);
  });
} else {
  console.log('❌ Vertex AI Service is NOT available');
  const error = vertexAIService.getInitializationError();
  if (error) {
    console.log(`   Error: ${error}`);
  }
  
  console.log('\n💡 Troubleshooting Steps:');
  console.log('   1. Ensure GOOGLE_CLOUD_PROJECT_ID is set correctly');
  console.log('   2. For local development:');
  console.log('      - Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON file path');
  console.log('   3. For production (Vercel):');
  console.log('      - Set GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY to base64-encoded service account JSON');
  console.log('      - Use: npx tsx src/scripts/generate-gcloud-base64.ts <path-to-key.json>');
}

console.log('\n📝 Configuration Summary:');
console.log('------------------------');
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log('Mode: Local Development (using file path)');
} else if (process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY) {
  console.log('Mode: Production (using base64 key)');
} else {
  console.log('Mode: No credentials configured!');
}

process.exit(0);
