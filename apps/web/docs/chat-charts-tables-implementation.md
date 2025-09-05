# Chat Charts and Tables Implementation

## Overview

This document describes the implementation of chart and table visualization capabilities in the chat interface. Users can now request data visualizations, and the AI will generate interactive charts and tables that appear directly in the chat conversation.

## Features

### Supported Chart Types
- **Line Chart**: For trends over time
- **Bar Chart**: For comparing categories
- **Area Chart**: For showing cumulative data
- **Pie Chart**: For showing proportions
- **Doughnut Chart**: Similar to pie with a hollow center
- **Radar Chart**: For multivariate data
- **Scatter Plot**: For correlation analysis

### Table Features
- **Sortable Columns**: Click headers to sort
- **Filterable**: Search across all table data
- **Pagination**: For large datasets
- **Custom Styling**: Striped rows, borders, hover effects
- **Footer Row**: For totals and summaries

## Architecture

### 1. Type Definitions (`src/types/chat.ts`)
- Extended `ChatAttachment` to support 'chart' and 'table' types
- Added `ChartData`, `ChartConfig`, `TableData`, and `TableConfig` interfaces
- Attachments store visualization data and configuration

### 2. Components

#### ChartRenderer (`src/components/chat/ChartRenderer.tsx`)
- Uses Recharts library for rendering
- Supports multiple chart types with responsive design
- Handles data transformation for different chart formats
- Provides default color palette

#### TableRenderer (`src/components/chat/TableRenderer.tsx`)
- Built on top of existing UI table components
- Implements sorting, filtering, and pagination
- Supports boolean values with checkmark/cross display
- Responsive design with horizontal scrolling

### 3. AI Integration

#### Data Visualization Agent (`src/lib/services/vertex-ai.service.ts`)
- New agent: `data-visualization`
- Trained to generate structured JSON for charts and tables
- Provides explanatory text alongside visualizations

#### Response Format
The AI generates visualizations in JSON format within code blocks:

```json
{
  "type": "chart",
  "data": {
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [{
      "label": "Sales",
      "data": [100, 150, 200]
    }]
  },
  "config": {
    "type": "line",
    "title": "Monthly Sales"
  }
}
```

### 4. Visualization Parser (`src/lib/utils/visualization-parser.ts`)
- Detects visualization JSON in AI responses
- Extracts and validates chart/table data
- Separates visualization data from text content
- Creates attachment objects for rendering

### 5. API Integration (`src/app/api/chat/route.ts`)
- Processes AI responses to extract visualizations
- Stores attachments with messages
- Maintains clean content for display

### 6. Message Display (`src/components/chat/ChatMessage.tsx`)
- Renders attachments after message content
- Supports multiple visualizations per message
- Maintains responsive layout

## Usage Examples

### Requesting a Chart
```
User: "Show me a chart of church growth over the last 5 years"

AI: Here's the church growth data from 2019-2024:
[Line chart showing attendance trends]
As you can see, there was a dip in 2020...
```

### Requesting a Table
```
User: "Create a table of our staff members by department"

AI: Here's the staff directory:
[Interactive table with sorting and filtering]
We have 7 staff members across 5 departments...
```

### Mixed Content
```
User: "Compare this year's budget to last year"

AI: Let me show you the comparison:
[Pie chart of budget allocation]
[Table with detailed line items]
Overall, we've increased the budget by 10%...
```

## Testing

Run the test script to verify functionality:
```bash
npm run tsx src/scripts/test-chat-visualizations.ts
```

## Future Enhancements

1. **Export Options**: Allow users to download charts as images or data as CSV
2. **Interactive Features**: Tooltips, zoom, pan for charts
3. **More Chart Types**: Heatmaps, treemaps, gauges
4. **Real-time Updates**: Live data streaming for dashboards
5. **Custom Themes**: Match church branding colors
6. **Accessibility**: Enhanced screen reader support

## Best Practices

1. **Data Size**: Keep datasets reasonable (< 100 data points for charts)
2. **Clear Labels**: Use descriptive titles and axis labels
3. **Color Contrast**: Ensure readability in both light and dark modes
4. **Mobile Responsiveness**: Test on various screen sizes
5. **Error Handling**: Gracefully handle malformed data

## Troubleshooting

### Charts Not Rendering
- Check browser console for errors
- Verify JSON format is correct
- Ensure data arrays have matching lengths

### Table Performance
- Enable pagination for large datasets
- Consider server-side filtering for very large tables
- Optimize row rendering with virtualization if needed

### AI Not Generating Visualizations
- Use the Data Visualization Specialist agent
- Be specific about the type of visualization needed
- Provide clear data requirements in the prompt
