# Activity Tracker Implementation

## Overview

This document describes the implementation of a GitHub-style activity tracker for the LMS platform. The activity tracker monitors user activities across the platform and displays them in a contribution graph similar to GitHub's contribution calendar.

## Architecture

### Components

1. **Activity Types** (`src/types/activity.ts`)
   - Defines all trackable activities in the system
   - Includes metadata interfaces for activity details
   - Provides types for contribution data and statistics

2. **Activity Service** (`src/lib/services/activity.service.ts`)
   - Singleton service for activity management
   - Handles activity logging and retrieval
   - Calculates contribution data and statistics
   - Manages streak calculations

3. **API Endpoints**
   - `POST /api/activities` - Log new activities
   - `GET /api/activities` - Retrieve activities with filters
   - `GET /api/activities/stats` - Get user statistics
   - `GET /api/activities/contributions` - Get contribution graph data

4. **UI Components**
   - `ContributionGraph` - GitHub-style heatmap visualization
   - `ActivityTracker` - Main dashboard widget with stats and graph

5. **Activity Logger Utility** (`src/lib/utils/activity-logger.ts`)
   - Convenience functions for logging specific activity types
   - Handles authentication token management
   - Provides type-safe activity logging

## Activity Types

The system tracks the following activities:

- **Learning Activities**
  - `CHAPTER_READ` - User completes reading a chapter
  - `QUIZ_TAKEN` - User attempts a quiz
  - `QUIZ_PASSED` - User passes a quiz
  - `COURSE_STARTED` - User begins a new course
  - `COURSE_COMPLETED` - User completes a course

- **Content Creation**
  - `HIGHLIGHT_CREATED` - User highlights a verse
  - `NOTE_CREATED` - User adds a note
  - `PRESENTATION_CREATED` - User creates a presentation
  - `DOCUMENT_CREATED` - User creates a document

- **Bible Study**
  - `BIBLE_READING` - User reads Bible passages
  - `READING_PLAN_PROGRESS` - User progresses in reading plan

- **Engagement**
  - `CHAT_MESSAGE` - User sends a chat message

- **Commerce**
  - `PAYMENT_MADE` - User makes a payment
  - `COURSE_PURCHASED` - User purchases a course

## Database Schema

Activities are stored in MongoDB with the following structure:

```typescript
{
  _id: ObjectId,
  userId: string,
  type: ActivityType,
  timestamp: Date,
  metadata: {
    title?: string,
    description?: string,
    score?: number,
    duration?: number,
    verses?: string[],
    planId?: string,
    amount?: number,
    [key: string]: any
  },
  courseId?: string,
  chapterId?: string,
  quizId?: string
}
```

## Integration Points

### 1. Quiz System Integration

Add to quiz submission handler:

```typescript
import { activityLogger } from '@/lib/utils/activity-logger';

// In quiz submission handler
const token = await user.getIdToken();
await activityLogger.quizTaken(token, courseId, quizId, score);

if (passed) {
  await activityLogger.quizPassed(token, courseId, quizId, score);
}
```

### 2. Course Progress Integration

Add to course progress updates:

```typescript
// When starting a course
await activityLogger.courseStarted(token, courseId, courseTitle);

// When completing a chapter
await activityLogger.chapterRead(token, courseId, chapterId);

// When completing a course
await activityLogger.courseCompleted(token, courseId, courseTitle);
```

### 3. Bible Reading Integration

Add to Bible reader component:

```typescript
// When user reads a chapter
await activityLogger.bibleReading(token, bookName, chapter, versesCount);

// When highlighting a verse
await activityLogger.highlightCreated(token, verseId, bookName, color);
```

### 4. Payment Integration

Add to payment success handlers:

```typescript
// After successful payment
await activityLogger.paymentMade(token, amount, description);

// After course purchase
await activityLogger.coursePurchased(token, courseId, courseTitle, amount);
```

## UI Features

### Contribution Graph
- 365-day activity heatmap
- 5 intensity levels (0-4) based on activity count
- Hover tooltips showing activity count per day
- Responsive design with horizontal scrolling

### Activity Statistics
- Total activities count
- Current streak (consecutive days with activity)
- Longest streak achieved
- Total active days
- Activity breakdown by type

## Performance Considerations

1. **Caching**: Consider implementing Redis caching for:
   - Contribution data (refresh daily)
   - Activity statistics (refresh hourly)

2. **Indexing**: MongoDB indexes on:
   - `userId` + `timestamp` (compound index)
   - `type` for filtering
   - `courseId` for course-specific queries

3. **Aggregation**: Use MongoDB aggregation pipeline for:
   - Daily activity counts
   - Streak calculations
   - Activity type breakdowns

## Future Enhancements

1. **Gamification**
   - Achievement badges for milestones
   - Leaderboards for competitive learning
   - Points system for activities

2. **Social Features**
   - Share activity achievements
   - Follow other users' progress
   - Team/group activity tracking

3. **Analytics**
   - Detailed activity reports
   - Learning pattern analysis
   - Personalized recommendations

4. **Notifications**
   - Streak reminders
   - Achievement notifications
   - Weekly activity summaries

## Testing

### Test Script

Create `src/scripts/test-activity-tracker.ts`:

```typescript
import { activityService } from '@/lib/services/activity.service';
import { ActivityType } from '@/types/activity';

async function testActivityTracker() {
  // Test activity logging
  await activityService.logActivity({
    userId: 'test-user-id',
    type: ActivityType.CHAPTER_READ,
    metadata: { title: 'Test Chapter' },
    courseId: 'test-course',
    chapterId: 'test-chapter',
  });

  // Test contribution data
  const contributions = await activityService.getContributionData('test-user-id');
  console.log('Contributions:', contributions);

  // Test statistics
  const stats = await activityService.getActivityStats('test-user-id');
  console.log('Stats:', stats);
}
```

## Security Considerations

1. **Authentication**: All API endpoints require valid Firebase auth tokens
2. **Authorization**: Users can only access their own activity data
3. **Rate Limiting**: Consider implementing rate limits on activity logging
4. **Data Privacy**: Activity metadata should not contain sensitive information

## Monitoring

1. **Metrics to Track**
   - Activity logging success/failure rates
   - API endpoint response times
   - Database query performance

2. **Alerts**
   - Failed activity logging above threshold
   - Unusual activity patterns (potential abuse)
   - Database connection issues
