import { generateVisualizationFromText } from '@/lib/utils/visualization-generator';

async function testVisualization() {
  console.log('Testing visualization generation and rendering...\n');

  const testText = `
    The top 10 most religious US states by population percentage are:
    Utah (64%), Mississippi (63%), Alabama (62%), Louisiana (60%), 
    Arkansas (59%), South Carolina (58%), Tennessee (57%), 
    North Carolina (56%), Georgia (55%), and Oklahoma (54%).
  `;

  try {
    console.log('Generating visualization from text...');
    const result = await generateVisualizationFromText(testText, 'chart');
    
    console.log('\nVisualization result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result) {
      console.log('\nVisualization type:', result.type);
      console.log('Has data:', !!result.data);
      console.log('Has config:', !!result.config);
      
      if (result.config) {
        console.log('Config type:', (result.config as any).type);
      }
    }
  } catch (error) {
    console.error('Error generating visualization:', error);
  }
}

// Run the test
testVisualization();
