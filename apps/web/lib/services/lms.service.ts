import { 
  LMSCourse, 
  LMSModule, 
  LMSStep, 
  UserProgress, 
  CompletedStep,
  StepSubmission,
  QuizAttempt,
  Certificate,
  CourseFilters
} from '@repo/types';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export class LMSService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Get all available courses
   */
  async getCourses(filters?: CourseFilters): Promise<LMSCourse[]> {
    const db = await getDatabase();
    const collection = db.collection<LMSCourse>('lmsCourses');

    let query: any = {};

    if (filters) {
      if (filters.difficulty) {
        query.difficulty = filters.difficulty;
      }
      if (filters.category) {
        query.category = filters.category;
      }
      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }
      if (filters.searchQuery) {
        query.$or = [
          { title: { $regex: filters.searchQuery, $options: 'i' } },
          { description: { $regex: filters.searchQuery, $options: 'i' } },
        ];
      }
    }

    const courses = await collection.find(query).toArray();
    return courses.map(course => {
      const { _id, ...courseWithoutId } = course as any;
      return courseWithoutId;
    });
  }

  /**
   * Get a specific course by ID
   */
  async getCourse(courseId: string): Promise<LMSCourse | null> {
    const db = await getDatabase();
    const collection = db.collection<LMSCourse>('lmsCourses');

    // First try to find by regular id field
    let course = await collection.findOne({ id: courseId });
    
    // If not found and courseId looks like an ObjectId, try searching by _id
    if (!course && /^[0-9a-fA-F]{24}$/.test(courseId)) {
      try {
        course = await collection.findOne({ _id: new ObjectId(courseId) });
      } catch (error) {
        // Invalid ObjectId format, ignore
      }
    }
    
    if (!course) return null;

    // Remove MongoDB _id to prevent confusion
    const { _id, ...courseWithoutId } = course as any;
    return courseWithoutId;
  }

  /**
   * Enroll user in a course
   */
  async enrollInCourse(courseId: string): Promise<UserProgress> {
    const db = await getDatabase();
    const progressCollection = db.collection<UserProgress>('lmsProgress');
    const courseCollection = db.collection<LMSCourse>('lmsCourses');

    // Check if already enrolled
    const existingProgress = await progressCollection.findOne({
      userId: this.userId,
      courseId,
    });

    if (existingProgress) {
      return {
        ...existingProgress,
        id: existingProgress._id?.toString() || existingProgress.id,
      };
    }

    // Get course to initialize progress
    const course = await this.getCourse(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const firstModule = course.modules[0];
    const firstStep = firstModule?.steps[0];

    const progress: UserProgress = {
      id: new ObjectId().toString(),
      userId: this.userId,
      courseId,
      enrolledAt: new Date(),
      currentModuleId: firstModule?.id || '',
      currentStepId: firstStep?.id || '',
      completedSteps: [],
      overallProgress: 0,
      lastAccessedAt: new Date(),
      totalTimeSpent: 0,
    };

    await progressCollection.insertOne({ ...progress, _id: new ObjectId(progress.id) } as any);

    // Update enrollment count - use the course's actual ID
    await courseCollection.updateOne(
      { id: course.id },
      { $inc: { enrollmentCount: 1 } }
    );

    return progress;
  }

  /**
   * Get user's progress for a course
   */
  async getUserProgress(courseId: string): Promise<UserProgress | null> {
    const db = await getDatabase();
    const collection = db.collection<UserProgress>('lmsProgress');

    const progress = await collection.findOne({
      userId: this.userId,
      courseId,
    });

    if (!progress) return null;

    return {
      ...progress,
      id: progress._id?.toString() || progress.id,
    };
  }

  /**
   * Get all user's course enrollments
   */
  async getUserEnrollments(): Promise<UserProgress[]> {
    const db = await getDatabase();
    const collection = db.collection<UserProgress>('lmsProgress');

    const enrollments = await collection
      .find({ userId: this.userId })
      .sort({ lastAccessedAt: -1 })
      .toArray();

    return enrollments.map(enrollment => ({
      ...enrollment,
      id: enrollment._id?.toString() || enrollment.id,
    }));
  }

  /**
   * Update progress when a step is completed
   */
  async completeStep(
    courseId: string,
    stepId: string,
    submission?: StepSubmission,
    timeSpent: number = 0
  ): Promise<UserProgress> {
    const db = await getDatabase();
    const collection = db.collection<UserProgress>('lmsProgress');

    const progress = await this.getUserProgress(courseId);
    if (!progress) {
      throw new Error('User not enrolled in this course');
    }

    const course = await this.getCourse(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Check if step already completed
    const existingCompletion = progress.completedSteps.find(cs => cs.stepId === stepId);
    if (existingCompletion) {
      // Update existing completion
      existingCompletion.attempts += 1;
      existingCompletion.timeSpent += timeSpent;
      if (submission) {
        existingCompletion.submission = submission;
      }
    } else {
      // Add new completion
      const completedStep: CompletedStep = {
        stepId,
        completedAt: new Date(),
        timeSpent,
        attempts: 1,
        submission,
      };
      progress.completedSteps.push(completedStep);
    }

    // Calculate overall progress
    const totalSteps = course.modules.reduce((sum, module) => sum + module.steps.length, 0);
    progress.overallProgress = Math.round((progress.completedSteps.length / totalSteps) * 100);

    // Update current step to next one
    const nextStep = this.getNextStep(course, stepId);
    if (nextStep) {
      progress.currentStepId = nextStep.id;
      progress.currentModuleId = nextStep.moduleId;
    } else {
      // Course completed
      progress.completedAt = new Date();
    }

    progress.lastAccessedAt = new Date();
    progress.totalTimeSpent += timeSpent;

    await collection.updateOne(
      { _id: new ObjectId(progress.id) },
      { $set: progress }
    );

    return progress;
  }

  /**
   * Get the next step in the course
   */
  private getNextStep(course: LMSCourse, currentStepId: string): LMSStep | null {
    let foundCurrent = false;

    for (const module of course.modules) {
      for (const step of module.steps) {
        if (foundCurrent) {
          return step;
        }
        if (step.id === currentStepId) {
          foundCurrent = true;
        }
      }
    }

    return null;
  }

  /**
   * Submit a quiz attempt
   */
  async submitQuizAttempt(
    stepId: string,
    attempt: Omit<QuizAttempt, 'id'>
  ): Promise<QuizAttempt> {
    const db = await getDatabase();
    const collection = db.collection<QuizAttempt>('lmsQuizAttempts');

    const quizAttempt: QuizAttempt = {
      ...attempt,
      id: new ObjectId().toString(),
    };

    await collection.insertOne({ ...quizAttempt, _id: new ObjectId(quizAttempt.id) } as any);

    return quizAttempt;
  }

  /**
   * Get quiz attempts for a step
   */
  async getQuizAttempts(stepId: string): Promise<QuizAttempt[]> {
    const db = await getDatabase();
    const collection = db.collection<QuizAttempt>('lmsQuizAttempts');

    const attempts = await collection
      .find({ stepId, userId: this.userId })
      .sort({ attemptedAt: -1 })
      .toArray();

    return attempts.map(attempt => ({
      ...attempt,
      id: attempt._id?.toString() || attempt.id,
    }));
  }

  /**
   * Generate a certificate for course completion
   */
  async generateCertificate(courseId: string): Promise<Certificate> {
    const db = await getDatabase();
    const collection = db.collection<Certificate>('lmsCertificates');

    const progress = await this.getUserProgress(courseId);
    if (!progress || !progress.completedAt) {
      throw new Error('Course not completed');
    }

    const course = await this.getCourse(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Check if certificate already exists
    const existing = await collection.findOne({
      userId: this.userId,
      courseId,
    });

    if (existing) {
      return {
        ...existing,
        id: existing._id?.toString() || existing.id,
      };
    }

    const certificate: Certificate = {
      id: new ObjectId().toString(),
      userId: this.userId,
      courseId,
      courseName: course.title,
      userName: 'User', // This should come from user profile
      issuedAt: new Date(),
      certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      grade: this.calculateGrade(progress),
    };

    await collection.insertOne({ ...certificate, _id: new ObjectId(certificate.id) } as any);

    // Update progress with certificate ID
    const progressCollection = db.collection<UserProgress>('lmsProgress');
    await progressCollection.updateOne(
      { _id: new ObjectId(progress.id) },
      { $set: { certificateId: certificate.id } }
    );

    return certificate;
  }

  /**
   * Calculate grade based on progress
   */
  private calculateGrade(progress: UserProgress): string {
    // This is a simple implementation - you can make it more sophisticated
    const avgScore = progress.completedSteps
      .filter(step => step.score !== undefined)
      .reduce((sum, step) => sum + (step.score || 0), 0) / 
      progress.completedSteps.filter(step => step.score !== undefined).length;

    if (avgScore >= 90) return 'A';
    if (avgScore >= 80) return 'B';
    if (avgScore >= 70) return 'C';
    if (avgScore >= 60) return 'D';
    return 'F';
  }

  /**
   * Get recommended courses based on user's progress
   */
  async getRecommendedCourses(): Promise<LMSCourse[]> {
    const enrollments = await this.getUserEnrollments();
    const completedCourseIds = enrollments
      .filter(e => e.completedAt)
      .map(e => e.courseId);

    const allCourses = await this.getCourses();
    
    // Filter out enrolled courses and check prerequisites
    const recommendedCourses = allCourses.filter(course => {
      // Not already enrolled
      if (enrollments.some(e => e.courseId === course.id)) {
        return false;
      }

      // Prerequisites met
      if (course.prerequisites && course.prerequisites.length > 0) {
        return course.prerequisites.every(prereq => completedCourseIds.includes(prereq));
      }

      return true;
    });

    // Sort by relevance (you can implement more sophisticated logic)
    return recommendedCourses.slice(0, 5);
  }
}

// Helper function to create an LMSService instance
export function getLMSService(userId: string): LMSService {
  return new LMSService(userId);
}
