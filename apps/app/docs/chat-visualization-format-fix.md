# Chat Visualization Format Fix

## Issue
Charts were not displaying in the chat interface even though:
- The backend was correctly processing visualization data
- Messages were being saved with attachments
- The timing issue had been fixed

## Root Cause
There was a mismatch between the visualization format used by the AI agents and what the parser expected:
- AI agents were configured to use ````json` blocks
- The visualization parser was looking for ````chart` and ````table` blocks

## Solution

### 1. Updated Visualization Parser
Modified `src/lib/utils/visualization-parser.ts` to handle both formats:
- Added support for ````chart` and ````table` blocks
- Kept backward compatibility with ````json` blocks
- Added debug logging to track parsing

### 2. Updated AI Agent Prompts
Modified `src/lib/services/vertex-ai.service.ts` to use the correct format:
- Changed from ````json` to ````chart` for chart visualizations
- Changed from ````json` to ````table` for table visualizations
- Updated all agent prompts to use consistent formatting

## Format Examples

### Chart Format
```chart
{
  "data": {
    "labels": ["Label1", "Label2"],
    "datasets": [{
      "label": "Dataset Name",
      "data": [10, 20],
      "backgroundColor": "rgba(59, 130, 246, 0.5)",
      "borderColor": "rgb(59, 130, 246)"
    }]
  },
  "config": {
    "type": "bar",
    "title": "Chart Title"
  }
}
```

### Table Format
```table
{
  "data": {
    "headers": ["Column1", "Column2"],
    "rows": [["Row1Col1", "Row1Col2"]]
  },
  "config": {
    "title": "Table Title"
  }
}
```

## Testing
To test the fix:
1. Start a new chat session
2. Ask for a visualization (e.g., "Show me a chart of church attendance")
3. The AI should generate a response with a ````chart` block
4. The chart should render properly in the chat interface

## Files Modified
- `/src/lib/utils/visualization-parser.ts` - Added support for chart/table blocks
- `/src/lib/services/vertex-ai.service.ts` - Updated all agent prompts
- `/src/components/chat/ChartRenderer.tsx` - Added debug logging
- `/src/components/chat/ChatMessage.tsx` - Enhanced attachment logging
