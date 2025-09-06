import { useState, useEffect, useCallback } from 'react';
import { useChat } from './useChat';
import { 
  LMSCourse, 
  LMSStep, 
  UserProgress, 
  StepSubmission,
  QuizAttempt 
} from '@repo/types';
import { useAuth } from './useAuth';

interface UseLMSReturn {
  // Course data
  course: LMSCourse | null;
  currentStep: LMSStep | null;
  userProgress: UserProgress | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  enrollInCourse: (courseId: string) => Promise<void>;
  navigateToStep: (stepId: string) => Promise<void>;
  completeCurrentStep: (submission?: StepSubmission) => Promise<void>;
  submitQuizAttempt: (answers: Record<string, any>) => Promise<QuizAttempt | null>;
  
  // LMS mode
  isLMSMode: boolean;
  setLMSMode: (enabled: boolean) => void;
  
  // Time tracking
  stepStartTime: Date | null;
  getTimeSpent: () => number;
}

export function useLMSClient(courseId?: string): UseLMSReturn {
  const { currentUser } = useAuth();
  const { 
    selectedAgentId, 
    setSelectedAgentId,
    sendMessage 
  } = useChat();

  const [course, setCourse] = useState<LMSCourse | null>(null);
  const [currentStep, setCurrentStep] = useState<LMSStep | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLMSMode, setIsLMSMode] = useState(false);
  const [stepStartTime, setStepStartTime] = useState<Date | null>(null);

  // Get auth token
  const getAuthToken = async () => {
    if (!currentUser) throw new Error('Not authenticated');
    return currentUser.getIdToken();
  };

  // Fetch course data
  const fetchCourse = async (courseId: string) => {
    try {
      const token = await getAuthToken();
      const url = `/api/lms/courses/${courseId}`;
      console.log('[useLMSClient] Fetching course from:', url);
      console.log('[useLMSClient] Course ID:', courseId);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('[useLMSClient] Response status:', response.status);
      console.log('[useLMSClient] Response headers:', response.headers);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: 'Failed to parse error response' };
        }
        console.error('[useLMSClient] Error response:', errorData);
        console.error('[useLMSClient] Full URL was:', url);
        console.error('[useLMSClient] Response status text:', response.statusText);
        
        if (response.status === 404) {
          throw new Error(`Course not found: ${courseId}`);
        }
        throw new Error(errorData.message || `Failed to fetch course: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[useLMSClient] Response data:', data);
      return data.course || null;
    } catch (err) {
      console.error('[useLMSClient] Error fetching course:', err);
      throw err; // Re-throw to handle in the calling function
    }
  };

  // Fetch user progress
  const fetchProgress = async (courseId: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/lms/progress/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch progress');
      
      const data = await response.json();
      return data.progress;
    } catch (err) {
      console.error('Error fetching progress:', err);
      return null;
    }
  };

  // Load course and progress
  useEffect(() => {
    if (!courseId || !currentUser) return;

    const loadCourseData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load course
        const courseData = await fetchCourse(courseId);
        if (!courseData) {
          throw new Error('Course not found');
        }
        setCourse(courseData);

        // Load or create progress
        let progress = await fetchProgress(courseId);
        if (!progress) {
          // Enroll in course
          progress = await enrollInCourse(courseId);
        }
        setUserProgress(progress);

        // Set current step
        const step = findStepById(courseData, progress.currentStepId);
        if (step) {
          setCurrentStep(step);
          setStepStartTime(new Date());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourseData();
  }, [courseId, currentUser]);

  // Update agent when step changes
  useEffect(() => {
    if (currentStep && isLMSMode) {
      setSelectedAgentId(currentStep.agentId);
    }
  }, [currentStep, isLMSMode, setSelectedAgentId]);

  // Helper to find step by ID
  const findStepById = (course: LMSCourse, stepId: string): LMSStep | null => {
    for (const module of course.modules) {
      const step = module.steps.find(s => s.id === stepId);
      if (step) return step;
    }
    return null;
  };

  // Calculate time spent on current step
  const getTimeSpent = useCallback(() => {
    if (!stepStartTime) return 0;
    return Math.floor((new Date().getTime() - stepStartTime.getTime()) / 1000);
  }, [stepStartTime]);

  // Enroll in course
  const enrollInCourse = async (courseId: string): Promise<UserProgress> => {
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
    return data.progress;
  };

  // Navigate to a specific step
  const navigateToStep = async (stepId: string) => {
    if (!course) return;

    const step = findStepById(course, stepId);
    if (!step) {
      setError('Step not found');
      return;
    }

    setCurrentStep(step);
    setStepStartTime(new Date());
    setSelectedAgentId(step.agentId);

    // Update progress to reflect current step
    if (userProgress) {
      setUserProgress({
        ...userProgress,
        currentStepId: stepId,
        currentModuleId: step.moduleId,
        lastAccessedAt: new Date(),
      });
    }

    // Send initial prompt if available
    if (step.content.initialPrompt) {
      await sendMessage(step.content.initialPrompt);
    }
  };

  // Complete current step
  const completeCurrentStep = async (submission?: StepSubmission) => {
    if (!course || !currentStep || !userProgress) return;

    setIsLoading(true);
    setError(null);

    try {
      const timeSpent = getTimeSpent();
      const token = await getAuthToken();
      
      const response = await fetch(`/api/lms/progress/${course.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId: currentStep.id,
          submission,
          timeSpent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete step');
      }

      const data = await response.json();
      const updatedProgress = data.progress;

      setUserProgress(updatedProgress);

      // Auto-navigate to next step if available
      if (updatedProgress.currentStepId !== currentStep.id) {
        const nextStep = findStepById(course, updatedProgress.currentStepId);
        if (nextStep) {
          setCurrentStep(nextStep);
          setStepStartTime(new Date());
          setSelectedAgentId(nextStep.agentId);
          
          // Send initial prompt for next step
          if (nextStep.content.initialPrompt) {
            await sendMessage(nextStep.content.initialPrompt);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete step');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit quiz attempt
  const submitQuizAttempt = async (answers: Record<string, any>): Promise<QuizAttempt | null> => {
    if (!currentStep || currentStep.type !== 'quiz') {
      setError('Invalid quiz step');
      return null;
    }

    const quizData = currentStep.content.quizData;
    if (!quizData) {
      setError('No quiz data found');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Calculate score
      let correctAnswers = 0;
      let totalPoints = 0;

      quizData.questions.forEach(question => {
        totalPoints += question.points;
        const userAnswer = answers[question.id];
        
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
          if (userAnswer === question.correctAnswer) {
            correctAnswers += question.points;
          }
        }
        // For short-answer and essay, we'd need AI grading
      });

      const score = Math.round((correctAnswers / totalPoints) * 100);
      const passed = score >= quizData.passingScore;

      // Submit attempt
      const token = await getAuthToken();
      const response = await fetch('/api/lms/quiz/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId: currentStep.id,
          questions: quizData.questions,
          answers,
          score,
          passed,
          timeSpent: getTimeSpent(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const data = await response.json();
      const attempt = data.attempt;

      // If passed, complete the step
      if (passed) {
        await completeCurrentStep({
          id: attempt.id,
          type: 'quiz',
          content: answers,
          grade: score,
          gradedAt: new Date(),
          gradedBy: 'ai',
        });
      }

      return attempt;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    course,
    currentStep,
    userProgress,
    isLoading,
    error,
    enrollInCourse: async (courseId: string) => {
      const progress = await enrollInCourse(courseId);
      setUserProgress(progress);
      
      // Load course data
      const courseData = await fetchCourse(courseId);
      if (courseData) {
        setCourse(courseData);
        const step = findStepById(courseData, progress.currentStepId);
        if (step) {
          setCurrentStep(step);
          setStepStartTime(new Date());
        }
      }
    },
    navigateToStep,
    completeCurrentStep,
    submitQuizAttempt,
    isLMSMode,
    setLMSMode: setIsLMSMode,
    stepStartTime,
    getTimeSpent,
  };
}
