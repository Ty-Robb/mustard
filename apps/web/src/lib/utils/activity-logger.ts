import { ActivityType } from '@/types/activity';

interface LogActivityParams {
  type: ActivityType;
  metadata?: Record<string, any>;
  courseId?: string;
  chapterId?: string;
  quizId?: string;
}

export async function logActivity(params: LogActivityParams, token: string): Promise<void> {
  try {
    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error('Failed to log activity:', await response.text());
    }
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - we don't want activity logging failures to break the app
  }
}

// Convenience functions for common activities
export const activityLogger = {
  chapterRead: (token: string, courseId: string, chapterId: string, metadata?: Record<string, any>) =>
    logActivity({
      type: ActivityType.CHAPTER_READ,
      courseId,
      chapterId,
      metadata,
    }, token),

  quizTaken: (token: string, courseId: string, quizId: string, score: number) =>
    logActivity({
      type: ActivityType.QUIZ_TAKEN,
      courseId,
      quizId,
      metadata: { score },
    }, token),

  quizPassed: (token: string, courseId: string, quizId: string, score: number) =>
    logActivity({
      type: ActivityType.QUIZ_PASSED,
      courseId,
      quizId,
      metadata: { score },
    }, token),

  courseStarted: (token: string, courseId: string, courseTitle: string) =>
    logActivity({
      type: ActivityType.COURSE_STARTED,
      courseId,
      metadata: { title: courseTitle },
    }, token),

  courseCompleted: (token: string, courseId: string, courseTitle: string) =>
    logActivity({
      type: ActivityType.COURSE_COMPLETED,
      courseId,
      metadata: { title: courseTitle },
    }, token),

  highlightCreated: (token: string, verseId: string, bookName: string, color: string) =>
    logActivity({
      type: ActivityType.HIGHLIGHT_CREATED,
      metadata: { verseId, bookName, color },
    }, token),

  noteCreated: (token: string, verseId: string, bookName: string, noteContent: string) =>
    logActivity({
      type: ActivityType.NOTE_CREATED,
      metadata: { verseId, bookName, notePreview: noteContent.substring(0, 100) },
    }, token),

  chatMessage: (token: string, messageLength: number) =>
    logActivity({
      type: ActivityType.CHAT_MESSAGE,
      metadata: { messageLength },
    }, token),

  presentationCreated: (token: string, title: string, slideCount: number) =>
    logActivity({
      type: ActivityType.PRESENTATION_CREATED,
      metadata: { title, slideCount },
    }, token),

  documentCreated: (token: string, title: string, wordCount: number) =>
    logActivity({
      type: ActivityType.DOCUMENT_CREATED,
      metadata: { title, wordCount },
    }, token),

  bibleReading: (token: string, bookName: string, chapter: number, versesRead: number) =>
    logActivity({
      type: ActivityType.BIBLE_READING,
      metadata: { bookName, chapter, versesRead },
    }, token),

  readingPlanProgress: (token: string, planId: string, planName: string, progress: number) =>
    logActivity({
      type: ActivityType.READING_PLAN_PROGRESS,
      metadata: { planId, planName, progress },
    }, token),

  paymentMade: (token: string, amount: number, description: string) =>
    logActivity({
      type: ActivityType.PAYMENT_MADE,
      metadata: { amount, description },
    }, token),

  coursePurchased: (token: string, courseId: string, courseTitle: string, amount: number) =>
    logActivity({
      type: ActivityType.COURSE_PURCHASED,
      courseId,
      metadata: { title: courseTitle, amount },
    }, token),
};
