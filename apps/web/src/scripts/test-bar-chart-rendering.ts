import { ChartData, ChartConfig } from '@/types/chat';

// Test script to debug bar chart rendering issue
console.log('Testing Bar Chart vs Pie Chart Rendering');
console.log('========================================\n');

// Sample data for bar chart
const barChartData: ChartData = {
  labels: ['January', 'February', 'March', 'April', 'May'],
  datasets: [
    {
      label: 'Sales 2024',
      data: [65, 59, 80, 81, 56],
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
    },
    {
      label: 'Sales 2023',
      data: [45, 49, 60, 71, 46],
      backgroundColor: '#10b981',
      borderColor: '#059669',
    }
  ]
};

const barChartConfig: ChartConfig = {
  type: 'bar',
  title: 'Monthly Sales Comparison',
  showLegend: true,
  showGrid: true,
  aspectRatio: 2
};

// Sample data for pie chart
const pieChartData: ChartData = {
  values: [
    { name: 'January', value: 65, color: '#3b82f6' },
    { name: 'February', value: 59, color: '#10b981' },
    { name: 'March', value: 80, color: '#f59e0b' },
    { name: 'April', value: 81, color: '#ef4444' },
    { name: 'May', value: 56, color: '#8b5cf6' }
  ]
};

const pieChartConfig: ChartConfig = {
  type: 'pie',
  title: 'Sales Distribution',
  showLegend: true,
  aspectRatio: 1
};

// Transform function from ChartRenderer for bar charts
const transformDataForLineBar = (data: ChartData) => {
  if (!data.labels || !data.datasets) return [];
  
  return data.labels.map((label, index) => {
    const point: any = { name: label };
    if (data.datasets) {
      data.datasets.forEach((dataset) => {
        point[dataset.label] = dataset.data[index];
      });
    }
    return point;
  });
};

// Transform function from ChartRenderer for pie charts
const transformDataForPie = (data: ChartData) => {
  if (data.values) {
    return data.values;
  }
  // If using datasets format, convert first dataset to pie format
  if (data.labels && data.datasets?.[0]) {
    return data.labels.map((label, index) => ({
      name: label,
      value: data.datasets![0].data[index],
    }));
  }
  return [];
};

console.log('Bar Chart Data Structure:');
console.log(JSON.stringify(barChartData, null, 2));

console.log('\n\nTransformed Bar Chart Data (for Recharts):');
const transformedBarData = transformDataForLineBar(barChartData);
console.log(JSON.stringify(transformedBarData, null, 2));

console.log('\n\nPie Chart Data Structure:');
console.log(JSON.stringify(pieChartData, null, 2));

console.log('\n\nTransformed Pie Chart Data (for Recharts):');
const transformedPieData = transformDataForPie(pieChartData);
console.log(JSON.stringify(transformedPieData, null, 2));

// Check for potential issues
console.log('\n\nPotential Issues Check:');
console.log('======================');

// Check bar chart data
console.log('\nBar Chart Checks:');
console.log('- Has labels:', !!barChartData.labels);
console.log('- Has datasets:', !!barChartData.datasets);
console.log('- Number of labels:', barChartData.labels?.length || 0);
console.log('- Number of datasets:', barChartData.datasets?.length || 0);
console.log('- Transformed data length:', transformedBarData.length);
console.log('- First transformed item:', transformedBarData[0]);

// Check if data keys match
if (transformedBarData.length > 0) {
  console.log('- Data keys in transformed data:', Object.keys(transformedBarData[0]));
}

// Check pie chart data
console.log('\nPie Chart Checks:');
console.log('- Has values:', !!pieChartData.values);
console.log('- Number of values:', pieChartData.values?.length || 0);
console.log('- Transformed data length:', transformedPieData.length);
console.log('- First transformed item:', transformedPieData[0]);

// Alternative bar chart data format (similar to pie chart)
console.log('\n\nAlternative Bar Chart Format Test:');
const alternativeBarData: ChartData = {
  labels: ['January', 'February', 'March', 'April', 'May'],
  datasets: [{
    label: 'Sales',
    data: [65, 59, 80, 81, 56],
    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  }]
};

const altTransformed = transformDataForLineBar(alternativeBarData);
console.log('Alternative transformed data:', JSON.stringify(altTransformed, null, 2));

console.log('\n\nRecommendations:');
console.log('1. Check if the Bar component is receiving the correct dataKey prop');
console.log('2. Verify that the data transformation is producing the expected format');
console.log('3. Check for any console errors when rendering bar charts');
console.log('4. Ensure the ResponsiveContainer has proper dimensions');
