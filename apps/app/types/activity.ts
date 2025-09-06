export interface Activity {
  _id?: string;
  userId: string;
  type: ActivityType;
  timestamp: Date;
  metadata: ActivityMetadata;
  courseId?: string;
  chapterId?: string;
  quizId?: string;
}

export enum ActivityType {
  CHAPTER_READ = 'chapter_read',
  QUIZ_TAKEN = 'quiz_taken',
  QUIZ_PASSED = 'quiz_passed',
  COURSE_STARTED = 'course_started',
  COURSE_COMPLETED = 'course_completed',
  HIGHLIGHT_CREATED = 'highlight_created',
  NOTE_CREATED = 'note_created',
  CHAT_MESSAGE = 'chat_message',
  PRESENTATION_CREATED = 'presentation_created',
  DOCUMENT_CREATED = 'document_created',
  BIBLE_READING = 'bible_reading',
  READING_PLAN_PROGRESS = 'reading_plan_progress',
  PAYMENT_MADE = 'payment_made',
  COURSE_PURCHASED = 'course_purchased',
}

export interface ActivityMetadata {
  title?: string;
  description?: string;
  score?: number;
  duration?: number; // in seconds
  verses?: string[]; // for bible reading
  planId?: string; // for reading plans
  amount?: number; // for payments
  [key: string]: any;
}

export interface ActivityDay {
  date: string; // YYYY-MM-DD format
  count: number;
  activities: Activity[];
}

export interface ActivityStats {
  totalActivities: number;
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
  mostActiveDay: string;
  activityBreakdown: Record<ActivityType, number>;
}

export interface ContributionData {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // GitHub-style intensity levels
}

export interface ActivityFilters {
  userId?: string;
  types?: ActivityType[];
  startDate?: Date;
  endDate?: Date;
  courseId?: string;
}
