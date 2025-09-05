import { generateVisualizationFromText } from '../lib/utils/visualization-generator';

async function testEditorVisualizationIntegration() {
  console.log('Testing Editor Visualization Integration...\n');

  const testCases = [
    {
      name: 'Bar Chart Generation',
      text: 'The Methodist Church has 5000 members, Baptist Church has 3000 members, Presbyterian Church has 2000 members',
      action: 'chart' as const
    },
    {
      name: 'Table Generation',
      text: 'Compare the churches: Methodist (founded 1784, 5000 members), Baptist (founded 1609, 3000 members), Presbyterian (founded 1560, 2000 members)',
      action: 'table' as const
    },
    {
      name: 'Auto Detection',
      text: 'Sales data: Q1 $100k, Q2 $150k, Q3 $120k, Q4 $180k',
      action: 'auto' as const
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n=== ${testCase.name} ===`);
    console.log(`Input text: "${testCase.text}"`);
    console.log(`Action: ${testCase.action}`);
    
    try {
      const result = await generateVisualizationFromText(
        testCase.text, 
        testCase.action === 'auto' ? undefined : testCase.action
      );
      
      if (result) {
        console.log('\n✅ Visualization generated successfully:');
        console.log('Type:', result.type);
        console.log('Config:', JSON.stringify(result.config, null, 2));
        console.log('Data:', JSON.stringify(result.data, null, 2));
        
        // Validate the structure
        if (result.type === 'chart') {
          const chartData = result.data as any;
          const chartConfig = result.config as any;
          
          if (!Array.isArray(chartData)) {
            console.error('❌ Chart data should be an array');
          } else {
            console.log('✅ Chart data is valid array with', chartData.length, 'items');
          }
          
          if (!chartConfig.type) {
            console.error('❌ Chart config missing type');
          } else {
            console.log('✅ Chart type:', chartConfig.type);
          }
        } else if (result.type === 'table') {
          const tableData = result.data as any;
          
          if (!tableData.headers || !tableData.rows) {
            console.error('❌ Table data missing headers or rows');
          } else {
            console.log('✅ Table has', tableData.headers.length, 'columns and', tableData.rows.length, 'rows');
          }
        }
      } else {
        console.error('❌ No visualization generated');
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
}

// Run the test
testEditorVisualizationIntegration().catch(console.error);
