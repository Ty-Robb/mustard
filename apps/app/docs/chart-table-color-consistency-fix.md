# Chart and Table Color Consistency Fix

## Issue
User reported that "the colours of the card around the tables and charts do not match" in the TipTap editor nodes.

## Root Cause
The issue was caused by:
1. ChartRenderer and TableRenderer were using different color schemes (`bg-muted/30` vs `bg-card`)
2. In the theme, `--card` and `--muted` have different color values:
   - Dark mode: `--card: oklch(0.216 0.006 56.043)`
   - Dark mode: `--muted: oklch(0.268 0.007 34.298)`
3. DataTableNode had an extra wrapper div with different styling

## Solution
Updated the visualization components and TipTap nodes:
1. ChartRenderer and TableRenderer now use consistent `bg-card/30` for inner containers
2. Removed Card component dependency from both renderers
3. Removed extra wrapper div from DataTableNode

## Changes Made

### ChartRenderer.tsx
- Replaced Card component with div element
- Changed inner container from `bg-muted/30` to `bg-card/30`
- Maintained all other styling classes

### TableRenderer.tsx
- Replaced Card component with div element  
- Changed inner container from `bg-muted/30` to `bg-card/30`
- Maintained all other styling classes

### DataTableNode.tsx
- Removed the extra wrapper div with `border rounded-lg p-4 bg-background`
- Now directly renders TableRenderer without additional styling

## Final Styling Structure
Both ChartRenderer and TableRenderer now use:
```
Outer wrapper: bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg
Inner container: bg-card/30 backdrop-blur-sm p-4 border border-border/30 rounded-lg
```

This ensures visual consistency between chart and table visualizations in both:
- Chat interface (when used in ChatMessage component)
- TipTap editor (when used in ChartNode and DataTableNode)
