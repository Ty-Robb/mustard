# LMS Chat Integration Guide

## Overview

The LMS (Learning Management System) has been successfully integrated into the chat page, providing a seamless learning experience with AI-guided courses, progress tracking, and interactive quizzes.

## Features

### 1. Mode Toggle
- **Chat Mode**: Traditional AI chat interface with essay and presentation capabilities
- **Learning Mode**: Structured learning experience with courses, modules, and steps

### 2. LMS Components

#### Course Browser
- Browse available courses with filtering options
- View course details including difficulty, duration, and prerequisites
- Enroll in courses with one click

#### Step Navigator
- Visual progress tracking
- Sequential step progression
- Module overview with completion status
- Time estimates for each step

#### Quiz System
- Multiple question types (multiple choice, true/false, short answer, essay)
- Automatic grading for objective questions
- Retry functionality
- Progress tracking

#### AI Agent Integration
- Each step can specify which AI agent to use
- Automatic agent switching based on step requirements
- Context-aware conversations that continue from step completion

### 3. Progress Tracking
- User progress saved to MongoDB
- Time spent tracking
- Completion certificates
- Resume from where you left off

## Architecture

### Frontend Components

1. **LMSModeContainer** (`src/components/lms/LMSModeContainer.tsx`)
   - Main container for LMS mode
   - Manages course selection and learning flow
   - Integrates with chat for AI interactions

2. **CourseSelectorClient** (`src/components/lms/CourseSelectorClient.tsx`)
   - Client-safe course browsing component
   - Uses API calls instead of direct database access

3. **StepNavigator** (`src/components/lms/StepNavigator.tsx`)
   - Visual step progression
   - Module overview
   - Navigation controls

4. **QuizComponent** (`src/components/lms/QuizComponent.tsx`)
   - Quiz rendering and interaction
   - Answer submission
   - Score display

### Hooks

1. **useLMSBrowser** (`src/hooks/useLMSBrowser.ts`)
   - Course browsing and enrollment
   - Progress loading
   - Quiz submission

2. **useLMSClient** (`src/hooks/useLMSClient.ts`)
   - Single course management
   - Step navigation
   - Time tracking

### API Endpoints

1. **GET/POST /api/lms/courses**
   - List courses with filtering
   - Enroll in courses

2. **GET/PUT /api/lms/progress/[courseId]**
   - Get user progress
   - Update step completion

3. **POST /api/lms/quiz/submit**
   - Submit quiz answers
   - Get grading results

## Usage

### For Users

1. **Switching to Learning Mode**
   - Click the "Learning Mode" button in the chat header
   - Browse available courses
   - Select a course to begin

2. **Progressing Through a Course**
   - Read step content and resources
   - Complete activities
   - Take quizzes when required
   - Chat with AI for help

3. **Tracking Progress**
   - View progress bar at course and module level
   - See completed steps with checkmarks
   - Resume anytime from where you left off

### For Developers

1. **Adding New Courses**
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
         title: 'Module 1',
         steps: [
           {
             id: 'step-1',
             title: 'Introduction',
             type: 'lesson',
             agentId: 'teaching',
             content: {
               instructions: 'Step instructions',
               resources: []
             }
           }
         ]
       }
     ]
   };
   ```

2. **Customizing AI Agents**
   - Each step can specify an `agentId`
   - The system automatically switches agents
   - Agents maintain context from previous steps

3. **Creating Quizzes**
   ```typescript
   const quiz: QuizData = {
     questions: [
       {
         id: 'q1',
         type: 'multiple-choice',
         question: 'What is...?',
         options: ['A', 'B', 'C', 'D'],
         correctAnswer: 'A',
         points: 10
       }
     ],
     passingScore: 70,
     allowRetries: true
   };
   ```

## Props-Based Configuration

The LMS mode can be configured through props:

```typescript
<LMSModeContainer
  onSendMessage={handleSendMessage}  // Function to send messages to AI
  isLoading={isLoading}              // Loading state
  streamingMessage={streamingMessage} // Current streaming AI response
  className="custom-class"           // Custom styling
  onExitLMS={() => setIsLMSMode(false)} // Exit handler
/>
```

## Testing

1. **Manual Testing**
   - Navigate to `/chat`
   - Toggle to Learning Mode
   - Browse and enroll in courses
   - Complete steps and quizzes

2. **API Testing**
   ```bash
   npm run tsx src/scripts/test-lms-api.ts
   ```

3. **Sample Courses**
   - Biblical Hebrew Basics
   - New Testament Greek
   - Introduction to Hermeneutics

## Future Enhancements

1. **AI-Generated Content**
   - Dynamic course creation
   - Personalized learning paths
   - Adaptive difficulty

2. **Social Features**
   - Discussion forums
   - Peer learning
   - Instructor feedback

3. **Advanced Analytics**
   - Learning patterns
   - Performance metrics
   - Recommendation engine

4. **Mobile Optimization**
   - Responsive design improvements
   - Offline capability
   - Mobile app integration

## Troubleshooting

### Common Issues

1. **Courses not loading**
   - Check authentication
   - Verify API endpoints
   - Check network connectivity

2. **Progress not saving**
   - Ensure user is authenticated
   - Check MongoDB connection
   - Verify API permissions

3. **Agent switching issues**
   - Confirm agent IDs are valid
   - Check agent availability
   - Review step configuration

### Debug Mode

Enable debug logging:
```typescript
// In useLMSBrowser.ts
console.log('[LMS] Debug info:', { courses, progress, error });
```

## Conclusion

The LMS integration provides a powerful learning platform within the chat interface. It combines structured content delivery with AI-powered assistance, creating an engaging and effective learning experience.
