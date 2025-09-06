import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { getModelForTask, MODEL_CONFIGS } from '../lib/utils/gemini-models';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testGeminiInsights() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not found in environment variables');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Test different task types
  const testCases = [
    { taskType: 'cross-references', text: 'love', description: 'Simple task (flash-lite)' },
    { taskType: 'word-study', text: 'agape', description: 'Standard task (flash)' },
    { taskType: 'biography', text: 'Moses', description: 'Complex task (pro)' },
  ];
  
  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${testCase.description}`);
    console.log(`Task Type: ${testCase.taskType}`);
    console.log(`Text: "${testCase.text}"`);
    console.log('='.repeat(60) + '\n');
    
    try {
      // Get the appropriate model for this task
      const model = getModelForTask(genAI, testCase.taskType, 'insights');
      
      const prompt = `
You are a Biblical scholar. Analyze this Bible text for ${testCase.taskType}.

Selected Text: "${testCase.text}"
Reference: Various passages

Please provide insights in the following JSON format:
{
  "historicalContext": "detailed explanation",
  "crossReferences": ["verse1 - explanation", "verse2 - explanation"],
  "keyThemes": ["theme1", "theme2"],
  "originalLanguage": {
    "hebrew": "relevant Hebrew words if applicable",
    "greek": "relevant Greek words if applicable",
    "insights": "explanation of language insights"
  },
  "practicalApplication": "detailed application",
  "theologicalInsights": "detailed theological analysis"
}

Return your response as valid JSON only.`;

      console.log('Sending prompt to Gemini...\n');
      const startTime = Date.now();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const endTime = Date.now();
      
      console.log(`Response time: ${endTime - startTime}ms`);
      console.log('Raw response length:', text.length, 'characters');
      
      // Try to parse as JSON
      try {
        const parsed = JSON.parse(text);
        console.log('✅ Successfully parsed as JSON!');
        console.log('Key themes:', parsed.keyThemes?.join(', ') || 'None');
        console.log('Cross references count:', parsed.crossReferences?.length || 0);
      } catch (parseError) {
        console.error('❌ Failed to parse as JSON');
        
        // Try to extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extracted = JSON.parse(jsonMatch[0]);
            console.log('✅ Successfully extracted and parsed JSON from response');
            console.log('Key themes:', extracted.keyThemes?.join(', ') || 'None');
          } catch (e) {
            console.error('❌ Failed to parse extracted JSON');
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error testing model:', error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Test complete!');
}

// Run the test
testGeminiInsights();
