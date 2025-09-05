import { ChartData, ChartConfig } from '@/types/chat';

// Test data for chart
const chartData: ChartData = {
  values: [
    { name: 'Traditional', value: 45, color: '#8B5CF6' },
    { name: 'Contemporary', value: 30, color: '#3B82F6' },
    { name: 'Blended', value: 25, color: '#10B981' }
  ]
};

const chartConfig: ChartConfig = {
  type: 'pie',
  title: 'Worship Style Preferences',
  showLegend: true
};

// Test data for table
const tableData = {
  headers: ['Ministry', 'Description', 'Meeting Time'],
  rows: [
    ['LGBTQ+ Fellowship', 'A safe and affirming space for LGBTQ+ members and allies', 'Sundays, 2:00 PM'],
    ['Rainbow Choir', 'An inclusive choir that performs at special services', 'Wednesdays, 7:00 PM'],
    ['Pride Prayer Group', 'Weekly prayer and support group', 'Thursdays, 6:30 PM']
  ]
};

const tableConfig = {
  title: 'LGBTQ+ Ministries',
  sortable: true,
  filterable: true
};

console.log('Chart visualization test data:');
console.log(JSON.stringify({ data: chartData, config: chartConfig }, null, 2));

console.log('\nTable visualization test data:');
console.log(JSON.stringify({ data: tableData, config: tableConfig }, null, 2));

console.log('\nBoth components should have identical card styling:');
console.log('- Card wrapper: bg-card/50 backdrop-blur-sm border-border/50 shadow-lg');
console.log('- Inner container: bg-muted/30 backdrop-blur-sm p-4 border border-border/30');
