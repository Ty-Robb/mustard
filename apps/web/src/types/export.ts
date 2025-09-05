export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  PDF = 'pdf',
  EXCEL = 'excel',
}

export enum ExportType {
  // Activity exports
  ACTIVITY_HISTORY = 'activity_history',
  ACTIVITY_STATS = 'activity_stats',
  CONTRIBUTION_GRAPH = 'contribution_graph',
  
  // Learning exports
  COURSE_PROGRESS = 'course_progress',
  QUIZ_RESULTS = 'quiz_results',
  STUDY_NOTES = 'study_notes',
  
  // Bible exports
  BIBLE_HIGHLIGHTS = 'bible_highlights',
  BIBLE_NOTES = 'bible_notes',
  READING_HISTORY = 'reading_history',
  
  // Financial exports
  PAYMENT_HISTORY = 'payment_history',
  INVOICES = 'invoices',
  
  // Comprehensive exports
  ALL_DATA = 'all_data',
}

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ExportOptions {
  includeMetadata?: boolean;
  dateFormat?: string;
  timezone?: string;
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExportFilters {
  startDate?: Date;
  endDate?: Date;
  courseIds?: string[];
  activityTypes?: string[];
  [key: string]: any;
}

export interface ExportRequest {
  type: ExportType;
  format: ExportFormat;
  filters?: ExportFilters;
  options?: ExportOptions;
  userId: string;
}

export interface ExportJob {
  id: string;
  userId: string;
  type: ExportType;
  format: ExportFormat;
  status: ExportStatus;
  progress: number;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  metadata?: {
    recordCount?: number;
    fileSize?: number;
    fileName?: string;
  };
}

export interface ExportTemplate {
  id: string;
  name: string;
  description?: string;
  type: ExportType;
  format: ExportFormat;
  filters?: ExportFilters;
  options?: ExportOptions;
  userId: string;
  isPublic?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
