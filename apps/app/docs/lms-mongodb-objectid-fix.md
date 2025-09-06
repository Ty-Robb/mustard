# LMS MongoDB ObjectId Fix

## Issue
The LMS course selector was passing MongoDB's `_id` field (ObjectId) instead of the course's actual `id` field, causing 404 errors when trying to fetch course details.

## Root Cause
When courses were stored in MongoDB, they received an automatic `_id` field (ObjectId). The LMS service was incorrectly overwriting the course's `id` field with the MongoDB `_id`, causing confusion between:
- MongoDB's `_id`: e.g., `68b74b5555a12e18fd730a87`
- Course's actual `id`: e.g., `intro-to-bible-study`

## Solution Implemented

### 1. Updated Course API Endpoint (`/api/lms/courses/[courseId]/route.ts`)
- Added support for both regular IDs and MongoDB ObjectIds
- First tries to find by the `id` field
- Falls back to `_id` search if the courseId looks like an ObjectId
- Always strips out the `_id` field from responses

```typescript
// First try to find by regular id field
let course = await collection.findOne({ id: courseId });

// If not found and courseId looks like an ObjectId, try searching by _id
if (!course && /^[0-9a-fA-F]{24}$/.test(courseId)) {
  try {
    course = await collection.findOne({ _id: new ObjectId(courseId) });
  } catch (error) {
    // Invalid ObjectId format, ignore
  }
}
```

### 2. Updated Courses Listing API (`/api/lms/courses/route.ts`)
- Ensures all courses returned strip out the `_id` field
- Prevents MongoDB ObjectIds from being sent to the client

```typescript
const cleanedCourses = courses.map((course: any) => {
  if (course._id) {
    const { _id, ...courseWithoutId } = course;
    return courseWithoutId;
  }
  return course;
});
```

### 3. Updated LMS Service (`/lib/services/lms.service.ts`)
- Fixed `getCourses()` to remove `_id` fields
- Fixed `getCourse()` to support both ID types
- Updated enrollment to use course's actual ID

## Testing
Created test script `src/scripts/test-mongodb-objectid-fix.ts` to verify:
1. Courses in database have both `_id` and `id` fields
2. API can find courses by regular ID
3. API can find courses by ObjectId (for backward compatibility)
4. API responses don't include `_id` field

## Impact
- Course selection now works correctly
- No more 404 errors when selecting courses
- Backward compatible with existing ObjectId references
- Clean separation between MongoDB internals and application IDs

## Best Practices
1. Always use the course's `id` field in application logic
2. Strip MongoDB's `_id` field from API responses
3. Support ObjectId lookups for backward compatibility
4. Use consistent ID fields across the application
