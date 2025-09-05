# Dual Visualization Implementation Guide

## Overview

This document describes the dual visualization approach implemented in the Mustard app, which enables both automatic visualization generation by general AI agents and specialized visualization creation through a dedicated Data Visualization Specialist.

## Problem Solved

Previously, when users asked questions that would benefit from charts or tables (like "show me the Methodist Church split"), the AI would provide text-only responses even though the system had full visualization capabilities. This implementation ensures that:

1. **Automatic Visualizations**: General agents now automatically include charts and tables when appropriate
2. **Specialized Visualizations**: Complex data analysis can still use the dedicated Data Visualization Specialist
3. **Consistent Format**: All agents use the same JSON structure for visualizations

## Implementation Details

### 1. Enhanced AI Agents

The following agents have been enhanced with visualization capabilities:

#### General Assistant
- **Use Case**: Basic statistics, comparisons, percentages
- **Chart Types**: Bar, line, pie charts
- **Table Support**: Yes
- **Example**: Church attendance statistics, budget breakdowns

#### Biblical Scholar
- **Use Case**: Historical timelines, text comparisons
- **Chart Types**: Timeline (line charts), comparison tables
- **Table Support**: Yes, especially for translation comparisons
- **Example**: Paul's missionary journey timeline, Gospel synoptic comparisons

#### Essay Writer
- **Use Case**: Theological comparisons, structured information
- **Chart Types**: Pie charts for distributions
- **Table Support**: Yes, for doctrinal comparisons
- **Example**: Catholic vs Protestant doctrine comparison table

#### Bible Study Leader
- **Use Case**: Group progress tracking, study schedules
- **Chart Types**: Bar charts for attendance, progress tracking
- **Table Support**: Yes, for study schedules
- **Example**: Weekly attendance charts, monthly study plans

### 2. Data Visualization Specialist

The specialized agent remains available for:
- Complex multi-dimensional analysis
- Advanced chart types (radar, scatter plots)
- Large datasets requiring sophisticated visualization
- Custom visualization requirements

### 3. Visualization Format

All agents use this standardized format:

#### Chart Format
```json
{
  "type": "chart",
  "data": {
    "labels": ["Label1", "Label2"],
    "datasets": [{
      "label": "Dataset Name",
      "data": [value1, value2],
      "backgroundColor": "rgba(59, 130, 246, 0.5)",
      "borderColor": "rgb(59, 130, 246)"
    }]
  },
  "config": {
    "type": "bar|line|pie|doughnut|area|radar|scatter",
    "title": "Chart Title",
    "xAxisLabel": "X Axis",
    "yAxisLabel": "Y Axis"
  }
}
```

#### Pie/Doughnut Chart Format
```json
{
  "type": "chart",
  "data": {
    "values": [
      {"name": "Category1", "value": 30, "color": "#3b82f6"},
      {"name": "Category2", "value": 50, "color": "#10b981"}
    ]
  },
  "config": {
    "type": "pie|doughnut",
    "title": "Chart Title"
  }
}
```

#### Table Format
```json
{
  "type": "table",
  "data": {
    "headers": ["Column1", "Column2"],
    "rows": [["Row1Col1", "Row1Col2"]]
  },
  "config": {
    "title": "Table Title",
    "sortable": true,
    "filterable": true
  }
}
```

## Usage Examples

### Example 1: Methodist Church Split (General Assistant)

**User**: "Explain the Methodist Church split with statistics"

**Response includes**:
```json
{
  "type": "chart",
  "data": {
    "values": [
      {"name": "Churches that Left", "value": 7600, "color": "#ef4444"},
      {"name": "Churches that Stayed", "value": 22400, "color": "#3b82f6"}
    ]
  },
  "config": {
    "type": "pie",
    "title": "Methodist Church Split (2023)"
  }
}
```

### Example 2: Biblical Timeline (Biblical Scholar)

**User**: "Show Paul's missionary journeys timeline"

**Response includes**:
```json
{
  "type": "chart",
  "data": {
    "labels": ["46 AD", "49 AD", "53 AD", "60 AD"],
    "datasets": [{
      "label": "Missionary Journeys",
      "data": [1, 2, 3, 4],
      "borderColor": "rgb(59, 130, 246)"
    }]
  },
  "config": {
    "type": "line",
    "title": "Paul's Missionary Journeys Timeline",
    "xAxisLabel": "Year",
    "yAxisLabel": "Journey Number"
  }
}
```

### Example 3: Complex Analysis (Data Visualization Specialist)

**User**: "Analyze church growth by age demographics over 5 years"

The specialist would create multiple coordinated visualizations with detailed analysis.

## Testing

Run the test script to verify the implementation:

```bash
npm run tsx src/scripts/test-dual-visualization.ts
```

This tests:
1. General Assistant with statistics
2. Biblical Scholar with timelines
3. Essay Writer with comparisons
4. Bible Study Leader with progress tracking
5. Data Visualization Specialist with complex analysis

## Best Practices

### When to Use Each Approach

1. **Use General Agents** when:
   - The visualization is supplementary to the main content
   - Simple charts or tables suffice
   - The focus is on the explanation, not the visualization

2. **Use Data Visualization Specialist** when:
   - Visualization is the primary output
   - Complex or multiple charts are needed
   - Custom visualization logic is required
   - Detailed data analysis is the goal

### Tips for Users

1. **Be specific** about wanting visualizations in your prompt
2. **Mention data types** (percentages, timeline, comparison) to trigger appropriate charts
3. **Use the specialist** for dashboard-style multiple visualizations
4. **General agents** work great for single charts within explanations

## Technical Architecture

```
User Request
    ↓
AI Agent Selection
    ↓
Response Generation (with visualization JSON)
    ↓
VisualizationParser.processResponse()
    ↓
Attachments Created
    ↓
ChatMessage Component
    ↓
ChartRenderer / TableRenderer
```

## Future Enhancements

1. **Smart Agent Routing**: Automatically route to Data Visualization Specialist when complex charts are detected
2. **Interactive Charts**: Add click handlers and drill-down capabilities
3. **Export Options**: Allow users to download charts as images or data as CSV
4. **Real-time Data**: Connect to live data sources for dynamic visualizations

## Troubleshooting

### Charts Not Appearing

1. Check that the AI response includes JSON blocks with `type: "chart"` or `type: "table"`
2. Verify the JSON structure matches the expected format
3. Ensure the visualization parser is processing the response
4. Check browser console for rendering errors

### Wrong Chart Type

1. Be more specific in your prompt about the desired visualization
2. Use keywords like "timeline", "comparison", "distribution"
3. Consider using the Data Visualization Specialist for precise control

## Conclusion

The dual visualization approach provides the best of both worlds:
- **Convenience**: Automatic visualizations in general conversations
- **Power**: Specialized agent for complex data analysis
- **Consistency**: Unified format across all agents
- **Flexibility**: Users can choose the approach that fits their needs

This implementation significantly enhances the user experience by making data more accessible and understandable through visual representation.
