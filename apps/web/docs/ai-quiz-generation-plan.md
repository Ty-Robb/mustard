# AI-Powered Bible Quiz Generation Implementation Plan

## Overview

This document outlines the implementation plan for the AI-powered quiz generation system for the Mustard Bible Study App. This feature will allow users to generate quizzes based on Bible passages, test their knowledge, and track their progress.

## Features to Implement

### 1. Quiz Generation
- Generate multiple-choice questions from Bible passages
- Generate true/false questions
- Generate fill-in-the-blank questions
- Generate matching questions (e.g., match verses to books)
- Support different difficulty levels (Easy, Medium, Hard)
- Support different quiz types (Comprehension, Memory, Application)

### 2. Quiz Types
- **Passage Comprehension**: Questions about specific Bible passages
- **Book Knowledge**: Questions about Bible books, authors, themes
- **Character Studies**: Questions about Biblical characters
- **Timeline & History**: Questions about Biblical events and chronology
- **Theology & Doctrine**: Questions about Biblical teachings
- **Memory Verses**: Fill-in-the-blank for verse memorization

### 3. Scoring & Progress
- Point-based scoring system
- Time-based bonuses
- Streak tracking
- Difficulty multipliers
- Progress tracking per category
- Personal best scores

### 4. Leaderboards
- Daily leaderboards
- Weekly leaderboards
- All-time leaderboards
- Category-specific leaderboards
- Friend leaderboards

### 5. Achievements
- Quiz streak achievements
- Perfect score achievements
- Speed achievements
- Category mastery achievements
- Total questions answered milestones

## Technical Architecture

### Database Schema

```typescript
// Quiz Session
interface QuizSession {
  _id: string;
  userId: string;
  quizType: 'passage' | 'book' | 'character' | 'timeline' | 'theology' | 'memory';
  difficulty: 'easy' | 'medium' | 'hard';
  reference?: string; // Bible reference if applicable
  questions: QuizQuestion[];
  score: number;
  maxScore: number;
  timeStarted: Date;
  timeCompleted?: Date;
  duration?: number; // in seconds
  streak: number;
  createdAt: Date;
}

// Quiz Question
interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'matching';
  question: string;
  options?: string[]; // for multiple choice
  correctAnswer: string | string[];
  explanation?: string;
  reference?: string;
  difficulty: number; // 1-3
  points: number;
  userAnswer?: string | string[];
  isCorrect?: boolean;
  timeSpent?: number; // seconds
}

// User Quiz Stats
interface UserQuizStats {
  _id: string;
  userId: string;
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  currentStreak: number;
  longestStreak: number;
  categoryStats: {
    [category: string]: {
      quizzes: number;
      questions: number;
      correct: number;
      avgScore: number;
    };
  };
  achievements: Achievement[];
  lastQuizDate?: Date;
  updatedAt: Date;
}

// Achievement
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  progress?: number; // for progressive achievements
  maxProgress?: number;
}
```

### API Endpoints

1. **Quiz Generation**
   - `POST /api/quiz/generate` - Generate a new quiz
   - Request body:
     ```json
     {
       "type": "passage",
       "reference": "John 3:1-21",
       "difficulty": "medium",
       "questionCount": 10
     }
     ```

2. **Quiz Submission**
   - `POST /api/quiz/submit` - Submit quiz answers
   - Request body:
     ```json
     {
       "sessionId": "quiz-session-id",
       "answers": [
         { "questionId": "q1", "answer": "option-a" },
         { "questionId": "q2", "answer": "true" }
       ],
       "timeSpent": 120
     }
     ```

3. **Quiz History**
   - `GET /api/quiz/history` - Get user's quiz history
   - `GET /api/quiz/stats` - Get user's quiz statistics

4. **Leaderboards**
   - `GET /api/quiz/leaderboard?type=daily&category=all`
   - `GET /api/quiz/leaderboard/friends`

5. **Achievements**
   - `GET /api/quiz/achievements` - Get user's achievements
   - `GET /api/quiz/achievements/progress` - Get achievement progress

### AI Integration

The quiz generation will use the existing AI services (Gemini/Vertex AI) with specialized prompts:

```typescript
// Quiz generation prompt template
const generateQuizPrompt = (passage: string, type: string, difficulty: string) => {
  return `Generate ${questionCount} ${type} questions about the following Bible passage.
  
  Passage: ${passage}
  Difficulty: ${difficulty}
  
  Requirements:
  1. Questions should test ${getQuizTypeRequirements(type)}
  2. Include a mix of question formats
  3. Provide clear, unambiguous correct answers
  4. Include brief explanations for each answer
  5. Reference specific verses when applicable
  
  Format the response as JSON with this structure:
  {
    "questions": [
      {
        "type": "multiple-choice",
        "question": "...",
        "options": ["a)", "b)", "c)", "d)"],
        "correctAnswer": "a",
        "explanation": "...",
        "reference": "John 3:16"
      }
    ]
  }`;
};
```

### Frontend Components

1. **QuizGenerator** - UI for selecting quiz parameters
2. **QuizQuestion** - Display individual questions
3. **QuizTimer** - Show time remaining/elapsed
4. **QuizResults** - Display results and explanations
5. **QuizLeaderboard** - Show leaderboards
6. **QuizAchievements** - Display achievements
7. **QuizStats** - Show user statistics

### Implementation Phases

#### Phase 1: Core Quiz Generation (Week 1)
- [ ] Create database schemas
- [ ] Implement quiz generation API endpoint
- [ ] Create AI prompt templates for different quiz types
- [ ] Build basic quiz UI components
- [ ] Implement quiz submission and scoring

#### Phase 2: Quiz Types & Difficulty (Week 2)
- [ ] Implement all quiz types
- [ ] Add difficulty scaling
- [ ] Create question validation
- [ ] Add explanations and references
- [ ] Implement quiz history

#### Phase 3: Gamification (Week 3)
- [ ] Implement scoring system with multipliers
- [ ] Add streak tracking
- [ ] Create leaderboard system
- [ ] Build leaderboard UI
- [ ] Add time-based bonuses

#### Phase 4: Achievements & Polish (Week 4)
- [ ] Design and implement achievements
- [ ] Create achievement UI
- [ ] Add progress tracking
- [ ] Implement notifications
- [ ] Performance optimization
- [ ] Testing and bug fixes

## Example Quiz Generation

### Input
```json
{
  "type": "passage",
  "reference": "John 3:1-21",
  "difficulty": "medium",
  "questionCount": 5
}
```

### AI-Generated Output
```json
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Who came to Jesus at night to speak with Him?",
      "options": [
        "a) Peter, a disciple",
        "b) Nicodemus, a Pharisee",
        "c) John the Baptist",
        "d) A Roman centurion"
      ],
      "correctAnswer": "b",
      "explanation": "Nicodemus, a Pharisee and member of the Jewish ruling council, came to Jesus at night (John 3:1-2).",
      "reference": "John 3:1-2",
      "difficulty": 2,
      "points": 10
    },
    {
      "type": "true-false",
      "question": "Jesus told Nicodemus that one must be born of water and the Spirit to enter the kingdom of God.",
      "correctAnswer": "true",
      "explanation": "Jesus said, 'Very truly I tell you, no one can enter the kingdom of God unless they are born of water and the Spirit' (John 3:5).",
      "reference": "John 3:5",
      "difficulty": 2,
      "points": 10
    },
    {
      "type": "fill-blank",
      "question": "For God so loved the _____ that he gave his one and only Son.",
      "correctAnswer": "world",
      "explanation": "This is from John 3:16, one of the most famous verses in the Bible.",
      "reference": "John 3:16",
      "difficulty": 1,
      "points": 10
    }
  ]
}
```

## Success Metrics

1. **Engagement Metrics**
   - Daily active quiz takers
   - Average quizzes per user per week
   - Quiz completion rate
   - Return rate after first quiz

2. **Learning Metrics**
   - Average score improvement over time
   - Knowledge retention (repeat question performance)
   - Category mastery progression

3. **Gamification Metrics**
   - Achievement unlock rate
   - Leaderboard participation
   - Streak maintenance
   - Social sharing rate

## Security Considerations

1. **Anti-Cheating Measures**
   - Server-side answer validation
   - Time limits per question
   - Random question ordering
   - Answer option shuffling

2. **Rate Limiting**
   - Limit quiz generation requests
   - Prevent score manipulation
   - Protect leaderboard integrity

## Future Enhancements

1. **Multiplayer Quizzes** - Real-time quiz competitions
2. **Custom Quiz Creation** - User-generated quizzes
3. **Study Mode** - Practice without scoring
4. **Quiz Sharing** - Share quizzes with friends/groups
5. **Themed Challenges** - Seasonal or topical quiz events
6. **Voice Input** - Answer questions by voice
7. **AR/VR Integration** - Immersive quiz experiences

## Conclusion

The AI-powered quiz generation system will provide an engaging way for users to test and improve their Bible knowledge. By leveraging AI for dynamic question generation and implementing comprehensive gamification features, we can create a compelling learning experience that keeps users coming back.
