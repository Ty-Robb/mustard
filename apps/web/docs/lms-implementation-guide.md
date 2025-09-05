# LMS (Learning Management System) Implementation Guide

## Overview

This document describes the implementation of a Learning Management System (LMS) integrated into the chat interface. The system allows users to take structured courses with AI-powered agents guiding them through each step.

## Architecture

### Core Components

1. **Type Definitions** (`src/types/lms.ts`)
   - `LMSCourse`: Course structure with modules and metadata
   - `LMSModule`: Module containing multiple learning steps
   - `LMSStep`: Individual learning unit (lesson, quiz, assignment, etc.)
   - `UserProgress`: Tracks user's progress through courses
   - `QuizData` & `QuizQuestion`: Quiz structure and questions
   - `StepSubmission`: Submissions for assignments and quizzes

2. **Services** (`src/lib/services/lms.service.ts`)
   - Course management (CRUD operations)
   - Progress tracking
   - Quiz submission and grading
   - Certificate generation
   - Recommendation engine

3. **UI Components**
   - `CourseSelector`: Browse and select courses
   - `StepNavigator`: Navigate through course steps
   - `QuizComponent`: Interactive quiz interface
   - `LMSChatContainer`: Modified chat for LMS mode

4. **Hooks** (`src/hooks/useLMS.ts`)
   - Manages LMS state
   - Handles agent switching based on steps
   - Tracks time spent on steps
   - Manages course enrollment and progress

## Features

### 1. Course Structure
- **Multi-module courses** with sequential steps
- **Prerequisites** system for advanced courses
- **Difficulty levels**: Beginner, Intermediate, Advanced
- **Categories**: Biblical Studies, Theology, Ministry, Leadership
- **Time estimates** for courses, modules, and steps

### 2. Step Types
- **Lesson**: AI-guided learning with specific agents
- **Quiz**: Multiple choice, true/false, short answer, essay
- **Assignment**: Practical exercises with AI feedback
- **Discussion**: Interactive dialogue with AI
- **Presentation**: Auto-generated slide presentations
- **Resource**: Additional learning materials

### 3. Progress Tracking
- **Real-time progress** updates
- **Time tracking** per step and overall
- **Completion requirements**: 
  - Minimum interactions
  - Minimum time spent
  - Quiz passing scores
  - Assignment submissions

### 4. Agent Integration
Each step can specify which AI agent to use:
- `general-assistant`: General guidance
- `biblical-scholar`: Biblical interpretation
- `theology-assistant`: Theological concepts
- `essay-writer`: Writing assignments
- `creative-writer`: Youth ministry content
- `devotional-guide`: Spiritual guidance

### 5. Assessment System
- **Automated quiz grading** for objective questions
- **AI-powered grading** for essays and short answers
- **Rubric-based assessment** for assignments
- **Retry system** with configurable attempts
- **Detailed feedback** and explanations

## Usage

### For Users

1. **Browse Courses**
   ```typescript
   // Access the course selector
   <CourseSelector onSelectCourse={handleCourseSelect} />
   ```

2. **Start Learning**
   - Click on a course to enroll
   - Follow the step-by-step progression
   - Interact with AI agents for each lesson
   - Complete quizzes and assignments
   - Track your progress

3. **Complete Assessments**
   - Take quizzes with immediate feedback
   - Submit assignments for AI evaluation
   - Review explanations for incorrect answers
   - Retry if allowed

### For Developers

1. **Add New Courses**
   ```typescript
   const newCourse: LMSCourse = {
     id: 'course-id',
     title: 'Course Title',
     description: 'Course description',
     difficulty: 'beginner',
     estimatedHours: 10,
     modules: [
       {
         id: 'module-1',
         title: 'Module Title',
         steps: [
           {
             id: 'step-1',
             type: 'lesson',
             agentId: 'general-assistant',
             content: {
               initialPrompt: 'Starting prompt for AI',
               instructions: 'Step instructions'
             }
           }
         ]
       }
     ]
   };
   ```

2. **Integrate with Chat Page**
   ```typescript
   const { 
     course, 
     currentStep, 
     userProgress,
     navigateToStep,
     completeCurrentStep 
   } = useLMS(courseId);
   ```

3. **Custom Step Requirements**
   ```typescript
   requirements: {
     minInteractions: 5,
     minTimeSpent: 300, // seconds
     passingScore: 80,
     mustSubmit: true,
     customCriteria: ['specific-requirement']
   }
   ```

## API Endpoints

### Courses
- `GET /api/lms/courses` - List all courses
- `GET /api/lms/courses?type=enrollments` - User's enrolled courses
- `GET /api/lms/courses?type=recommended` - Recommended courses
- `POST /api/lms/courses` - Enroll in a course

### Progress
- `GET /api/lms/progress/:courseId` - Get progress for a course
- `PUT /api/lms/progress/:courseId/step/:stepId` - Update step progress

### Assessments
- `POST /api/lms/quiz/submit` - Submit quiz answers
- `GET /api/lms/certificates/:courseId` - Get course certificate

## Database Schema

### Collections

1. **lmsCourses**
   - Stores course definitions
   - Includes modules and steps
   - Tracks enrollment count

2. **lmsProgress**
   - User enrollment records
   - Current position in course
   - Completed steps
   - Time tracking

3. **lmsQuizAttempts**
   - Quiz submission history
   - Scores and feedback
   - Time spent

4. **lmsCertificates**
   - Completion certificates
   - Issue date and grade

## Sample Course: Biblical Hermeneutics 101

The implementation includes a complete sample course demonstrating:

1. **Module 1: Introduction**
   - Welcome lesson with general assistant
   - Historical context with biblical scholar
   - Quiz on basic concepts

2. **Module 2: Principles**
   - Literary context lesson
   - Auto-generated presentation on genres
   - Practice assignment with rubric

## Future Enhancements

1. **Social Features**
   - Discussion forums
   - Peer reviews
   - Study groups

2. **Advanced Analytics**
   - Learning patterns
   - Performance metrics
   - Engagement tracking

3. **Content Management**
   - Course builder UI
   - Import/export courses
   - Version control

4. **Gamification**
   - Badges and achievements
   - Leaderboards
   - Streaks and milestones

5. **Mobile App**
   - Offline learning
   - Push notifications
   - Mobile-optimized UI

## Integration with Chat

The LMS seamlessly integrates with the existing chat system:

1. **Mode Toggle**: Switch between standard chat and LMS mode
2. **Agent Switching**: Automatic agent selection based on step
3. **Context Preservation**: Chat history maintained per step
4. **Progress Tracking**: Real-time updates in chat metadata
5. **Auto-opening Editors**: Essays and presentations open automatically

## Best Practices

1. **Course Design**
   - Keep modules focused on single topics
   - Mix different step types for engagement
   - Provide clear learning objectives
   - Include practical applications

2. **Assessment Design**
   - Use varied question types
   - Provide helpful explanations
   - Allow retries for learning
   - Focus on understanding over memorization

3. **Agent Selection**
   - Match agent expertise to content
   - Use specialized agents for depth
   - Provide clear initial prompts
   - Guide the conversation flow

4. **Progress Requirements**
   - Set realistic time expectations
   - Balance interaction requirements
   - Make passing scores achievable
   - Provide clear success criteria
