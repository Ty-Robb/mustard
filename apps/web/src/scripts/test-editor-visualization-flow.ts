import { generateVisualizationFromText } from '../lib/utils/visualization-generator';

async function testEditorVisualizationFlow() {
  console.log('🧪 Testing Editor Visualization Flow\n');

  // Test cases for different visualization types
  const testCases = [
    {
      name: 'Chart Generation',
      text: 'Our quarterly sales: Q1 $1.2M, Q2 $1.5M, Q3 $1.8M, Q4 $2.1M',
      type: 'chart' as const,
      expectedType: 'chart'
    },
    {
      name: 'Table Generation',
      text: 'Compare products: iPhone 15 Pro ($999, 4.8 rating), Galaxy S24 ($899, 4.6 rating), Pixel 8 ($699, 4.7 rating)',
      type: 'table' as const,
      expectedType: 'table'
    },
    {
      name: 'Auto Detection',
      text: 'Monthly attendance grew from 100 in January to 500 in June',
      type: undefined,
      expectedType: 'chart'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📊 Test: ${testCase.name}`);
    console.log(`   Text: "${testCase.text}"`);
    console.log(`   Type: ${testCase.type || 'auto'}`);
    
    try {
      const result = await generateVisualizationFromText(testCase.text, testCase.type);
      
      if (result) {
        console.log(`\n   ✅ Visualization generated successfully!`);
        console.log(`   Type: ${result.type}`);
        console.log(`   Has data: ${!!result.data}`);
        console.log(`   Has config: ${!!result.config}`);
        
        if (result.type === 'chart') {
          const chartData = result.data as any;
          console.log(`   Chart details:`);
          console.log(`     - Labels: ${chartData.labels?.length || 0} items`);
          console.log(`     - Datasets: ${chartData.datasets?.length || 0}`);
          
          const chartConfig = result.config as any;
          console.log(`     - Chart type: ${chartConfig?.type || 'not specified'}`);
          console.log(`     - Title: ${chartConfig?.title || 'not specified'}`);
        } else if (result.type === 'table') {
          const tableData = result.data as any;
          console.log(`   Table details:`);
          console.log(`     - Headers: ${tableData.headers?.join(', ') || 'none'}`);
          console.log(`     - Rows: ${tableData.rows?.length || 0}`);
          
          if (tableData.rows?.length > 0) {
            console.log(`     - First row: ${tableData.rows[0].join(', ')}`);
          }
        }
        
        // Verify the structure matches what the editor expects
        if (result.type === testCase.expectedType) {
          console.log(`   ✅ Type matches expected: ${testCase.expectedType}`);
        } else {
          console.log(`   ⚠️  Type mismatch - expected: ${testCase.expectedType}, got: ${result.type}`);
        }
      } else {
        console.log(`   ❌ Failed to generate visualization`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log('\n\n📋 Summary:');
  console.log('1. The visualization generator should return data in the correct format');
  console.log('2. Charts need: { labels: [], datasets: [] } for data');
  console.log('3. Tables need: { headers: [], rows: [] } for data');
  console.log('4. Both need a config object with appropriate settings');
  console.log('\n✅ Test complete!');
}

// Run the test
testEditorVisualizationFlow().catch(console.error);
