# Activity Tracker Date Filtering Implementation

## Overview
The Activity Tracker component provides a comprehensive view of user activity with date filtering capabilities, allowing users to view their activity data for different time periods including specific years, months, or preset ranges.

## Features

### 1. Complete Activity Dashboard
**File**: `src/components/dashboard/ActivityTracker.tsx`
- **Stats Grid**: Displays Total Activities, Current Streak, Longest Streak, and Active Days
- **Date Range Filter**: Dropdown selector for different time periods
- **Contribution Graph**: GitHub-style heatmap with fixed month label alignment
- **Activity Breakdown**: Shows activity types and their counts
- **Export Functionality**: Allows users to export their activity data

### 2. Date Range Filtering Options
The component provides multiple preset and dynamic date range options:
- Last 30 days
- Last 90 days
- Last 12 months (default)
- Individual years (dynamically populated based on user's activity history)
- Individual months for the current year

### 3. Enhanced API Endpoints
**Files**: 
- `src/app/api/activities/contributions/route.ts`
- `src/app/api/activities/stats/route.ts`

Both endpoints support:
- `startDate` and `endDate` query parameters for custom date ranges
- Backward compatibility with the `days` parameter
- When date range is provided, it takes precedence over days

### 4. Activity Service Methods
**File**: `src/lib/services/activity.service.ts`
- `getContributionDataByDateRange()`: Fetches contribution data within specific dates
- `getActivityStatsByDateRange()`: Calculates stats within date ranges
- `calculateStats()`: Private method for stats calculation to avoid code duplication
- Proper date filtering and activity level calculation

### 5. Fixed Month Label Alignment
**File**: `src/components/dashboard/ContributionGraph.tsx`
- Improved month label positioning using absolute positioning
- Accurate date handling with date-fns functions
- Proper alignment of month labels with calendar dates

## Implementation Details

### Date Range Type
```typescript
type DateRange = {
  label: string;
  startDate: Date;
  endDate: Date;
};
```

### API Usage
```typescript
// Fetch stats for selected period
const statsParams = new URLSearchParams({
  startDate: selectedRange.startDate.toISOString(),
  endDate: selectedRange.endDate.toISOString(),
});

// Fetch contribution data for selected period
const contributionParams = new URLSearchParams({
  startDate: selectedRange.startDate.toISOString(),
  endDate: selectedRange.endDate.toISOString(),
});
```

### Dynamic Year Detection
The component automatically fetches all user activities to determine available years:
```typescript
const activities = await fetch('/api/activities', {
  headers: { 'Authorization': `Bearer ${token}` },
});
const years = new Set<number>();
activities.forEach((activity: any) => {
  years.add(new Date(activity.timestamp).getFullYear());
});
```

## User Experience

1. **Flexible Time Views**: Users can easily switch between different time periods
2. **Context-Aware Stats**: All statistics update based on the selected time period
3. **Visual Feedback**: Loading states and error handling for better UX
4. **Responsive Design**: Works well on both desktop and mobile devices

## Testing
**File**: `src/scripts/test-activity-tracker-filtering.ts`
- Tests different date range queries
- Validates contribution data generation
- Verifies stats calculation for various periods
- Checks activity level distribution

## Future Enhancements
1. Custom date range picker for more granular control
2. Comparison view between different time periods
3. Advanced filtering by activity type
4. Performance optimization with data caching
5. Activity insights and trends analysis

## Usage
The ActivityTracker component can be used in any dashboard or insights page:
```tsx
import { ActivityTracker } from '@/components/dashboard/ActivityTracker';

export function InsightsPage() {
  return (
    <div>
      <ActivityTracker />
    </div>
  );
}
```

The component is self-contained and handles all data fetching, state management, and UI rendering internally.
