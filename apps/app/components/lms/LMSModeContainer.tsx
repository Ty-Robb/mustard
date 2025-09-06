'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CourseSelectorClient } from './CourseSelectorClient';
import { StepNavigator } from './StepNavigator';
import { QuizComponent } from './QuizComponent';
import { useLMSBrowser } from '@/hooks/useLMSBrowser';
import { LMSCourse, LMSStep, QuizData, QuizAttempt } from '@repo/types';
import { 
  GraduationCap, 
  BookOpen, 
  Trophy, 
  Clock, 
  CheckCircle,
  XCircle,
  ArrowLeft,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LMSModeContainerProps {
  onSendMessage: (content: string, agentId?: string) => Promise<void>;
  isLoading?: boolean;
  streamingMessage?: string;
  className?: string;
  onExitLMS?: () => void;
}

export function LMSModeContainer({
  onSendMessage,
  isLoading = false,
  streamingMessage,
  className,
  onExitLMS
}: LMSModeContainerProps) {
  const {
    courses,
    currentCourse,
    currentProgress,
    isLoading: lmsLoading,
    error,
    enrollInCourse,
    loadCourseProgress,
    completeStep,
    submitQuiz
  } = useLMSBrowser();

  const [selectedCourse, setSelectedCourse] = useState<LMSCourse | null>(null);
  const [currentStep, setCurrentStep] = useState<LMSStep | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<QuizData | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'learning'>('courses');

  // Load progress when course is selected
  useEffect(() => {
    if (selectedCourse) {
      loadCourseProgress(selectedCourse.id);
    }
  }, [selectedCourse, loadCourseProgress]);

  // Update current step when progress changes
  useEffect(() => {
    if (selectedCourse && currentProgress) {
      const nextStepIndex = currentProgress.completedSteps.length;
      const allSteps = selectedCourse.modules.flatMap(m => m.steps);
      if (nextStepIndex < allSteps.length) {
        setCurrentStep(allSteps[nextStepIndex]);
      } else {
        // Course completed
        setCurrentStep(null);
      }
    }
  }, [selectedCourse, currentProgress]);

  const handleCourseSelect = async (courseId: string) => {
    await enrollInCourse(courseId);
    // Find the course from the courses list
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setSelectedCourse(course);
      setActiveTab('learning');
    }
  };

  const handleStepComplete = async () => {
    if (!selectedCourse || !currentStep) return;

    // If step has a quiz, show it
    if (currentStep.content.quizData) {
      setCurrentQuiz(currentStep.content.quizData);
      setShowQuiz(true);
    } else {
      // Complete step without quiz
      await completeStep(selectedCourse.id, currentStep.id);
      
      // Send message to the appropriate agent
      if (currentStep.agentId) {
        await onSendMessage(
          `I've completed the step: ${currentStep.title}. What's next?`,
          currentStep.agentId
        );
      }
    }
  };

  const handleQuizSubmit = async (answers: Record<string, any>): Promise<QuizAttempt | null> => {
    if (!selectedCourse || !currentStep || !currentQuiz) return null;

    const result = await submitQuiz(selectedCourse.id, currentStep.id, answers);
    
    if (result.passed) {
      // Quiz passed, complete the step
      await completeStep(selectedCourse.id, currentStep.id);
      setShowQuiz(false);
      setCurrentQuiz(null);
      
      // Send success message to agent
      if (currentStep.agentId) {
        await onSendMessage(
          `I've successfully completed the quiz for ${currentStep.title} with a score of ${result.score}%. What's next?`,
          currentStep.agentId
        );
      }
    } else {
      // Quiz failed, allow retry
      alert(`You need to pass the quiz. You scored ${result.score}%. Please try again.`);
    }
    
    return result;
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setCurrentStep(null);
    setShowQuiz(false);
    setCurrentQuiz(null);
    setActiveTab('courses');
  };

  const calculateProgress = () => {
    if (!selectedCourse || !currentProgress) return 0;
    const totalSteps = selectedCourse.modules.reduce((acc, m) => acc + m.steps.length, 0);
    return (currentProgress.completedSteps.length / totalSteps) * 100;
  };

  return (
    <Card className={cn('flex flex-col h-full border-none bg-transparent', className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Learning Mode</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExitLMS}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Exit Learning Mode
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'courses' | 'learning')} className="flex-1">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="courses">
            <BookOpen className="h-4 w-4 mr-2" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="learning" disabled={!selectedCourse}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Learning
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="flex-1 overflow-y-auto">
          <div className="p-4">
            <CourseSelectorClient
              onSelectCourse={handleCourseSelect}
            />
          </div>
        </TabsContent>

        <TabsContent value="learning" className="flex-1 overflow-y-auto">
          {selectedCourse && (
            <div className="p-4 space-y-4">
              {/* Course Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToCourses}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Courses
                  </Button>
                </div>
                <h3 className="text-xl font-semibold">{selectedCourse.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedCourse.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {selectedCourse.estimatedHours} hours
                  </Badge>
                  <Badge variant="secondary">
                    Level: {selectedCourse.difficulty}
                  </Badge>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
              </div>

              {/* Current Step or Quiz */}
              {showQuiz && currentQuiz ? (
                <QuizComponent
                  quizData={currentQuiz}
                  onSubmit={handleQuizSubmit}
                />
              ) : currentStep ? (
                <div className="space-y-4">
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">{currentStep.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{currentStep.description}</p>
                    
                    {/* Step Content */}
                    <div className="prose prose-sm max-w-none mb-4">
                      {currentStep.content.instructions && (
                        <p>{currentStep.content.instructions}</p>
                      )}
                      {currentStep.content.expectedOutcome && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-md">
                          <h5 className="text-sm font-medium mb-1">Expected Outcome:</h5>
                          <p className="text-sm">{currentStep.content.expectedOutcome}</p>
                        </div>
                      )}
                    </div>

                    {/* Resources */}
                    {currentStep.content.resources && currentStep.content.resources.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium mb-2">Resources:</h5>
                        <ul className="space-y-1">
                          {currentStep.content.resources.map((resource, index) => (
                            <li key={index} className="text-sm">
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {resource.title} ({resource.type})
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      onClick={handleStepComplete}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {currentStep.content.quizData ? (
                        <>
                          <Trophy className="h-4 w-4 mr-2" />
                          Take Quiz
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete Step
                        </>
                      )}
                    </Button>
                  </Card>

                  {/* Step Navigator */}
                  {currentProgress && (
                    <StepNavigator
                      course={selectedCourse}
                      currentStep={currentStep}
                      userProgress={currentProgress}
                      onNavigate={(stepId) => {
                        const allSteps = selectedCourse.modules.flatMap(m => m.steps);
                        const step = allSteps.find(s => s.id === stepId);
                        if (step) setCurrentStep(step);
                      }}
                      onComplete={() => setCurrentStep(null)}
                    />
                  )}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Course Completed!</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Congratulations! You've completed all steps in this course.
                  </p>
                  <Button onClick={handleBackToCourses}>
                    Browse More Courses
                  </Button>
                </Card>
              )}

              {/* Chat Integration Info */}
              {currentStep && (
                <Card className="p-4 bg-muted/50">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      <p>
                        This step uses the <strong>{currentStep.agentId}</strong> agent. 
                        Complete the step to continue the conversation with the appropriate AI assistant.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
    </Card>
  );
}
