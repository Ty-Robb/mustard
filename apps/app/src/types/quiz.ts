// Quiz-related type definitions

export type QuizType = 'passage' | 'book' | 'character' | 'timeline' | 'theology' | 'memory';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-blank' | 'matching';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
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

export interface QuizSession {
  _id?: string;
  userId: string;
  quizType: QuizType;
  difficulty: QuizDifficulty;
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

export interface UserQuizStats {
  _id?: string;
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

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  progress?: number; // for progressive achievements
  maxProgress?: number;
}

export interface QuizGenerationRequest {
  type: QuizType;
  reference?: string;
  difficulty: QuizDifficulty;
  questionCount: number;
}

export interface QuizSubmissionRequest {
  sessionId: string;
  answers: {
    questionId: string;
    answer: string | string[];
  }[];
  timeSpent: number;
}

export interface QuizLeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  quizCount: number;
  rank: number;
  streak?: number;
}

export interface QuizGenerationResponse {
  sessionId: string;
  questions: QuizQuestion[];
}

export interface QuizSubmissionResponse {
  score: number;
  maxScore: number;
  correctAnswers: number;
  totalQuestions: number;
  newAchievements?: Achievement[];
  streakUpdate?: {
    current: number;
    isNew: boolean;
  };
  leaderboardRank?: number;
}
