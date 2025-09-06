import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// List of models to test
const MODELS_TO_TEST = [
  // Gemini 2.5 models
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  
  // Gemini 2.0 models
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  
  // Deprecated models (should fail)
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  
  // Alternative names that might work
  'gemini-pro',
  'gemini-pro-vision',
];

async function testModelAvailability() {
  console.log('Testing Gemini Model Availability...\n');
  
  // Initialize Vertex AI directly
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_REGION || 'us-central1';
  
  if (!projectId) {
    console.error('❌ GOOGLE_CLOUD_PROJECT_ID is not configured');
    return;
  }
  
  console.log(`Project ID: ${projectId}`);
  console.log(`Location: ${location}\n`);
  
  let vertexAI: VertexAI;
  
  try {
    // Initialize authentication
    let auth: GoogleAuth;
    
    if (process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY) {
      const credentials = JSON.parse(
        Buffer.from(process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY, 'base64').toString()
      );
      auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      auth = new GoogleAuth({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    } else {
      auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    }
    
    vertexAI = new VertexAI({
      project: projectId,
      location: location,
    });
    
    console.log('✅ Vertex AI initialized successfully\n');
  } catch (error) {
    console.error('❌ Failed to initialize Vertex AI:', error);
    return;
  }
  
  console.log('Testing models...\n');
  
  const results: { model: string; status: 'available' | 'not available'; error?: string }[] = [];
  
  for (const modelName of MODELS_TO_TEST) {
    process.stdout.write(`Testing ${modelName}... `);
    
    try {
      const model = vertexAI.preview.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: 50,
          temperature: 0.1,
          topP: 0.95,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });
      
      // Try to generate a simple response
      const result = await model.generateContent('Say "Hello"');
      const response = result.response;
      
      console.log('✅ Available');
      results.push({ model: modelName, status: 'available' });
      
    } catch (error: any) {
      console.log('❌ Not available');
      const errorMessage = error.message || error.toString();
      results.push({ 
        model: modelName, 
        status: 'not available',
        error: errorMessage.includes('404') ? 'Model not found' : 
               errorMessage.includes('403') ? 'Access denied' :
               errorMessage.includes('400') ? 'Invalid model name' :
               'Unknown error'
      });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60) + '\n');
  
  const availableModels = results.filter(r => r.status === 'available');
  const unavailableModels = results.filter(r => r.status === 'not available');
  
  console.log(`Available Models (${availableModels.length}):`);
  if (availableModels.length > 0) {
    availableModels.forEach(r => console.log(`  ✅ ${r.model}`));
  } else {
    console.log('  None');
  }
  
  console.log(`\nUnavailable Models (${unavailableModels.length}):`);
  unavailableModels.forEach(r => {
    console.log(`  ❌ ${r.model} - ${r.error}`);
  });
  
  // Recommendations
  console.log('\n' + '='.repeat(60));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(60) + '\n');
  
  if (availableModels.length === 0) {
    console.log('⚠️  No models are available in your project!');
    console.log('   Please check your Google Cloud project configuration.');
    console.log('   Visit: https://console.cloud.google.com/vertex-ai');
  } else {
    console.log('Recommended model configuration based on availability:\n');
    
    // Find best models for each use case
    const findBestModel = (preferred: string[], purpose: string) => {
      for (const model of preferred) {
        if (availableModels.find(r => r.model === model)) {
          console.log(`  ${purpose}: ${model}`);
          return model;
        }
      }
      console.log(`  ${purpose}: No suitable model available`);
      return null;
    };
    
    findBestModel(['gemini-2.5-pro', 'gemini-pro'], 'Default model');
    findBestModel(['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'], 'Summary generation');
    findBestModel(['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-pro'], 'General assistant');
    findBestModel(['gemini-2.5-pro', 'gemini-pro', 'gemini-2.5-flash'], 'Complex analysis');
  }
}

// Run the test
testModelAvailability().catch(console.error);
