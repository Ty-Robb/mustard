import { VisualizationParser } from '../lib/utils/visualization-parser';

// Test response with a chart
const chartResponse = `
Based on the church growth data, here's a visualization of the trends over the past 5 years:

\`\`\`json
{
  "type": "chart",
  "data": {
    "labels": ["2019", "2020", "2021", "2022", "2023", "2024"],
    "datasets": [{
      "label": "Weekly Attendance",
      "data": [450, 320, 380, 425, 480, 520],
      "backgroundColor": "#3b82f6",
      "borderColor": "#2563eb",
      "fill": false
    }, {
      "label": "Online Viewers",
      "data": [50, 280, 250, 200, 180, 150],
      "backgroundColor": "#10b981",
      "borderColor": "#059669",
      "fill": false
    }]
  },
  "config": {
    "type": "line",
    "title": "Church Growth Trends (2019-2024)",
    "xAxisLabel": "Year",
    "yAxisLabel": "Number of People",
    "showLegend": true,
    "showGrid": true
  }
}
\`\`\`

As you can see from the data, there was a significant dip in 2020 due to COVID-19, but the church has shown steady recovery since then. The online viewership peaked during the pandemic and has gradually decreased as in-person attendance recovered.
`;

// Test response with a table
const tableResponse = `
Here's a breakdown of the church staff by department:

\`\`\`json
{
  "type": "table",
  "data": {
    "headers": ["Name", "Position", "Department", "Years of Service", "Full Time"],
    "rows": [
      ["Rev. John Smith", "Senior Pastor", "Pastoral", 15, true],
      ["Sarah Johnson", "Worship Director", "Music", 8, true],
      ["Mike Davis", "Youth Pastor", "Youth Ministry", 5, true],
      ["Emily Brown", "Children's Director", "Children's Ministry", 7, true],
      ["David Wilson", "Administrator", "Operations", 12, true],
      ["Lisa Anderson", "Outreach Coordinator", "Missions", 3, false],
      ["Tom Martinez", "Facilities Manager", "Operations", 10, true]
    ],
    "footer": ["Total Staff: 7", "", "", "Avg: 8.6 years", "6 FT / 1 PT"]
  },
  "config": {
    "title": "Church Staff Directory",
    "sortable": true,
    "filterable": true,
    "pagination": false
  }
}
\`\`\`

This table shows our current staffing structure across all departments.
`;

// Test response with multiple visualizations
const multipleVisualizationsResponse = `
Let me show you both the growth trends and budget allocation:

\`\`\`json
{
  "type": "chart",
  "data": {
    "values": [
      { "name": "Worship & Music", "value": 25, "color": "#3b82f6" },
      { "name": "Children & Youth", "value": 30, "color": "#10b981" },
      { "name": "Missions & Outreach", "value": 20, "color": "#f59e0b" },
      { "name": "Operations", "value": 15, "color": "#ef4444" },
      { "name": "Adult Education", "value": 10, "color": "#8b5cf6" }
    ]
  },
  "config": {
    "type": "pie",
    "title": "2024 Budget Allocation by Ministry",
    "showLegend": true
  }
}
\`\`\`

And here's the detailed breakdown:

\`\`\`json
{
  "type": "table",
  "data": {
    "headers": ["Ministry Area", "2023 Budget", "2024 Budget", "Change %"],
    "rows": [
      ["Worship & Music", "$125,000", "$137,500", "+10%"],
      ["Children & Youth", "$150,000", "$165,000", "+10%"],
      ["Missions & Outreach", "$100,000", "$110,000", "+10%"],
      ["Operations", "$75,000", "$82,500", "+10%"],
      ["Adult Education", "$50,000", "$55,000", "+10%"]
    ]
  },
  "config": {
    "title": "Budget Comparison 2023-2024",
    "sortable": true
  }
}
\`\`\`

As you can see, we've allocated a 10% increase across all ministry areas for 2024.
`;

console.log('Testing Chart and Table Visualization Parser\n');

// Test 1: Chart visualization
console.log('Test 1: Chart Response');
console.log('======================');
const chartResult = VisualizationParser.processResponse(chartResponse);
console.log('Clean content:', chartResult.cleanContent);
console.log('Attachments:', JSON.stringify(chartResult.attachments, null, 2));
console.log('\n');

// Test 2: Table visualization
console.log('Test 2: Table Response');
console.log('======================');
const tableResult = VisualizationParser.processResponse(tableResponse);
console.log('Clean content:', tableResult.cleanContent);
console.log('Attachments:', JSON.stringify(tableResult.attachments, null, 2));
console.log('\n');

// Test 3: Multiple visualizations
console.log('Test 3: Multiple Visualizations');
console.log('===============================');
const multiResult = VisualizationParser.processResponse(multipleVisualizationsResponse);
console.log('Clean content:', multiResult.cleanContent);
console.log('Number of attachments:', multiResult.attachments.length);
console.log('Attachment types:', multiResult.attachments.map(a => `${a.type}: ${a.name}`));
console.log('\n');

// Test 4: Generate sample visualizations
console.log('Test 4: Sample Visualizations');
console.log('=============================');
const sampleBar = VisualizationParser.generateSampleChart('bar');
console.log('Sample bar chart:', JSON.stringify(sampleBar, null, 2));
console.log('\n');

const sampleTable = VisualizationParser.generateSampleTable();
console.log('Sample table:', JSON.stringify(sampleTable, null, 2));

// Test 5: Validation
console.log('\nTest 5: Data Validation');
console.log('=======================');
const validChartData = {
  labels: ['A', 'B', 'C'],
  datasets: [{ label: 'Test', data: [1, 2, 3] }]
};
console.log('Valid chart data:', VisualizationParser.validateChartData(validChartData));

const invalidChartData = {
  labels: ['A', 'B', 'C'],
  // Missing datasets
};
console.log('Invalid chart data:', VisualizationParser.validateChartData(invalidChartData));

const validTableData = {
  headers: ['Col1', 'Col2'],
  rows: [['A', 'B'], ['C', 'D']]
};
console.log('Valid table data:', VisualizationParser.validateTableData(validTableData));

console.log('\nAll tests completed!');
