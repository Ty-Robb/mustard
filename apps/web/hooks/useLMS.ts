import { useState, useEffect, useCallback } from 'react';
import { useChat } from './useChat';
import { getLMSService } from '@/lib/services/lms.service';
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

export function useLMS(courseId?: string): UseLMSReturn {
  const { currentUser } = useAuth();
  const { 
    selectedAgentId, 
    setSelectedAgentId,
    createSession,
    loadSession,
    sendMessage 
  } = useChat();

  const [course, setCourse] = useState<LMSCourse | null>(null);
  const [currentStep, setCurrentStep] = useState<LMSStep | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLMSMode, setIsLMSMode] = useState(false);
  const [stepStartTime, setStepStartTime] = useState<Date | null>(null);

  // Get LMS service
  const lmsService = currentUser ? getLMSService(currentUser.uid) : null;

  // Load course and progress
  useEffect(() => {
    if (!courseId || !lmsService) return;

    const loadCourseData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load course
        const courseData = await lmsService.getCourse(courseId);
        if (!courseData) {
          throw new Error('Course not found');
        }
        setCourse(courseData);

        // Load or create progress
        let progress = await lmsService.getUserProgress(courseId);
        if (!progress) {
          progress = await lmsService.enrollInCourse(courseId);
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
  }, [courseId, lmsService]);

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
  const enrollInCourse = async (courseId: string) => {
    if (!lmsService) {
      setError('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const progress = await lmsService.enrollInCourse(courseId);
      setUserProgress(progress);
      
      // Load course data
      const courseData = await lmsService.getCourse(courseId);
      if (courseData) {
        setCourse(courseData);
        const step = findStepById(courseData, progress.currentStepId);
        if (step) {
          setCurrentStep(step);
          setStepStartTime(new Date());
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to a specific step
  const navigateToStep = async (stepId: string) => {
    if (!course || !lmsService) return;

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
    if (!course || !currentStep || !userProgress || !lmsService) return;

    setIsLoading(true);
    setError(null);

    try {
      const timeSpent = getTimeSpent();
      const updatedProgress = await lmsService.completeStep(
        course.id,
        currentStep.id,
        submission,
        timeSpent
      );

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
    if (!currentStep || !lmsService || currentStep.type !== 'quiz') {
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
      const attempt = await lmsService.submitQuizAttempt(currentStep.id, {
        stepId: currentStep.id,
        userId: currentUser!.uid,
        questions: quizData.questions,
        answers,
        score,
        passed,
        attemptedAt: new Date(),
        timeSpent: getTimeSpent(),
      });

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
    enrollInCourse,
    navigateToStep,
    completeCurrentStep,
    submitQuizAttempt,
    isLMSMode,
    setLMSMode: setIsLMSMode,
    stepStartTime,
    getTimeSpent,
  };
}
