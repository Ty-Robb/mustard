// User types
export interface User {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  vectorNamespace: string;
  subscription: {
    tier: 'free' | 'premium';
    stripeCustomerId?: string;
    stripePriceId?: string;
    currentPeriodEnd?: Date;
  };
  preferences: {
    defaultTranslation: string;
    dailyGoal: number;
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Reading Plan types
export interface ReadingPlan {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  duration: number; // Total days for the plan
  isPublic: boolean;
  entries: ReadingPlanEntry[];
  tags?: string[]; // For categorizing plans
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadingPlanEntry {
  day: number; // Day number in the plan
  passages: string[]; // Array of passage references (e.g., ["Genesis 1-3", "Matthew 1"])
  completed: boolean;
  completedAt?: Date;
  notes?: string;
  // Legacy fields for backward compatibility
  reference?: string;
  parsedReference?: {
    bookId: string;
    chapterId: number;
    verseIds: number[];
  };
  aiSummary?: string;
}

// Bible Content types
export interface BibleContent {
  _id: string;
  translationId: string;
  bookId: string;
  chapterId: number;
  verseId: number;
  text: string;
  metadata: {
    bookName: string;
    copyright: string;
    fetchedAt: Date;
  };
}

// Quiz types
export interface QuizResult {
  _id: string;
  userId: string;
  planId: string;
  reference: string;
  questions: QuizQuestion[];
  score: number;
  totalTime: number;
  completedAt: Date;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  userAnswer: number;
  timeSpent: number;
  explanation?: string;
}

// Group types
export interface Group {
  _id: string;
  name: string;
  description?: string;
  creatorId: string;
  memberIds: string[];
  planIds: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Bible API types
export interface BibleTranslation {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
}

export interface BibleBook {
  id: string;
  name: string;
  abbreviation: string;
  chapters: number;
}

export interface BibleReference {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
}
