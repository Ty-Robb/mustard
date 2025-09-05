import { generateVisualizationFromText, detectVisualizationNeed } from '../lib/utils/visualization-generator';

async function testEditorVisualizations() {
  console.log('Testing Editor Visualization Generation...\n');

  // Test 1: Auto-detect visualization from text about sales
  console.log('Test 1: Auto-detect from sales text');
  const salesText = "Our quarterly sales showed significant growth: Q1 had $1.2M, Q2 reached $1.5M, Q3 hit $1.8M, and Q4 closed at $2.1M";
  
  // First check if visualization is needed
  const salesDetection = detectVisualizationNeed(salesText);
  console.log('Detection result:', salesDetection);
  
  if (salesDetection.needsVisualization) {
    const salesViz = await generateVisualizationFromText(salesText);
    console.log('Visualization result:', JSON.stringify(salesViz, null, 2));
  }
  console.log('\n---\n');

  // Test 2: Generate specific chart type
  console.log('Test 2: Generate specific line chart');
  const trendText = "Website traffic increased steadily from 1000 visitors in January to 5000 in June";
  const lineChart = await generateVisualizationFromText(trendText, 'chart');
  console.log('Result:', JSON.stringify(lineChart, null, 2));
  console.log('\n---\n');

  // Test 3: Generate table
  console.log('Test 3: Generate table from product data');
  const productText = "Our top products are: iPhone 15 Pro at $999 with 4.8 rating, Samsung Galaxy S24 at $899 with 4.6 rating, and Google Pixel 8 at $699 with 4.7 rating";
  const table = await generateVisualizationFromText(productText, 'table');
  console.log('Result:', JSON.stringify(table, null, 2));
  console.log('\n---\n');

  // Test 4: Timeline visualization
  console.log('Test 4: Generate timeline');
  const timelineText = "Key milestones: Company founded in 2020, Series A funding in 2021, Product launch in 2022, IPO in 2023";
  const timeline = await generateVisualizationFromText(timelineText, 'timeline');
  console.log('Result:', JSON.stringify(timeline, null, 2));
  console.log('\n---\n');

  // Test 5: Comparison visualization
  console.log('Test 5: Generate comparison');
  const comparisonText = "Comparing cloud providers: AWS has 32% market share, Azure has 23%, and Google Cloud has 10%";
  const comparison = await generateVisualizationFromText(comparisonText, 'comparison');
  console.log('Result:', JSON.stringify(comparison, null, 2));

  // Test 6: Detection for non-visualization text
  console.log('\nTest 6: Detection for non-visualization text');
  const regularText = "The weather today is sunny and warm.";
  const regularDetection = detectVisualizationNeed(regularText);
  console.log('Detection result:', regularDetection);

  console.log('\n✅ All tests completed!');
}

// Run the tests
testEditorVisualizations().catch(console.error);
