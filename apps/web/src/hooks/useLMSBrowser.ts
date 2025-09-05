import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { 
  LMSCourse, 
  UserProgress,
  QuizAttempt,
  CourseFilters
} from '@/types/lms';

interface UseLMSBrowserReturn {
  // Course browsing
  courses: LMSCourse[];
  currentCourse: LMSCourse | null;
  currentProgress: UserProgress | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadCourses: (filters?: CourseFilters) => Promise<void>;
  enrollInCourse: (courseId: string) => Promise<void>;
  loadCourseProgress: (courseId: string) => Promise<void>;
  completeStep: (courseId: string, stepId: string) => Promise<void>;
  submitQuiz: (courseId: string, stepId: string, answers: Record<string, any>) => Promise<QuizAttempt>;
}

export function useLMSBrowser(): UseLMSBrowserReturn {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [currentCourse, setCurrentCourse] = useState<LMSCourse | null>(null);
  const [currentProgress, setCurrentProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get auth token
  const getAuthToken = async () => {
    if (!currentUser) throw new Error('Not authenticated');
    return currentUser.getIdToken();
  };

  // Load available courses
  const loadCourses = useCallback(async (filters?: CourseFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const params = new URLSearchParams();
      
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.searchQuery) params.append('search', filters.searchQuery);
      
      const response = await fetch(`/api/lms/courses?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch courses');
      
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Load courses on mount
  useEffect(() => {
    if (currentUser) {
      loadCourses();
    }
  }, [currentUser, loadCourses]);

  // Enroll in a course
  const enrollInCourse = async (courseId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const response = await fetch('/api/lms/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      if (!response.ok) {
        throw new Error('Failed to enroll in course');
      }

      const data = await response.json();
      setCurrentProgress(data.progress);
      
      // Set current course
      const course = courses.find(c => c.id === courseId);
      if (course) {
        setCurrentCourse(course);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll');
    } finally {
      setIsLoading(false);
    }
  };

  // Load progress for a course
  const loadCourseProgress = async (courseId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/lms/progress/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch progress');
      
      const data = await response.json();
      setCurrentProgress(data.progress);
      
      // Set current course
      const course = courses.find(c => c.id === courseId);
      if (course) {
        setCurrentCourse(course);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete a step
  const completeStep = async (courseId: string, stepId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/lms/progress/${courseId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId,
          timeSpent: 0, // Will be tracked by the component
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete step');
      }

      const data = await response.json();
      setCurrentProgress(data.progress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete step');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit quiz
  const submitQuiz = async (courseId: string, stepId: string, answers: Record<string, any>): Promise<QuizAttempt> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const response = await fetch('/api/lms/quiz/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          stepId,
          answers,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const data = await response.json();
      
      // Reload progress after quiz submission
      await loadCourseProgress(courseId);
      
      return data.attempt;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    courses,
    currentCourse,
    currentProgress,
    isLoading,
    error,
    loadCourses,
    enrollInCourse,
    loadCourseProgress,
    completeStep,
    submitQuiz,
  };
}
