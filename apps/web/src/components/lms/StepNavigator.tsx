import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { LMSCourse, LMSModule, LMSStep, UserProgress } from '@/types/lms';

interface StepNavigatorProps {
  course: LMSCourse;
  currentStep: LMSStep;
  userProgress: UserProgress;
  onNavigate: (stepId: string) => void;
  onComplete?: () => void;
  className?: string;
}

export function StepNavigator({
  course,
  currentStep,
  userProgress,
  onNavigate,
  onComplete,
  className,
}: StepNavigatorProps) {
  // Find current module
  const currentModule = course.modules.find(m => m.id === currentStep.moduleId);
  if (!currentModule) return null;

  // Get all steps in order
  const allSteps: Array<{ step: LMSStep; module: LMSModule }> = [];
  course.modules.forEach(module => {
    module.steps.forEach(step => {
      allSteps.push({ step, module });
    });
  });

  // Find current step index
  const currentStepIndex = allSteps.findIndex(({ step }) => step.id === currentStep.id);
  const previousStep = currentStepIndex > 0 ? allSteps[currentStepIndex - 1] : null;
  const nextStep = currentStepIndex < allSteps.length - 1 ? allSteps[currentStepIndex + 1] : null;

  // Check if step is completed
  const isStepCompleted = (stepId: string) => {
    return userProgress.completedSteps.some(cs => cs.stepId === stepId);
  };

  // Check if step is accessible
  const isStepAccessible = (stepIndex: number) => {
    // First step is always accessible
    if (stepIndex === 0) return true;
    
    // Check if previous step is completed
    const prevStep = allSteps[stepIndex - 1];
    return isStepCompleted(prevStep.step.id);
  };

  const handlePrevious = () => {
    if (previousStep) {
      onNavigate(previousStep.step.id);
    }
  };

  const handleNext = () => {
    if (nextStep) {
      onNavigate(nextStep.step.id);
    } else if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Course Progress</span>
          <span>{userProgress.overallProgress}% Complete</span>
        </div>
        <Progress value={userProgress.overallProgress} className="h-2" />
      </div>

      {/* Current Step Info */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="text-sm text-muted-foreground mb-1">
          {currentModule.title} • Step {currentStep.order} of {currentModule.steps.length}
        </div>
        <h3 className="font-semibold">{currentStep.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Estimated time: {currentStep.estimatedMinutes} minutes
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={!previousStep}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {allSteps.map(({ step }, index) => {
            const isCompleted = isStepCompleted(step.id);
            const isCurrent = step.id === currentStep.id;
            const isAccessible = isStepAccessible(index);

            return (
              <button
                key={step.id}
                onClick={() => isAccessible && onNavigate(step.id)}
                disabled={!isAccessible}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  isCompleted && "bg-primary",
                  isCurrent && !isCompleted && "bg-primary/50 w-3 h-3",
                  !isCompleted && !isCurrent && isAccessible && "bg-muted-foreground/30",
                  !isAccessible && "bg-muted-foreground/10"
                )}
                title={`${step.title}${!isAccessible ? ' (Locked)' : ''}`}
              />
            );
          })}
        </div>

        <Button
          onClick={handleNext}
          disabled={!nextStep && !onComplete}
          className="gap-2"
        >
          {nextStep ? (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          ) : (
            <>
              Complete Course
              <CheckCircle className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Module Overview (Collapsible) */}
      <details className="border rounded-lg">
        <summary className="cursor-pointer p-3 hover:bg-muted/50 transition-colors">
          <span className="font-medium">Course Overview</span>
        </summary>
        <div className="p-3 pt-0 space-y-3">
          {course.modules.map((module) => (
            <div key={module.id} className="space-y-2">
              <h4 className="font-medium text-sm">{module.title}</h4>
              <div className="space-y-1 pl-4">
                {module.steps.map((step, stepIndex) => {
                  const globalIndex = allSteps.findIndex(({ step: s }) => s.id === step.id);
                  const isCompleted = isStepCompleted(step.id);
                  const isCurrent = step.id === currentStep.id;
                  const isAccessible = isStepAccessible(globalIndex);

                  return (
                    <button
                      key={step.id}
                      onClick={() => isAccessible && onNavigate(step.id)}
                      disabled={!isAccessible}
                      className={cn(
                        "w-full text-left flex items-center gap-2 p-2 rounded-md text-sm transition-colors",
                        isCurrent && "bg-primary/10 text-primary",
                        !isCurrent && isAccessible && "hover:bg-muted/50",
                        !isAccessible && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      ) : isAccessible ? (
                        <Circle className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                      <span className="flex-1">{step.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {step.estimatedMinutes}m
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
