# Chat Visualization Fix - Enhanced AI Prompting

## Issue Summary
When users asked questions about topics containing comparisons or statistics (like the Methodist Church split), the AI would generate text responses with markdown tables but wouldn't generate the required JSON visualization blocks that the system needs to render interactive charts and tables.

## Root Cause
The AI agents had visualization instructions in their system prompts, but these instructions weren't prominent or specific enough. The AI would often ignore them and just provide markdown-formatted responses.

## Solution Implemented

### 1. Enhanced System Prompts
Updated the AI agent prompts to be more explicit about when visualizations are required:

#### General Assistant Agent
- Added "IMPORTANT" section listing specific triggers for visualizations
- Made it mandatory to include visualizations for:
  - Comparisons between groups, organizations, or viewpoints → table
  - Statistical data or percentages → pie/bar chart
  - Timeline or historical progression → line chart
  - Structured information with multiple categories → table

#### Essay Writer Agent
- Added "IMPORTANT VISUALIZATION RULES" section
- Made visualizations mandatory for:
  - Comparisons between groups, denominations, or theological positions
  - Statistics or percentages (like "25% of churches")
  - Organizational structures or hierarchies
  - Any structured information with multiple categories

### 2. Technical Implementation
The visualization system works as follows:

1. **AI Response Generation**: AI generates response with JSON visualization blocks
2. **Parsing**: `VisualizationParser.processResponse()` extracts JSON blocks
3. **Attachment Creation**: JSON blocks are converted to chat attachments
4. **Rendering**: `ChartRenderer` and `TableRenderer` components display the data

### 3. Example of Expected AI Output

For a question about the Methodist Church split, the AI should now generate:

```markdown
The recent division within The United Methodist Church...

[Text content here]

```json
{
  "type": "table",
  "data": {
    "headers": ["Aspect", "United Methodist Church (UMC)", "Global Methodist Church (GMC)"],
    "rows": [
      ["Theological Stance", "Progressive/Centrist", "Traditional/Conservative"],
      ["Marriage View", "Inclusive of same-sex marriage", "Between one man and one woman"],
      ["Structure", "Episcopal with global bureaucracy", "Leaner with local church authority"]
    ]
  },
  "config": {
    "title": "Comparison of UMC and GMC Positions"
  }
}
```

```json
{
  "type": "chart",
  "data": {
    "values": [
      {"name": "Churches Remaining in UMC", "value": 75, "color": "#3b82f6"},
      {"name": "Churches Joining GMC", "value": 25, "color": "#10b981"}
    ]
  },
  "config": {
    "type": "pie",
    "title": "Distribution of Churches After Split (Approximate %)"
  }
}
```

## Testing the Fix

To verify the visualization generation is working:

1. Ask questions that contain:
   - Comparisons: "Compare X and Y"
   - Statistics: "What percentage of..."
   - Timelines: "Show the history of..."
   - Structured data: "List the differences between..."

2. Check that the AI response includes:
   - The text explanation
   - JSON code blocks with visualization data
   - Rendered charts/tables below the text

## User Guidance

### For Best Results:
1. **Be explicit about wanting visualizations**: 
   - "Show me a chart of..."
   - "Create a table comparing..."
   - "Visualize the data about..."

2. **Use the Data Visualization agent** for dedicated visualization tasks

3. **Common visualization triggers**:
   - Comparisons between entities
   - Statistical or percentage data
   - Historical progressions
   - Organizational structures
   - Multi-category information

### Troubleshooting:
- If visualizations aren't appearing, try rephrasing to explicitly request a chart or table
- Use the Data Visualization specialist agent for complex visualization needs
- Check the browser console for any rendering errors

## Files Modified
1. `src/lib/services/vertex-ai.service.ts` - Enhanced AI agent system prompts with explicit visualization rules
2. `src/components/chat/TableRenderer.tsx` - Added max-width constraint and consistent padding
3. `src/components/chat/ChartRenderer.tsx` - Added max-width constraint and overflow handling
4. `src/components/chat/ChatContainer.tsx` - Fixed width alignment for chat input

## Key Changes Made

### Width Constraint Fixes
- Added `cn("max-w-full", className)` to both TableRenderer and ChartRenderer Card components
- This ensures visualizations respect the parent container's max-width (max-w-3xl from ChatMessage)
- Added `overflow-x-auto` to table containers for responsive behavior with wide content
- Added consistent `p-4` padding to CardContent for uniform styling

### AI Prompt Enhancements
- Made visualization generation mandatory for specific content types
- Added "IMPORTANT" sections to General Assistant and Essay Writer agents
- Specified exact visualization types for different content patterns:
  - Comparisons → Table
  - Statistics/Percentages → Pie/Bar Chart
  - Timelines → Line Chart
  - Structured Information → Table

## Future Improvements
1. Add more sophisticated prompt engineering for edge cases
2. Implement fallback visualization generation if AI doesn't include them
3. Add user preferences for automatic visualization generation
4. Enhance the visualization parser to handle more formats
5. Consider adding responsive breakpoints for mobile views
