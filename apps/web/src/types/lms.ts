// LMS (Learning Management System) type definitions

export interface LMSCourse {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  prerequisites?: string[]; // Course IDs
  tags: string[];
  modules: LMSModule[];
  createdBy: string;
  enrollmentCount?: number;
  enrolledCount?: number; // Alias for enrollmentCount
  category?: 'biblical-studies' | 'theology' | 'ministry' | 'leadership' | 'general';
  isPublished?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  rating?: number;
  ratingCount?: number;
  duration?: string; // e.g., "4 weeks", "2 months"
  // Pricing fields
  price?: number;
  currency?: string;
  isPaid?: boolean;
  stripePriceId?: string;
  stripeProductId?: string;
}

export interface LMSModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  steps: LMSStep[];
  requiredForCompletion: number; // % of steps needed (0-100)
  estimatedMinutes: number;
  duration?: string; // e.g., "30 min", "1 hour"
}

export interface LMSStep {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  description: string;
  type: 'lesson' | 'quiz' | 'assignment' | 'discussion' | 'resource' | 'presentation';
  agentId: string; // Which AI agent handles this
  content: StepContent;
  requirements?: StepRequirements;
  estimatedMinutes: number;
  duration?: string; // e.g., "5 min", "15 min"
  isLocked?: boolean; // Whether the step is locked until prerequisites are met
}

export interface StepContent {
  instructions?: string;
  initialPrompt?: string; // What the AI agent should start with
  resources?: Resource[];
  expectedOutcome?: string;
  rubric?: AssessmentRubric;
  quizData?: QuizData;
  presentationData?: PresentationData;
}

export interface Resource {
  id: string;
  type: 'link' | 'document' | 'video' | 'scripture';
  title: string;
  url?: string;
  content?: string;
  metadata?: Record<string, any>;
}

export interface StepRequirements {
  minInteractions?: number;
  minTimeSpent?: number; // in seconds
  mustSubmit?: boolean;
  passingScore?: number; // for quizzes
  customCriteria?: string[];
}

export interface AssessmentRubric {
  criteria: RubricCriterion[];
  totalPoints: number;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  points: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  score: number;
  description: string;
}

export interface QuizData {
  questions: QuizQuestion[];
  passingScore: number;
  allowRetries: boolean;
  maxRetries?: number;
  showExplanations: boolean;
  randomizeQuestions?: boolean;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  explanation?: string;
  hint?: string;
}

export interface PresentationData {
  autoGenerate: boolean;
  topic?: string;
  slideCount?: number;
  template?: string;
}

// User Progress Tracking
export interface UserProgress {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  completedAt?: Date;
  currentModuleId: string;
  currentStepId: string;
  completedSteps: CompletedStep[];
  overallProgress: number; // 0-100
  lastAccessedAt: Date;
  totalTimeSpent: number; // in seconds
  certificateId?: string;
}

export interface CompletedStep {
  stepId: string;
  completedAt: Date;
  timeSpent: number; // in seconds
  score?: number;
  attempts: number;
  submission?: StepSubmission;
}

export interface StepSubmission {
  id: string;
  type: 'quiz' | 'assignment' | 'discussion';
  content: any; // Quiz answers, essay content, etc.
  feedback?: string;
  grade?: number;
  gradedAt?: Date;
  gradedBy?: string; // 'ai' or userId
}

export interface QuizAttempt {
  id: string;
  stepId: string;
  userId: string;
  questions: QuizQuestion[];
  answers: Record<string, any>;
  score: number;
  passed: boolean;
  feedback?: string;
  attemptedAt: Date;
  timeSpent: number;
}

// LMS Chat Integration
export interface LMSChatProps {
  mode: 'standard' | 'lms';
  courseId?: string;
  moduleId?: string;
  stepId?: string;
  onStepComplete?: (stepId: string, submission?: StepSubmission) => void;
  onProgressUpdate?: (progress: UserProgress) => void;
  showProgress?: boolean;
  allowNavigation?: boolean;
}

export interface LMSChatSession {
  sessionId: string;
  courseId: string;
  moduleId: string;
  stepId: string;
  startedAt: Date;
  interactions: number;
  submissions: StepSubmission[];
}

// Course Filters
export interface CourseFilters {
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  tags?: string[];
  duration?: {
    min?: number;
    max?: number;
  };
  searchQuery?: string;
}

// Certificate
export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  userName: string;
  issuedAt: Date;
  certificateNumber: string;
  grade?: string;
  instructor?: string;
}
