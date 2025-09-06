import { VisualizationParser } from '@/lib/utils/visualization-parser';

// Test response from the AI (Methodist Church example)
const testResponse = `Here is a visualization of the approximate split of U.S. churches as of the end of the disaffiliation period.

\`\`\`json
{
  "type": "chart",
  "data": {
    "values": [
      {
        "name": "Churches Remaining in UMC",
        "value": 75,
        "color": "#3b82f6"
      },
      {
        "name": "Disaffiliated Churches",
        "value": 25,
        "color": "#ef4444"
      }
    ]
  },
  "config": {
    "type": "doughnut",
    "title": "U.S. UMC Disaffiliation Split (Approx. as of Dec 2023)"
  }
}
\`\`\`

*Source Note: These percentages are based on reports from UM News and other church news outlets.*`;

console.log('🧪 Testing Visualization Parser\n');
console.log('Input text:', testResponse.substring(0, 100) + '...\n');

// Test containsVisualization
const hasViz = VisualizationParser.containsVisualization(testResponse);
console.log('Contains visualization?', hasViz);

// Test extractVisualizations
const visualizations = VisualizationParser.extractVisualizations(testResponse);
console.log('\nExtracted visualizations:', visualizations.length);
visualizations.forEach((viz, index) => {
  console.log(`\nVisualization ${index + 1}:`);
  console.log('Type:', viz.type);
  console.log('Config:', viz.config);
  console.log('Data:', JSON.stringify(viz.data, null, 2));
});

// Test processResponse
const { cleanContent, attachments } = VisualizationParser.processResponse(testResponse);
console.log('\n--- Process Response Results ---');
console.log('Clean content:', cleanContent);
console.log('\nAttachments:', attachments.length);
attachments.forEach((attachment, index) => {
  console.log(`\nAttachment ${index + 1}:`);
  console.log('ID:', attachment.id);
  console.log('Type:', attachment.type);
  console.log('Name:', attachment.name);
});

// Test with different formatting variations
console.log('\n\n🧪 Testing formatting variations...\n');

const variations = [
  // With newlines in JSON
  'Text before\n```json\n{\n  "type": "chart",\n  "data": {\n    "values": [{"name": "A", "value": 50}]\n  },\n  "config": {\n    "type": "pie"\n  }\n}\n```\nText after',
  
  // Without newlines after backticks
  'Text before ```json{"type":"chart","data":{"values":[{"name":"A","value":50}]},"config":{"type":"pie"}}``` Text after',
  
  // With spaces
  'Text before ```json { "type": "chart", "data": { "values": [{"name": "A", "value": 50}] }, "config": { "type": "pie" } } ``` Text after',
];

variations.forEach((text, index) => {
  console.log(`\nVariation ${index + 1}:`);
  const hasViz = VisualizationParser.containsVisualization(text);
  const vizs = VisualizationParser.extractVisualizations(text);
  console.log('Contains visualization?', hasViz);
  console.log('Extracted count:', vizs.length);
});
