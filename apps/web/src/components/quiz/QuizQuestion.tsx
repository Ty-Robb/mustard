'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { QuizQuestion as QuizQuestionType } from '@/types/quiz'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

interface QuizQuestionProps {
  question: QuizQuestionType
  questionNumber: number
  totalQuestions: number
  onAnswer: (answer: string) => void
  timeLimit?: number // in seconds
  showResult?: boolean
  userAnswer?: string
}

export function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  timeLimit = 30,
  showResult = false,
  userAnswer
}: QuizQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)
  const [hasAnswered, setHasAnswered] = useState(false)

  // Timer effect
  useEffect(() => {
    if (!hasAnswered && timeLimit > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up - auto submit
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [hasAnswered, timeLimit])

  // Reset when question changes
  useEffect(() => {
    setSelectedAnswer('')
    setHasAnswered(false)
    setTimeRemaining(timeLimit)
  }, [question.id, timeLimit])

  const handleSubmit = () => {
    if (!hasAnswered) {
      setHasAnswered(true)
      onAnswer(selectedAnswer)
    }
  }

  const getAnswerStatus = (answer: string) => {
    if (!showResult) return 'default'
    if (answer === question.correctAnswer) return 'correct'
    if (answer === userAnswer && answer !== question.correctAnswer) return 'incorrect'
    return 'default'
  }

  const getAnswerIcon = (answer: string) => {
    const status = getAnswerStatus(answer)
    if (status === 'correct') return <CheckCircle2 className="h-4 w-4 text-green-600" />
    if (status === 'incorrect') return <XCircle className="h-4 w-4 text-red-600" />
    return null
  }

  const progressPercentage = (timeRemaining / timeLimit) * 100
  const isTimeLow = timeRemaining <= 10

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-4">
        {/* Progress and Timer */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Question {questionNumber} of {totalQuestions}
          </span>
          {timeLimit > 0 && !hasAnswered && (
            <div className="flex items-center gap-2">
              <Clock className={cn(
                "h-4 w-4",
                isTimeLow ? "text-red-600 animate-pulse" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-sm font-medium",
                isTimeLow ? "text-red-600" : "text-muted-foreground"
              )}>
                {timeRemaining}s
              </span>
            </div>
          )}
        </div>

        {/* Timer Progress Bar */}
        {timeLimit > 0 && !hasAnswered && (
          <Progress 
            value={progressPercentage} 
            className={cn(
              "h-2 transition-all",
              isTimeLow && "animate-pulse"
            )}
          />
        )}

        {/* Question */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold leading-tight">
            {question.question}
          </h3>
          {question.reference && (
            <p className="text-sm text-muted-foreground">
              Reference: {question.reference}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Answer Options */}
        <RadioGroup
          value={selectedAnswer}
          onValueChange={setSelectedAnswer}
          disabled={hasAnswered}
        >
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const status = getAnswerStatus(option)
              return (
                <div
                  key={index}
                  className={cn(
                    "relative rounded-lg border p-4 transition-all",
                    !hasAnswered && "hover:bg-accent",
                    status === 'correct' && "border-green-600 bg-green-50",
                    status === 'incorrect' && "border-red-600 bg-red-50",
                    hasAnswered && status === 'default' && "opacity-60"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value={option}
                      id={`option-${index}`}
                      className={cn(
                        status === 'correct' && "border-green-600",
                        status === 'incorrect' && "border-red-600"
                      )}
                    />
                    <Label
                      htmlFor={`option-${index}`}
                      className={cn(
                        "flex-1 cursor-pointer font-normal",
                        hasAnswered && "cursor-default"
                      )}
                    >
                      {option}
                    </Label>
                    {showResult && getAnswerIcon(option)}
                  </div>
                </div>
              )
            })}
          </div>
        </RadioGroup>

        {/* Explanation (shown after answering) */}
        {showResult && question.explanation && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-sm">
                <span className="font-semibold">Explanation:</span> {question.explanation}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {!hasAnswered && (
          <Button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className="w-full"
            size="lg"
          >
            Submit Answer
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
