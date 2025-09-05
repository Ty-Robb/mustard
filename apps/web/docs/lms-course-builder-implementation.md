# LMS Course Builder Implementation

## Overview

This document describes the implementation of the course builder admin interface for the Learning Management System (LMS). The course builder allows administrators to create, edit, and manage courses with a rich, user-friendly interface.

## Features Implemented

### 1. Course Management Pages

#### Admin Courses List (`/admin/courses`)
- **Features**:
  - View all courses in a grid layout
  - Search and filter courses (all, published, drafts)
  - Quick actions: Edit, Preview, Duplicate, Delete
  - Course metadata display (difficulty, enrollment count, ratings)
  - Create new course button

#### Course Creation (`/admin/courses/new`)
- **Features**:
  - Multi-tab interface (Details, Modules, Settings)
  - Course details form with all metadata fields
  - Module management with drag-and-drop (visual only)
  - Tag management system
  - Save as draft or publish immediately
  - Auto-calculation of course duration

#### Course Editor (`/admin/courses/[courseId]`)
- **Features**:
  - Full course editing capabilities
  - Module and step management
  - Step editor dialog with:
    - Multiple step types (lesson, quiz, assignment, etc.)
    - AI agent selection
    - Instructions and prompts
  - Real-time duration calculations
  - Published/unpublished toggle

### 2. API Endpoints

#### Course Management
- **GET `/api/lms/courses`**: List courses with admin flag support
- **POST `/api/lms/courses`**: Create new course or enroll in course
- **GET `/api/lms/courses/[courseId]`**: Get single course details
- **PUT `/api/lms/courses/[courseId]`**: Update course
- **DELETE `/api/lms/courses/[courseId]`**: Delete course

### 3. Data Model Updates

Added to `LMSCourse` interface:
```typescript
{
  isPublished?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  rating?: number;
  ratingCount?: number;
}
```

## Implementation Details

### Course Builder UI Components

1. **Course Card Component**
   - Displays course summary information
   - Shows difficulty badge with color coding
   - Published/Draft status indicator
   - Quick action buttons

2. **Module Editor**
   - Expandable module sections
   - Inline editing of module details
   - Step management within each module
   - Visual hierarchy with indentation

3. **Step Editor Dialog**
   - Modal interface for step creation/editing
   - Dynamic form based on step type
   - AI agent selection dropdown
   - Content configuration fields

### State Management

The course builder uses React's useState for local state management:
- Course data state
- Form states for editing
- UI states (loading, saving, active tabs)
- Temporary states for dialogs

### Authentication & Authorization

Currently implements basic authentication:
- Bearer token validation
- TODO: Add proper admin role checking
- Placeholder for auth token retrieval

## Usage Guide

### Creating a New Course

1. Navigate to `/admin/courses`
2. Click "Create Course" button
3. Fill in course details:
   - Title and description
   - Category and difficulty
   - Estimated hours
   - Tags for searchability
4. Add modules:
   - Switch to Modules tab
   - Click "Add Module"
   - Configure module details
5. Add steps to modules:
   - Click "Add Step" within a module
   - Select step type and AI agent
   - Configure step content
6. Save as draft or publish

### Editing Existing Courses

1. From courses list, click Edit button
2. Make changes across tabs:
   - Update basic information
   - Add/remove modules
   - Modify steps
3. Save changes
4. Toggle published status as needed

### Course Structure Best Practices

1. **Module Organization**
   - 3-7 modules per course
   - Clear progression from basic to advanced
   - Each module 30-90 minutes

2. **Step Design**
   - Mix different step types
   - 10-20 minutes per step
   - Clear learning objectives
   - Appropriate AI agent selection

3. **Content Guidelines**
   - Engaging titles and descriptions
   - Clear instructions for each step
   - Helpful initial prompts for AI interactions

## API Integration

### Creating a Course Programmatically

```javascript
const createCourse = async (courseData) => {
  const response = await fetch('/api/lms/courses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Course Title',
      description: 'Course description',
      difficulty: 'beginner',
      category: 'biblical-studies',
      modules: [...],
      isPublished: false
    })
  });
  
  const { courseId } = await response.json();
  return courseId;
};
```

### Updating a Course

```javascript
const updateCourse = async (courseId, updates) => {
  const response = await fetch(`/api/lms/courses/${courseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });
  
  return response.ok;
};
```

## Future Enhancements

### Immediate Priorities
1. **Authentication**
   - Implement proper admin role checking
   - Add Firebase auth token retrieval
   - Secure admin routes

2. **Course Preview**
   - Create preview page (`/admin/courses/[courseId]/preview`)
   - Student view simulation
   - Test course flow

3. **Drag and Drop**
   - Implement actual drag-and-drop for modules/steps
   - Reordering functionality
   - Visual feedback

### Medium-term Enhancements
1. **Rich Content Editor**
   - TipTap integration for instructions
   - Media upload support
   - Code snippet support

2. **Quiz Builder**
   - Dedicated quiz question editor
   - Multiple question types
   - Answer key management

3. **Resource Management**
   - File upload to Firebase Storage
   - Video embedding
   - PDF viewer integration

4. **Bulk Operations**
   - Import/export courses
   - Duplicate modules between courses
   - Batch publish/unpublish

### Long-term Features
1. **Version Control**
   - Course versioning
   - Change history
   - Rollback capability

2. **Collaboration**
   - Multi-instructor support
   - Review/approval workflow
   - Comments and annotations

3. **Analytics Integration**
   - Course performance metrics
   - Student engagement data
   - Completion analytics

## Technical Debt

1. **Type Safety**
   - Remove `any` types in API calls
   - Proper error type definitions
   - Stricter form validation

2. **Error Handling**
   - User-friendly error messages
   - Toast notifications
   - Retry logic for failed saves

3. **Performance**
   - Optimize large course loading
   - Implement pagination for course list
   - Lazy loading for modules/steps

4. **Testing**
   - Unit tests for course builder components
   - Integration tests for API endpoints
   - E2E tests for course creation flow

## Migration Notes

### From LMS to Learning
When ready to rebrand:
1. Update all route paths from `/lms` to `/learning`
2. Rename database collections
3. Update type definitions
4. Update navigation labels
5. Update documentation

### Database Indexes
Recommended indexes for performance:
```javascript
db.lmsCourses.createIndex({ id: 1 }, { unique: true });
db.lmsCourses.createIndex({ isPublished: 1 });
db.lmsCourses.createIndex({ category: 1 });
db.lmsCourses.createIndex({ createdBy: 1 });
db.lmsCourses.createIndex({ "tags": 1 });
```

## Summary

The course builder provides a solid foundation for course creation and management. With the implemented features, administrators can:
- Create structured courses with modules and steps
- Configure AI-powered learning experiences
- Manage course metadata and publishing
- Edit courses with a rich interface

The modular architecture allows for easy extension and enhancement as the platform grows.
