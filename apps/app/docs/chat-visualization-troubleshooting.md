# Chat Visualization Troubleshooting Guide

## Overview

The chat visualization system allows AI agents to generate charts and tables that are displayed inline with chat messages. This guide helps troubleshoot issues when visualizations aren't appearing.

## System Architecture

1. **AI Generation**: Vertex AI agents include JSON blocks in their responses when visualizations are needed
2. **Parsing**: `VisualizationParser` extracts these JSON blocks from the response
3. **Storage**: The chat API saves attachments in message metadata
4. **Rendering**: `ChatMessage` component renders attachments using `ChartRenderer` and `TableRenderer`

## How Visualizations Work

### 1. AI Agent Prompts
Agents are instructed to include JSON blocks when presenting data:

```json
// For charts:
{
  "type": "chart",
  "data": {
    "labels": ["Label1", "Label2"],
    "datasets": [{
      "label": "Dataset Name",
      "data": [value1, value2]
    }]
  },
  "config": {
    "type": "bar|line|pie|etc",
    "title": "Chart Title"
  }
}

// For tables:
{
  "type": "table",
  "data": {
    "headers": ["Column1", "Column2"],
    "rows": [["Row1Col1", "Row1Col2"]]
  },
  "config": {
    "title": "Table Title"
  }
}
```

### 2. Data Flow
1. User sends a message requesting visualization
2. AI generates response with JSON blocks
3. Chat API extracts visualizations using `VisualizationParser`
4. Attachments are saved to message metadata
5. After streaming completes, session is reloaded
6. `ChatMessage` component renders attachments

## Debugging Steps

### 1. Check Browser Console
Add these debug logs to see what's happening:

- Look for `[ChatPage]` logs showing message counts and attachments
- Look for `[ChatMessage]` logs showing attachment rendering
- Look for `[useChat]` logs showing the streaming process

### 2. Verify AI is Generating Visualizations
Test with specific prompts that should trigger visualizations:
- "Show me a pie chart of church budget breakdown"
- "Compare Methodist and Baptist governance in a table"
- "Display church growth over 5 years as a line chart"

### 3. Check Agent Selection
Ensure you're using an agent that supports visualizations:
- `data-visualization` - Best for charts and tables
- `essay-writer` - Includes visualizations in essays
- `general-assistant` - Basic visualization support

### 4. Verify Data is Being Saved
The diagnostic scripts confirm that:
- ✅ AI is generating visualization JSON blocks
- ✅ Parser is extracting them correctly
- ✅ Attachments are being saved to the database
- ✅ Messages are being reloaded with attachments

### 5. Common Issues

#### Charts Not Showing
1. **Agent not selected**: Ensure an agent is selected before sending messages
2. **Session not reloading**: Check that `loadSession` is called after streaming
3. **Rendering issues**: Verify ChartRenderer and TableRenderer are imported

#### Data Not Persisting
1. **Streaming not completing**: Ensure the stream reaches `[DONE]`
2. **Session ID mismatch**: Verify the correct session is being loaded

## Testing Visualizations

Run the diagnostic scripts:

```bash
# Test AI generation and parsing
npm run tsx src/scripts/test-chat-visualization-diagnostics.ts

# Test full end-to-end flow
npm run tsx src/scripts/test-chat-visualization-e2e.ts
```

## Best Practices

1. **Use the right agent**: `data-visualization` agent is optimized for charts
2. **Be specific**: Request specific chart types (pie, bar, line, etc.)
3. **Provide context**: Give the AI enough information to generate meaningful data
4. **Check the console**: Debug logs will show if attachments are present

## Example Prompts That Work

1. "Show me a pie chart of budget allocation by department"
2. "Create a bar chart comparing attendance across different services"
3. "Display a line chart of membership growth over the last 5 years"
4. "Compare different church governance models in a table"
5. "Show donation trends as an area chart"

## Troubleshooting Checklist

- [ ] Browser console shows no errors
- [ ] Using an agent that supports visualizations
- [ ] AI response contains JSON blocks (check network tab)
- [ ] Session messages show attachments after reload
- [ ] ChartRenderer/TableRenderer components are rendering
- [ ] No TypeScript errors in the console

## Next Steps

If visualizations still aren't showing after following this guide:

1. Check the browser console for specific error messages
2. Verify the MongoDB connection is working
3. Ensure all required dependencies are installed
4. Check that the Vertex AI service is properly configured
