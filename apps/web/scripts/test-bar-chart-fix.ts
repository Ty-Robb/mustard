// Test to identify the exact issue with bar charts

console.log('Testing Bar Chart Fix');
console.log('====================\n');

// This is what the ChartRenderer expects for bar charts
const expectedFormat = {
  data: [
    { name: 'January', 'Sales 2024': 65, 'Sales 2023': 45 },
    { name: 'February', 'Sales 2024': 59, 'Sales 2023': 49 },
    // ... more data points
  ],
  barComponents: [
    {
      dataKey: 'Sales 2024',
      fill: '#3b82f6', // This should be a valid color
    },
    {
      dataKey: 'Sales 2023', 
      fill: '#10b981', // This should be a valid color
    }
  ]
};

// Check if backgroundColor is being passed correctly
const testDataset = {
  label: 'Test Data',
  data: [30, 45, 60, 75],
  backgroundColor: 'rgba(59, 130, 246, 0.5)', // This might be the issue
  borderColor: 'rgb(59, 130, 246)',
};

console.log('Dataset backgroundColor:', testDataset.backgroundColor);
console.log('Is it a string?', typeof testDataset.backgroundColor === 'string');
console.log('Does it start with rgba?', testDataset.backgroundColor.startsWith('rgba'));

// Test different color formats
const colorFormats = [
  'rgba(59, 130, 246, 0.5)',
  'rgb(59, 130, 246)',
  '#3b82f6',
  '#3b82f680', // hex with alpha
  'blue',
];

console.log('\nTesting color formats:');
colorFormats.forEach(color => {
  console.log(`- ${color}: valid for Recharts`);
});

// The issue might be that Recharts doesn't handle rgba() well for bar fills
console.log('\nPotential Issue:');
console.log('Recharts Bar component might not handle rgba() colors properly.');
console.log('Solution: Convert rgba colors to hex or use solid colors for bar charts.');

// Test conversion function
function rgbaToHex(rgba: string): string {
  // Extract values from rgba string
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return rgba; // Return original if not rgba format
  
  const [_, r, g, b, a] = match;
  const hex = '#' + 
    parseInt(r).toString(16).padStart(2, '0') +
    parseInt(g).toString(16).padStart(2, '0') +
    parseInt(b).toString(16).padStart(2, '0');
  
  // Add alpha if present
  if (a && parseFloat(a) < 1) {
    const alpha = Math.round(parseFloat(a) * 255);
    return hex + alpha.toString(16).padStart(2, '0');
  }
  
  return hex;
}

console.log('\nColor conversion test:');
console.log('rgba(59, 130, 246, 0.5) => ', rgbaToHex('rgba(59, 130, 246, 0.5)'));
console.log('rgb(59, 130, 246) => ', rgbaToHex('rgb(59, 130, 246)'));
