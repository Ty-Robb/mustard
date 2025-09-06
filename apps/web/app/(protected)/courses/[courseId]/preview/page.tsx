'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, BookOpen, Clock, Users, Star, ChevronRight, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CoursePricing } from '@/components/payment/CoursePricing';
import type { LMSCourse, LMSModule, LMSStep } from '@/types/lms';

export default function CoursePreviewPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  
  const [course, setCourse] = useState<LMSCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<LMSStep | null>(null);
  const [isOwned, setIsOwned] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchCourse();
      checkOwnership();
    }
    
    // Check for purchase status in URL params
    const purchase = searchParams.get('purchase');
    if (purchase === 'success') {
      setPurchaseStatus('success');
      // Refresh ownership status
      setTimeout(() => {
        checkOwnership();
        setPurchaseStatus(null);
      }, 3000);
    } else if (purchase === 'cancelled') {
      setPurchaseStatus('cancelled');
      setTimeout(() => setPurchaseStatus(null), 5000);
    }
  }, [courseId, currentUser, searchParams]);

  const fetchCourse = async () => {
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`/api/lms/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have permission to preview this course');
        }
        throw new Error('Failed to fetch course');
      }
      
      const data = await response.json();
      setCourse(data.course);
      
      // Set first module as active by default
      if (data.course.modules && data.course.modules.length > 0) {
        setActiveModule(data.course.modules[0].id);
        if (data.course.modules[0].steps && data.course.modules[0].steps.length > 0) {
          setCurrentStep(data.course.modules[0].steps[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const checkOwnership = async () => {
    try {
      const token = await currentUser?.getIdToken();
      // In a real implementation, this would check with the payment service
      // For now, we'll check if the user is the course creator
      const response = await fetch(`/api/lms/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Check if user is the creator or has purchased the course
        setIsOwned(data.course.createdBy === currentUser?.uid || false);
      }
    } catch (err) {
      console.error('Failed to check ownership:', err);
    }
  };

  const handleStepClick = (step: LMSStep, moduleId: string) => {
    setCurrentStep(step);
    setActiveModule(moduleId);
  };

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set(prev).add(stepId));
    
    // Find next step
    if (course && currentStep) {
      const currentModuleIndex = course.modules.findIndex(m => m.id === activeModule);
      const currentModule = course.modules[currentModuleIndex];
      const currentStepIndex = currentModule.steps.findIndex(s => s.id === currentStep.id);
      
      if (currentStepIndex < currentModule.steps.length - 1) {
        // Next step in same module
        setCurrentStep(currentModule.steps[currentStepIndex + 1]);
      } else if (currentModuleIndex < course.modules.length - 1) {
        // First step of next module
        const nextModule = course.modules[currentModuleIndex + 1];
        setActiveModule(nextModule.id);
        setCurrentStep(nextModule.steps[0]);
      }
    }
  };

  const calculateProgress = () => {
    if (!course) return 0;
    const totalSteps = course.modules.reduce((acc, module) => acc + module.steps.length, 0);
    return totalSteps > 0 ? (completedSteps.size / totalSteps) * 100 : 0;
  };

  const getStepTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      lesson: '📖',
      quiz: '📝',
      assignment: '📋',
      discussion: '💬',
      presentation: '🎯',
      resource: '🔗',
    };
    return icons[type] || '📄';
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to preview courses.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Course not found'}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/courses/my-courses')} className="mt-4">
          Back to My Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/courses/${courseId}/edit`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Editor
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Badge variant="secondary">Preview Mode</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Viewing as: Student
            </div>
          </div>
        </div>
      </div>

      {/* Course Hero */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
            <p className="text-lg text-muted-foreground mb-6">{course.description}</p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{course.duration || `${course.estimatedHours} hours`}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{course.modules.length} modules</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{course.enrollmentCount || 0} enrolled</span>
              </div>
              {course.rating && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{course.rating.toFixed(1)} ({course.ratingCount || 0} reviews)</span>
                </div>
              )}
            </div>

            {course.isPaid && !isOwned ? (
              <Alert className="max-w-md">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  This is a paid course. Purchase to get full access to all content.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex gap-4">
                <Button size="lg" className="gap-2" onClick={() => router.push(`/lms-test?courseId=${courseId}`)}>
                  <BookOpen className="h-4 w-4" />
                  Start Learning
                </Button>
                <Button size="lg" variant="outline">
                  Add to Wishlist
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Progress</span>
            <div className="flex-1">
              <Progress value={calculateProgress()} className="h-2" />
            </div>
            <span className="text-sm text-muted-foreground">
              {completedSteps.size} / {course.modules.reduce((acc, m) => acc + m.steps.length, 0)} completed
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Purchase Status Alerts */}
        {purchaseStatus === 'success' && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Purchase successful! You now have full access to this course.
            </AlertDescription>
          </Alert>
        )}
        
        {purchaseStatus === 'cancelled' && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Purchase cancelled. You can try again when you're ready.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Course Navigation & Pricing */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pricing Card - Show for paid courses */}
            {course.isPaid && (
              <CoursePricing
                courseId={courseId}
                courseTitle={course.title}
                isOwned={isOwned}
                onPurchaseSuccess={() => {
                  setIsOwned(true);
                  checkOwnership();
                }}
              />
            )}
            
            {/* Course Navigation */}
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {course.modules.map((module, moduleIndex) => (
                    <div key={module.id} className="border-b last:border-0">
                      <button
                        onClick={() => setActiveModule(module.id === activeModule ? null : module.id)}
                        className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="font-medium">Module {moduleIndex + 1}: {module.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {module.steps.length} lessons · {Math.round(module.estimatedMinutes / 60)} hours
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-transform ${
                          activeModule === module.id ? 'rotate-90' : ''
                        }`} />
                      </button>
                      
                      {activeModule === module.id && (
                        <div className="bg-muted/20">
                          {module.steps.map((step, stepIndex) => (
                            <button
                              key={step.id}
                              onClick={() => handleStepClick(step, module.id)}
                              className={`w-full px-8 py-2 text-left hover:bg-muted/50 transition-colors flex items-center gap-3 ${
                                currentStep?.id === step.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                              }`}
                            >
                              <span className="text-lg">{getStepTypeIcon(step.type)}</span>
                              <div className="flex-1">
                                <div className="text-sm font-medium">{step.title}</div>
                                <div className="text-xs text-muted-foreground">{step.estimatedMinutes} min</div>
                              </div>
                              {completedSteps.has(step.id) && (
                                <Badge variant="secondary" className="text-xs">✓</Badge>
                              )}
                              {step.isLocked && !isOwned && course.isPaid && (
                                <Lock className="h-3 w-3 text-muted-foreground" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {currentStep ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{getStepTypeIcon(currentStep.type)}</span>
                        {currentStep.title}
                      </CardTitle>
                      <CardDescription>
                        {currentStep.type.charAt(0).toUpperCase() + currentStep.type.slice(1)} · {currentStep.estimatedMinutes} min
                      </CardDescription>
                    </div>
                    {completedSteps.has(currentStep.id) && (
                      <Badge variant="secondary">Completed</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground mb-6">
                      {currentStep.description || 'Step description would be displayed here.'}
                    </p>
                    
                    {currentStep.content?.instructions && (
                      <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold mb-2">Instructions</h4>
                        <p className="text-sm">{currentStep.content.instructions}</p>
                      </div>
                    )}
                    
                    {/* Show content preview or lock message based on ownership */}
                    {!isOwned && course.isPaid && currentStep.isLocked ? (
                      <Alert>
                        <Lock className="h-4 w-4" />
                        <AlertDescription>
                          This content is locked. Purchase the course to unlock all lessons and features.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        {/* Placeholder for different step types */}
                        {currentStep.type === 'lesson' && currentStep.content?.initialPrompt && (
                          <Alert>
                            <AlertDescription>
                              <strong>AI Assistant:</strong> {currentStep.content.initialPrompt}
                            </AlertDescription>
                          </Alert>
                        )}
                    
                    {currentStep.type === 'quiz' && (
                      <Alert>
                        <AlertDescription>
                          Quiz interface would be displayed here with questions and answer options.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {currentStep.type === 'assignment' && (
                      <Alert>
                        <AlertDescription>
                          Assignment submission interface would be displayed here.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {currentStep.type === 'discussion' && (
                      <Alert>
                        <AlertDescription>
                          Discussion forum interface would be displayed here.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {currentStep.type === 'presentation' && (
                      <Alert>
                        <AlertDescription>
                          Presentation viewer would be displayed here.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                        {currentStep.type === 'resource' && (
                          <Alert>
                            <AlertDescription>
                              Resource links and downloads would be displayed here.
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                  </div>
                  
                  <div className="mt-8 flex justify-between">
                    <Button variant="outline">Previous</Button>
                    {isOwned || !course.isPaid ? (
                      <Button 
                        onClick={() => handleStepComplete(currentStep.id)}
                        disabled={completedSteps.has(currentStep.id)}
                      >
                        {completedSteps.has(currentStep.id) ? 'Completed' : 'Mark as Complete'}
                      </Button>
                    ) : (
                      <Button onClick={() => document.querySelector('[data-pricing-card]')?.scrollIntoView({ behavior: 'smooth' })}>
                        Unlock Course
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Select a lesson to begin</h3>
                  <p className="text-muted-foreground">
                    Choose a module and lesson from the course content on the left to start learning.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
