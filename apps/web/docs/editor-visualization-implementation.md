# Editor Visualization Implementation

## Overview

The editor now supports generating and inserting charts and tables from selected text using AI. This feature is accessible through the selection toolbar that appears when text is selected in the TipTap editor.

## How It Works

### 1. User Flow
1. User selects text in the editor
2. Selection toolbar appears with "Visualize" dropdown
3. User chooses visualization type (Auto-detect, Chart, Table, Timeline, Comparison)
4. AI generates appropriate visualization data
5. Visualization is inserted into the editor at the cursor position

### 2. Architecture

#### Components
- **EditorSelectionToolbar**: Provides UI for visualization actions
- **EssayEditor**: Handles visualization generation and insertion
- **ChartNode/DataTableNode**: TipTap extensions for rendering visualizations
- **visualization-generator**: Utility for AI-powered visualization generation

#### Data Flow
```
Selected Text → AI API → Visualization Data → TipTap Node → Rendered Chart/Table
```

### 3. Key Changes Made

#### Fixed Build Error
- Fixed TypeScript error in `test-chat-visualization-diagnostics.ts` by properly using the `addMessage` method to create messages with required `id` and `timestamp` fields

#### Enhanced Error Handling
- Added loading states during visualization generation
- Added user-facing error messages when visualization fails
- Reuse the AI modal to show errors with proper context

#### Fixed Config Extraction
- Properly handle the config object from API response
- Cast config to `any` to avoid TypeScript union type issues
- Provide sensible defaults when config is missing

## API Response Format

The visualization API returns data in this format:

### For Charts:
```json
{
  "type": "chart",
  "data": {
    "labels": ["Q1", "Q2", "Q3", "Q4"],
    "datasets": [{
      "label": "Sales",
      "data": [1.2, 1.5, 1.8, 2.1],
      "backgroundColor": "#3b82f6",
      "borderColor": "#2563eb"
    }]
  },
  "config": {
    "type": "bar",
    "title": "Quarterly Sales",
    "xAxisLabel": "Quarter",
    "yAxisLabel": "Sales (M)",
    "showLegend": true,
    "showGrid": true
  }
}
```

### For Tables:
```json
{
  "type": "table",
  "data": {
    "headers": ["Product", "Price", "Rating"],
    "rows": [
      ["iPhone 15 Pro", "$999", "4.8"],
      ["Galaxy S24", "$899", "4.6"],
      ["Pixel 8", "$699", "4.7"]
    ]
  },
  "config": {
    "title": "Product Comparison",
    "sortable": true,
    "filterable": true
  }
}
```

## Testing

### Test Scripts
1. **test-editor-visualization-flow.ts**: Tests the visualization generation pipeline
2. **test-chat-visualization-diagnostics.ts**: Tests the full chat integration
3. **test-editor-visualizations.ts**: Tests visualization detection and generation

### Running Tests
```bash
npm run tsx src/scripts/test-editor-visualization-flow.ts
```

## Usage Guide

### For Users
1. Select any text containing data (numbers, comparisons, trends)
2. Click "Visualize" in the selection toolbar
3. Choose visualization type or let AI auto-detect
4. Wait for generation (loading indicator shown)
5. Chart/table appears in the editor

### For Developers
1. The visualization system uses Vertex AI's data-visualization agent
2. Charts use Chart.js for rendering
3. Tables use a custom React component
4. Both are implemented as TipTap node extensions

## Troubleshooting

### Common Issues
1. **No visualization generated**: Check if Vertex AI service is available
2. **Invalid data structure**: Ensure API returns correct format
3. **TypeScript errors**: Config objects may need type casting

### Debug Steps
1. Check browser console for errors
2. Verify API response format matches expected structure
3. Ensure authentication token is valid
4. Check if visualization nodes are properly registered in TipTap

## Future Improvements
1. Add more chart types (scatter, radar, etc.)
2. Support for real-time data updates
3. Export visualizations as images
4. Custom styling options
5. Data source connections
