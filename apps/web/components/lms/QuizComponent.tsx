import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { QuizData, LMSQuizQuestion, QuizAttempt } from '@repo/types';

interface QuizComponentProps {
  quizData: QuizData;
  onSubmit: (answers: Record<string, any>) => Promise<QuizAttempt | null>;
  previousAttempts?: QuizAttempt[];
  className?: string;
}

export function QuizComponent({
  quizData,
  onSubmit,
  previousAttempts = [],
  className,
}: QuizComponentProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());

  // Randomize questions if enabled
  const [questions] = useState(() => {
    if (quizData.randomizeQuestions) {
      return [...quizData.questions].sort(() => Math.random() - 0.5);
    }
    return quizData.questions;
  });

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canRetry = quizData.allowRetries && 
    (!quizData.maxRetries || previousAttempts.length < quizData.maxRetries);

  // Update timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (value: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const attempt = await onSubmit(answers);
      if (attempt) {
        setLastAttempt(attempt);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setLastAttempt(null);
  };

  const renderQuestion = (question: LMSQuizQuestion) => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <RadioGroup
            value={answers[question.id] || ''}
            onValueChange={handleAnswerChange}
          >
            {question.options?.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label 
                  htmlFor={`${question.id}-${index}`}
                  className="cursor-pointer flex-1"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'true-false':
        return (
          <RadioGroup
            value={answers[question.id] || ''}
            onValueChange={handleAnswerChange}
          >
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="true" id={`${question.id}-true`} />
              <Label htmlFor={`${question.id}-true`} className="cursor-pointer">
                True
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${question.id}-false`} />
              <Label htmlFor={`${question.id}-false`} className="cursor-pointer">
                False
              </Label>
            </div>
          </RadioGroup>
        );

      case 'short-answer':
        return (
          <Input
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full"
          />
        );

      case 'essay':
        return (
          <Textarea
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Write your essay here..."
            className="w-full min-h-[200px]"
          />
        );

      default:
        return null;
    }
  };

  if (showResults && lastAttempt) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {lastAttempt.passed ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                Quiz Passed!
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-500" />
                Quiz Not Passed
              </>
            )}
          </CardTitle>
          <CardDescription>
            Score: {lastAttempt.score}% (Passing score: {quizData.passingScore}%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Time spent:</span>
              <span className="ml-2 font-medium">{formatTime(lastAttempt.timeSpent)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Attempts:</span>
              <span className="ml-2 font-medium">
                {previousAttempts.length + 1}
                {quizData.maxRetries && ` / ${quizData.maxRetries}`}
              </span>
            </div>
          </div>

          {quizData.showExplanations && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Review Answers</h4>
              {questions.map((question, index) => {
                const userAnswer = answers[question.id];
                const isCorrect = userAnswer === question.correctAnswer;
                
                return (
                  <div key={question.id} className="space-y-2">
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {index + 1}. {question.question}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your answer: {userAnswer || 'Not answered'}
                        </p>
                        {!isCorrect && question.correctAnswer && (
                          <p className="text-sm text-green-600 mt-1">
                            Correct answer: {question.correctAnswer}
                          </p>
                        )}
                        {question.explanation && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {question.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {canRetry && !lastAttempt.passed && (
              <Button onClick={handleRetry} variant="outline">
                Try Again
              </Button>
            )}
            <Button onClick={() => window.location.reload()} variant="default">
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Quiz</CardTitle>
            <CardDescription>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formatTime(timeSpent)}
          </div>
        </div>
        <Progress 
          value={(currentQuestionIndex + 1) / questions.length * 100} 
          className="mt-4"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">
              {currentQuestion.question}
              {currentQuestion.points > 1 && (
                <span className="text-sm text-muted-foreground ml-2">
                  ({currentQuestion.points} points)
                </span>
              )}
            </h3>
            {currentQuestion.hint && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{currentQuestion.hint}</AlertDescription>
              </Alert>
            )}
          </div>

          {renderQuestion(currentQuestion)}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {!isLastQuestion ? (
              <Button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id]}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || Object.keys(answers).length < questions.length}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            )}
          </div>
        </div>

        {previousAttempts.length > 0 && (
          <div className="text-sm text-muted-foreground text-center pt-2">
            Previous attempts: {previousAttempts.length}
            {quizData.maxRetries && ` / ${quizData.maxRetries}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
