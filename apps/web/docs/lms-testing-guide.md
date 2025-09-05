# LMS Testing Guide

This guide provides instructions for testing the Learning Management System (LMS) implementation.

## Quick Start

### 1. Access the Test Page

Navigate to: `http://localhost:3000/lms-test`

This dedicated test page allows you to:
- Browse available courses
- Enroll in courses
- Navigate through course steps
- Take quizzes
- Track progress
- Test all LMS components

### 2. Run API Tests

```bash
# Run the API test script
npm run tsx src/scripts/test-lms-api.ts

# Or with environment variables
TEST_USER_EMAIL=your-email@example.com TEST_USER_PASSWORD=your-password npm run tsx src/scripts/test-lms-api.ts
```

## Manual Testing Checklist

### Course Selection & Browsing
- [ ] **View all courses**: Verify sample courses are displayed
- [ ] **Search functionality**: Search for "hermeneutics" or "theology"
- [ ] **Filter by difficulty**: Test beginner/intermediate/advanced filters
- [ ] **Filter by category**: Test biblical-studies/theology/ministry filters
- [ ] **Tab navigation**: Switch between All/In Progress/Completed/Recommended tabs

### Course Enrollment
- [ ] **Enroll in a course**: Click "Start Course" on any course card
- [ ] **Verify enrollment**: Check that course appears in "In Progress" tab
- [ ] **Progress initialization**: Confirm you're placed at the first step

### Step Navigation
- [ ] **View course overview**: Expand the course overview section
- [ ] **Navigate between steps**: Use Previous/Next buttons
- [ ] **Check step locking**: Verify you can't access future steps until current is complete
- [ ] **Progress indicators**: Confirm visual progress updates

### Learning Activities

#### Lessons
- [ ] **View instructions**: Check the Instructions tab
- [ ] **See initial prompt**: Verify the AI prompt is displayed
- [ ] **Agent assignment**: Confirm correct agent is assigned
- [ ] **Time tracking**: Watch the timer increment
- [ ] **Complete step**: Click "Mark Step as Complete"

#### Quizzes
- [ ] **Take the quiz**: Navigate to "Introduction Module Quiz"
- [ ] **Answer questions**: Test multiple choice, true/false, short answer
- [ ] **Submit quiz**: Complete and submit the quiz
- [ ] **View results**: Check score and feedback
- [ ] **Retry functionality**: If failed, test retry option

### Progress Tracking
- [ ] **Overall progress**: Verify percentage updates
- [ ] **Step completion**: Check completed steps show checkmarks
- [ ] **Time tracking**: Confirm time spent is recorded
- [ ] **Module progress**: Verify module completion requirements

## API Testing

The API test script (`test-lms-api.ts`) tests:

1. **Authentication**: Firebase token generation
2. **Get Courses**: Retrieve all available courses
3. **Get Enrollments**: Fetch user's enrolled courses
4. **Enroll in Course**: Create new enrollment
5. **Filtered Queries**: Test search and filters

### Expected Results

```
=== LMS API Test Suite ===
✓ Authentication successful
✓ Get courses successful
  Found 3 courses
✓ Get enrollments successful
  Found 0 enrollments (initially)
✓ Enrollment successful
✓ Get enrollments successful
  Found 1 enrollments (after enrollment)
```

## Database Verification

After testing, verify data in MongoDB:

```javascript
// Check courses collection
db.lmsCourses.find().pretty()

// Check user progress
db.lmsProgress.find({ userId: "your-user-id" }).pretty()

// Check quiz attempts
db.lmsQuizAttempts.find({ userId: "your-user-id" }).pretty()
```

## Test Scenarios

### Scenario 1: Complete First Lesson
1. Navigate to LMS test page
2. Select "Biblical Hermeneutics 101"
3. View first step instructions
4. Note the time requirement (5 minutes)
5. Wait or manually complete the step
6. Verify progress updates to next step

### Scenario 2: Take and Pass Quiz
1. Navigate to the quiz step
2. Answer all questions:
   - Q1: "The science and art of biblical interpretation"
   - Q2: False
   - Q3: Any valid reason about original audience
3. Submit quiz
4. Verify passing score (75%+)
5. Check that step is marked complete

### Scenario 3: Test Progress Persistence
1. Complete a few steps in a course
2. Navigate away from the page
3. Return to the LMS test page
4. Select the same course
5. Verify you resume from where you left off

### Scenario 4: Test Multiple Enrollments
1. Enroll in "Biblical Hermeneutics 101"
2. Complete some steps
3. Go back to course selection
4. Enroll in "Youth Ministry Essentials"
5. Verify both appear in "In Progress" tab

## Edge Cases to Test

### Authentication
- [ ] Test with expired token
- [ ] Test without authentication
- [ ] Test with invalid credentials

### Course Operations
- [ ] Enroll in same course twice (should resume)
- [ ] Try to access locked steps directly
- [ ] Complete course out of order

### Quiz Edge Cases
- [ ] Submit quiz with no answers
- [ ] Exceed retry limit
- [ ] Close browser during quiz

### Performance
- [ ] Load with many courses
- [ ] Quick navigation between steps
- [ ] Multiple concurrent enrollments

## Troubleshooting

### Common Issues

1. **"Courses not found"**
   - Ensure MongoDB is running
   - Check that sample courses are seeded
   - Verify API route is accessible

2. **"Authentication failed"**
   - Check Firebase configuration
   - Verify user credentials
   - Ensure token is valid

3. **"Progress not saving"**
   - Check MongoDB connection
   - Verify user ID is correct
   - Check console for errors

### Debug Information

The test page includes a debug panel showing:
- Current course ID
- Current step ID
- Overall progress percentage
- LMS mode status

## Integration with Chat

To test full chat integration:

1. Modify your chat page to include LMS mode toggle
2. Select a course and step
3. Verify agent switches automatically
4. Send messages and track interactions
5. Complete step requirements through chat

## Next Steps

After basic testing:

1. **Performance Testing**: Test with multiple users
2. **Content Testing**: Add more diverse course content
3. **UI/UX Testing**: Gather user feedback
4. **Mobile Testing**: Verify responsive design
5. **Accessibility Testing**: Check keyboard navigation and screen readers
