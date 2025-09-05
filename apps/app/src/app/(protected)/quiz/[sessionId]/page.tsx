'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QuizQuestion } from '@/components/quiz/QuizQuestion'
import { QuizResults } from '@/components/quiz/QuizResults'
import { QuizSession, QuizQuestion as QuizQuestionType, Achievement } from '@/types/quiz'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function QuizTakingPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const sessionId = params.sessionId as string
  
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<QuizSession | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ questionId: string; answer: string }[]>([])
  const [showResults, setShowResults] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<{
    score: number
    maxScore: number
    correctAnswers: number
    totalQuestions: number
    newAchievements?: Achievement[]
    streakUpdate?: { current: number; isNew: boolean }
    leaderboardRank?: number
  } | null>(null)
  const [startTime, setStartTime] = useState<number>(Date.now())

  // Fetch quiz session on mount
  useEffect(() => {
    fetchQuizSession()
  }, [sessionId])

  const fetchQuizSession = async () => {
    try {
      // In a real app, you'd fetch the session from an API
      // For now, we'll get it from localStorage (set by the generate endpoint)
      const storedSession = localStorage.getItem(`quiz_session_${sessionId}`)
      if (storedSession) {
        const session = JSON.parse(storedSession)
        setSession(session)
        setStartTime(Date.now())
      } else {
        throw new Error('Quiz session not found')
      }
    } catch (error) {
      console.error('Error fetching quiz session:', error)
      toast({
        title: 'Error',
        description: 'Failed to load quiz. Please try again.',
        variant: 'destructive',
      })
      router.push('/quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (answer: string) => {
    if (!session) return

    const currentQuestion = session.questions[currentQuestionIndex]
    const newAnswers = [...answers, { questionId: currentQuestion.id, answer }]
    setAnswers(newAnswers)

    // Move to next question or submit quiz
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // All questions answered, submit quiz
      submitQuiz(newAnswers)
    }
  }

  const submitQuiz = async (finalAnswers: { questionId: string; answer: string }[]) => {
    if (!session) return

    const timeSpent = Math.floor((Date.now() - startTime) / 1000) // in seconds

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          answers: finalAnswers,
          timeSpent,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit quiz')
      }

      const result = await response.json()
      
      // Update session with results
      const updatedSession: QuizSession = {
        ...session,
        score: result.score,
        duration: timeSpent,
        questions: session.questions.map((q, index) => ({
          ...q,
          userAnswer: finalAnswers[index].answer,
          isCorrect: q.correctAnswer === finalAnswers[index].answer,
          timeSpent: Math.floor(timeSpent / session.questions.length), // Average time per question
        })),
      }
      
      setSession(updatedSession)
      setSubmissionResult(result)
      setShowResults(true)
      
      // Clear session from localStorage
      localStorage.removeItem(`quiz_session_${sessionId}`)
    } catch (error) {
      console.error('Error submitting quiz:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit quiz. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleRetry = () => {
    // Generate a new quiz with the same parameters
    if (session) {
      const quizParams = {
        type: session.quizType,
        difficulty: session.difficulty,
        questionCount: session.questions.length,
        bibleReference: session.reference || '',
      }
      
      // Store params and navigate to generator
      localStorage.setItem('quiz_retry_params', JSON.stringify(quizParams))
      router.push('/quiz')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Quiz not found</p>
      </div>
    )
  }

  if (showResults && submissionResult) {
    return (
      <div className="container mx-auto py-8 px-4">
        <QuizResults
          session={session}
          newAchievements={submissionResult.newAchievements}
          streakUpdate={submissionResult.streakUpdate}
          leaderboardRank={submissionResult.leaderboardRank}
          onRetry={handleRetry}
        />
      </div>
    )
  }

  const currentQuestion = session.questions[currentQuestionIndex]

  return (
    <div className="container mx-auto py-8 px-4">
      <QuizQuestion
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={session.questions.length}
        onAnswer={handleAnswer}
        timeLimit={30} // 30 seconds per question
      />
    </div>
  )
}
