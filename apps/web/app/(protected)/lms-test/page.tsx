'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CourseSelectorClient } from '@/components/lms/CourseSelectorClient';
import { StepNavigator } from '@/components/lms/StepNavigator';
import { QuizComponent } from '@/components/lms/QuizComponent';
import { useLMSClient } from '@/hooks/useLMSClient';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, Clock, MessageSquare, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LMSTestPage() {
  const router = useRouter();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
  const {
    course,
    currentStep,
    userProgress,
    isLoading,
    error,
    navigateToStep,
    completeCurrentStep,
    submitQuizAttempt,
    isLMSMode,
    setLMSMode,
    stepStartTime,
    getTimeSpent,
  } = useLMSClient(selectedCourseId);

  const { createLMSSession } = useChat();

  // Check URL parameters on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('courseId');
    const stepId = params.get('stepId');
    
    if (courseId) {
      setSelectedCourseId(courseId);
      setLMSMode(true);
      
      // Navigate to specific step if provided
      if (stepId && course) {
        // Find the step in the course
        const targetStep = course.modules
          .flatMap(m => m.steps)
          .find(s => s.id === stepId);
          
        if (targetStep) {
          navigateToStep(targetStep.id);
        }
      }
    }
  }, [course, navigateToStep, setLMSMode]);

  const handleCourseSelect = (courseId: string) => {
    console.log('[LMS Test Page] Course selected:', courseId);
    setSelectedCourseId(courseId);
    setLMSMode(true);
  };

  const handleBackToCourses = () => {
    setSelectedCourseId('');
    setLMSMode(false);
  };

  const handleCompleteStep = async () => {
    await completeCurrentStep();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show course selector if no course is selected
  if (!selectedCourseId) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <CourseSelectorClient onSelectCourse={handleCourseSelect} />
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={handleBackToCourses} className="mt-4">
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show course content
  if (!course || !currentStep || !userProgress) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="container mx-auto p-4 max-w-7xl">
          <Button
            variant="ghost"
            onClick={handleBackToCourses}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <p className="text-muted-foreground">{course.description}</p>
            </div>
            <Badge variant="outline" className="ml-4">
              {course.difficulty}
            </Badge>
          </div>
        </div>
      </div>

      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Step Navigator */}
            <div className="lg:col-span-1">
              <StepNavigator
                course={course}
                currentStep={currentStep}
                userProgress={userProgress}
                onNavigate={navigateToStep}
                onComplete={handleCompleteStep}
              />
            </div>

            {/* Right Column - Step Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{currentStep.title}</CardTitle>
                      <CardDescription>{currentStep.description}</CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {currentStep.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="content" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="instructions">Instructions</TabsTrigger>
                      <TabsTrigger value="progress">Progress</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="mt-4">
                      {currentStep.type === 'quiz' && currentStep.content.quizData ? (
                        <QuizComponent
                          quizData={currentStep.content.quizData}
                          onSubmit={submitQuizAttempt}
                        />
                      ) : (
                        <div className="space-y-4">
                          {currentStep.content.instructions && (
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm">{currentStep.content.instructions}</p>
                            </div>
                          )}

                          {currentStep.content.initialPrompt && (
                            <div className="space-y-2">
                              <h4 className="font-medium">Initial Prompt:</h4>
                              <p className="text-sm text-muted-foreground italic">
                                "{currentStep.content.initialPrompt}"
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              onClick={async () => {
                                if (!course || !currentStep) return;
                                
                                setIsCreatingSession(true);
                                try {
                                  // Create a chat session with LMS context
                                  const session = await createLMSSession({
                                    courseId: course.id,
                                    courseTitle: course.title,
                                    moduleId: currentStep.moduleId,
                                    moduleTitle: course.modules.find(m => m.id === currentStep.moduleId)?.title || '',
                                    stepId: currentStep.id,
                                    stepTitle: currentStep.title,
                                    stepType: currentStep.type as 'lesson' | 'quiz' | 'assignment' | 'discussion' | 'presentation',
                                    agentId: currentStep.agentId,
                                    initialPrompt: currentStep.content.initialPrompt,
                                    expectedOutcome: currentStep.content.expectedOutcome,
                                    resources: currentStep.content.resources,
                                    startTime: new Date(),
                                    returnUrl: `/lms-test?courseId=${course.id}&stepId=${currentStep.id}`
                                  });

                                  // Navigate to chat with the session
                                  if (session) {
                                    router.push(`/chat?sessionId=${session.id}`);
                                  }
                                } catch (error) {
                                  console.error('Failed to create LMS chat session:', error);
                                } finally {
                                  setIsCreatingSession(false);
                                }
                              }}
                              disabled={isCreatingSession}
                              className="flex-1"
                            >
                              {isCreatingSession ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                  Creating session...
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Open Chat with {currentStep.agentId}
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </>
                              )}
                            </Button>
                          </div>

                          {currentStep.content.initialPrompt && (
                            <div className="p-4 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">
                                This prompt will be automatically sent when you open the chat:
                              </p>
                              <p className="text-sm italic">
                                "{currentStep.content.initialPrompt}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="instructions" className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Step Type</h4>
                          <p className="text-sm text-muted-foreground">{currentStep.type}</p>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Assigned Agent</h4>
                          <p className="text-sm text-muted-foreground">{currentStep.agentId}</p>
                        </div>

                        {currentStep.content.expectedOutcome && (
                          <div>
                            <h4 className="font-medium mb-2">Expected Outcome</h4>
                            <p className="text-sm text-muted-foreground">
                              {currentStep.content.expectedOutcome}
                            </p>
                          </div>
                        )}

                        {currentStep.content.resources && currentStep.content.resources.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Resources</h4>
                            <ul className="space-y-1">
                              {currentStep.content.resources.map((resource) => (
                                <li key={resource.id} className="text-sm text-muted-foreground">
                                  • {resource.title} ({resource.type})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="progress" className="mt-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Time on Step</p>
                            <p className="text-2xl font-bold">
                              {formatTime(getTimeSpent())}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Estimated Time</p>
                            <p className="text-2xl font-bold">
                              {currentStep.estimatedMinutes}m
                            </p>
                          </div>
                        </div>

                        {currentStep.requirements && (
                          <div>
                            <h4 className="font-medium mb-2">Requirements</h4>
                            <ul className="space-y-2">
                              {currentStep.requirements.minInteractions && (
                                <li className="flex items-center gap-2 text-sm">
                                  <MessageSquare className="h-4 w-4" />
                                  Minimum {currentStep.requirements.minInteractions} interactions
                                </li>
                              )}
                              {currentStep.requirements.minTimeSpent && (
                                <li className="flex items-center gap-2 text-sm">
                                  <Clock className="h-4 w-4" />
                                  Minimum {Math.floor(currentStep.requirements.minTimeSpent / 60)} minutes
                                </li>
                              )}
                              {currentStep.requirements.passingScore && (
                                <li className="flex items-center gap-2 text-sm">
                                  <BookOpen className="h-4 w-4" />
                                  Passing score: {currentStep.requirements.passingScore}%
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        <Button
                          onClick={handleCompleteStep}
                          className="w-full"
                          disabled={currentStep.type === 'quiz'}
                        >
                          Mark Step as Complete
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Debug Info */}
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Debug Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Course ID:</span>
                <p className="font-mono">{course.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Current Step:</span>
                <p className="font-mono">{currentStep.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Progress:</span>
                <p className="font-mono">{userProgress.overallProgress}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">LMS Mode:</span>
                <p className="font-mono">{isLMSMode ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
