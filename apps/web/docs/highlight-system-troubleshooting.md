# Highlight System Troubleshooting Guide

## Current Status

The highlight system has been updated with improved text matching logic. Here's what was fixed:

### 1. Text Matching Improvements
- Added text normalization to handle:
  - Multiple spaces
  - Different quote styles (', ', ", ")
  - Case-insensitive matching
  - Trimmed whitespace

### 2. Reference Matching
- More flexible verse reference matching
- Handles cases where TipTap doesn't preserve `data-verse-id` attributes
- Falls back to applying highlights even without verse IDs

### 3. Debug Logging
- Added console logs to track:
  - Number of paragraphs with `data-verse-id`
  - Highlight processing status
  - Success/failure for each highlight

## Known Issues & Solutions

### Issue 1: TipTap Not Preserving data-verse-id Attributes

**Problem**: TipTap editor may strip custom HTML attributes when rendering content.

**Current Workaround**: The system now applies highlights even when verse IDs are missing, using flexible text matching.

**Future Solution**: Consider using TipTap's custom node types to preserve verse metadata.

### Issue 2: Highlights Not Displaying

**Possible Causes**:
1. Text mismatch between saved highlight and current Bible text
2. Different Bible translations having different text
3. Special characters or formatting differences

**Solutions**:
1. Check console logs for "❌ Could not find/apply highlight" messages
2. Verify the exact text being highlighted matches the Bible text
3. Use the normalized text matching (already implemented)

### Issue 3: Highlights Not Saving

**Debugging Steps**:
1. Check Network tab for POST requests to `/api/highlights`
2. Verify the request payload contains:
   - `reference` (verse ID)
   - `text` (selected text)
   - `type` (should be 'manual')
   - `color`
3. Check for authentication errors (401 status)

## Testing Highlights

### Manual Testing Steps:
1. Select text in the Bible reader
2. Click a highlight color
3. Check console for:
   - "handleHighlight called"
   - "Calling onHighlight with"
   - "✅ Highlight saved successfully"
4. Refresh the page
5. Check console for:
   - "BibleReader: Applying highlights, total: X"
   - "✅ Applied highlight X with color"

### Console Commands for Debugging:
```javascript
// Check if paragraphs have data-verse-id
document.querySelectorAll('p[data-verse-id]').length

// Get all verse IDs
Array.from(document.querySelectorAll('p[data-verse-id]')).map(p => p.getAttribute('data-verse-id'))

// Check TipTap content
editor.getJSON()
```

## Recommended Improvements

1. **Use TipTap Custom Nodes**: Create a custom paragraph node that preserves verse IDs
2. **Implement Fuzzy Text Matching**: Handle minor text variations
3. **Add Highlight Sync**: Sync highlights across different Bible translations
4. **Visual Feedback**: Show loading states when applying highlights
5. **Error Recovery**: Retry failed highlights with fallback strategies

## API Reference

### Create Highlight
```
POST /api/highlights
Authorization: Bearer <token>

{
  "reference": "GEN.1.1",
  "text": "In the beginning God created",
  "type": "manual",
  "color": "#fef3c7",
  "note": "",
  "tags": ["manual-highlight"]
}
```

### Get Highlights
```
GET /api/highlights?reference=GEN.1
Authorization: Bearer <token>
```

## Summary

The highlight system now has:
- ✅ Robust text matching
- ✅ Flexible reference matching
- ✅ Better error handling
- ✅ Comprehensive logging

If highlights still don't work after these fixes, check:
1. Console logs for specific error messages
2. Network tab for API failures
3. Whether the exact text exists in the current chapter
4. Authentication status
