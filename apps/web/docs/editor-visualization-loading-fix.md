# Essay Editor Visualization Loading Fix

## Problem
When opening a chat message in the Essay Editor, only the text content was being loaded. Charts and tables that were generated as part of the chat response were not appearing in the editor, even though they were visible in the chat panel.

## Root Cause
The Essay Editor was only processing the text content from `message.content` and not checking for any visualizations stored in `message.metadata.attachments`.

## Solution
Added a new `useEffect` hook in `EssayEditor.tsx` that:

1. **Checks for attachments**: After the editor is ready, it checks if the message has any attachments in `message.metadata?.attachments`

2. **Waits for initialization**: Uses a 500ms timeout to ensure the editor is fully initialized with the text content before inserting visualizations

3. **Inserts visualizations**: For each attachment:
   - Moves the cursor to the end of the document
   - Inserts a paragraph break for spacing
   - Uses the existing `insertChartFromAI` or `insertDataTableFromAI` functions to insert the visualization

## Code Changes

### src/components/chat/EssayEditor.tsx
```typescript
// Load visualizations after editor is ready
useEffect(() => {
  if (editor && message?.metadata?.attachments && message.metadata.attachments.length > 0) {
    // Wait a bit for the editor to be fully initialized with content
    setTimeout(() => {
      console.log('[EssayEditor] Loading attachments:', message.metadata!.attachments);
      
      // Insert each attachment at the end of the document
      message.metadata!.attachments!.forEach((attachment) => {
        if (attachment.type === 'chart' && attachment.data && attachment.config) {
          console.log('[EssayEditor] Inserting chart:', attachment);
          // Move cursor to end of document
          editor.commands.focus('end');
          // Insert a new line before the chart
          editor.commands.insertContent('<p></p>');
          // Insert the chart
          insertChartFromAI(editor, attachment.data as any, attachment.config as any);
        } else if (attachment.type === 'table' && attachment.data && attachment.config) {
          console.log('[EssayEditor] Inserting table:', attachment);
          // Move cursor to end of document
          editor.commands.focus('end');
          // Insert a new line before the table
          editor.commands.insertContent('<p></p>');
          // Insert the table
          insertDataTableFromAI(editor, attachment.data as any, attachment.config as any);
        }
      });
    }, 500); // Give editor time to initialize with text content
  }
}, [editor, message]);
```

## How It Works

1. **Message Structure**: Chat messages can have visualizations stored in `metadata.attachments` array
2. **Attachment Format**: Each attachment has:
   - `type`: 'chart' or 'table'
   - `data`: The visualization data (labels, datasets for charts; headers, rows for tables)
   - `config`: Configuration options (chart type, title, etc.)
3. **Loading Process**:
   - Text content loads first via the existing `useEffect`
   - Visualizations load after a delay to ensure proper editor initialization
   - Each visualization is appended to the end of the document

## Benefits

- **Complete Content**: Users now see the full response including visualizations when editing
- **Proper Formatting**: Visualizations are properly spaced with paragraph breaks
- **Maintains Order**: Visualizations appear at the end, preserving the text flow
- **No Data Loss**: All generated content is preserved when moving to the editor

## Testing

To test this fix:
1. Generate a chat response that includes a table or chart
2. Click "Open in Editor" on that message
3. Verify that both the text and visualizations appear in the editor
4. Confirm that visualizations are editable and can be modified

## Future Improvements

1. **Preserve Position**: Currently visualizations are added at the end. Could preserve their original position within the text.
2. **Loading Indicator**: Show a loading state while visualizations are being inserted
3. **Error Handling**: Add better error handling if visualization insertion fails
4. **Batch Operations**: Insert all visualizations in a single transaction for better performance
