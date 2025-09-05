# Theme-Aware Chart and Table Implementation

## Summary

Successfully updated ChartRenderer and TableRenderer components to use theme-aware CSS classes instead of hard-coded colors. The components now properly respond to light/dark/sepia theme changes in the application.

## Changes Made

### 1. ChartRenderer Component

#### Replaced Hard-coded Colors:
- **Card background**: `bg-gray-900/50` → `bg-card/50`
- **Inner container**: `bg-gray-800/30` → `bg-muted/30`
- **Borders**: `border-gray-700/50` → `border-border/50`
- **Text colors**: `text-gray-100` → `text-card-foreground`
- **Tooltip**: `bg-gray-800/95` → `bg-popover/95`
- **Pie chart legend**:
  - Border: `border-gray-700/30` → `border-border/30`
  - Labels: `text-gray-400` → `text-muted-foreground`
  - Values: `text-gray-200` → `text-foreground`

#### Dynamic Chart Colors:
- Added `getThemeColor` function to retrieve CSS variable values at runtime
- Implemented `useEffect` hook to update axis and grid colors when theme changes
- Added MutationObserver to listen for theme class changes on document element
- Chart axes and grids now use computed colors from theme variables

### 2. TableRenderer Component

#### Replaced Hard-coded Colors:
- **Card styling**: Same as ChartRenderer (card/50, border/50)
- **Search input**:
  - Icon: `text-gray-400` → `text-muted-foreground`
  - Input background: `bg-gray-800/50` → `bg-muted/50`
  - Input border: `border-gray-700` → `border-border`
  - Placeholder: `placeholder-gray-400` → `placeholder-muted-foreground`
- **Table container**: `bg-gray-800/30` → `bg-muted/30`
- **Table headers**: `text-gray-300` → `text-muted-foreground`
- **Table cells**: `text-gray-200` → `text-foreground`
- **Hover state**: `hover:bg-gray-800/50` → `hover:bg-muted/50`
- **Empty state**: `text-gray-400` → `text-muted-foreground`
- **Pagination**: `border-gray-700/30` → `border-border/30`

## Theme System Integration

The app uses CSS variables defined in `globals.css` for three themes:
- **Light theme**: Default root variables
- **Dark theme**: `.dark` or `.theme-dark` class
- **Sepia theme**: `.theme-sepia` class

### Key Theme Variables Used:
- `--card`: Card background color
- `--card-foreground`: Card text color
- `--border`: Border color
- `--muted`: Muted background color
- `--muted-foreground`: Muted text color
- `--foreground`: Primary text color
- `--popover`: Popover background color
- `--popover-foreground`: Popover text color

## Benefits

1. **Automatic Theme Switching**: Components now automatically adapt to theme changes without manual intervention
2. **Consistency**: Uses the same color system as other UI components in the app
3. **Maintainability**: Theme changes can be made centrally in `globals.css`
4. **Accessibility**: Proper contrast ratios maintained across all themes
5. **Future-proof**: Easy to add new themes or modify existing ones

## Testing

To test the implementation:
1. Toggle between light/dark/sepia themes in the app
2. Verify that charts and tables update their colors accordingly
3. Check that all text remains readable in all themes
4. Ensure hover states and interactive elements work properly

## Notes

- The chart data colors (bars, lines, pie slices) remain vibrant and consistent across themes for better data visualization
- The `getThemeColor` function includes fallbacks for oklch color values that need conversion
- The implementation uses Tailwind's opacity modifiers (e.g., `/50`, `/30`) to maintain visual hierarchy
