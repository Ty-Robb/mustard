'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { QuizSession, Achievement } from '@/types/quiz'
import { Trophy, Target, Clock, Flame, Star, RotateCcw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface QuizResultsProps {
  session: QuizSession
  newAchievements?: Achievement[]
  streakUpdate?: {
    current: number
    isNew: boolean
  }
  leaderboardRank?: number
  onRetry?: () => void
}

export function QuizResults({
  session,
  newAchievements = [],
  streakUpdate,
  leaderboardRank,
  onRetry
}: QuizResultsProps) {
  const router = useRouter()
  
  const percentage = Math.round((session.score / session.maxScore) * 100)
  const correctAnswers = session.questions.filter(q => q.isCorrect).length
  const totalQuestions = session.questions.length
  
  // Calculate time taken
  const timeTaken = session.duration || 0
  const minutes = Math.floor(timeTaken / 60)
  const seconds = timeTaken % 60
  
  // Determine performance level
  const getPerformanceLevel = () => {
    if (percentage >= 90) return { label: 'Excellent!', color: 'text-green-600' }
    if (percentage >= 70) return { label: 'Good Job!', color: 'text-blue-600' }
    if (percentage >= 50) return { label: 'Keep Practicing!', color: 'text-yellow-600' }
    return { label: 'Try Again!', color: 'text-red-600' }
  }
  
  const performance = getPerformanceLevel()

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Main Results Card */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className={cn("text-3xl font-bold", performance.color)}>
            {performance.label}
          </CardTitle>
          <CardDescription>
            Quiz completed on {session.reference || 'General Bible Knowledge'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="text-center space-y-4">
            <div className="text-5xl font-bold">
              {percentage}%
            </div>
            <Progress value={percentage} className="h-4" />
            <p className="text-muted-foreground">
              {correctAnswers} out of {totalQuestions} questions correct
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <Card className="border-muted">
              <CardContent className="pt-6 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-semibold">{session.score}</div>
                <p className="text-sm text-muted-foreground">Points Earned</p>
              </CardContent>
            </Card>
            
            <Card className="border-muted">
              <CardContent className="pt-6 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-semibold">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </div>
                <p className="text-sm text-muted-foreground">Time Taken</p>
              </CardContent>
            </Card>
            
            <Card className="border-muted">
              <CardContent className="pt-6 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-semibold">
                  {leaderboardRank ? `#${leaderboardRank}` : '-'}
                </div>
                <p className="text-sm text-muted-foreground">Rank</p>
              </CardContent>
            </Card>
          </div>

          {/* Streak Update */}
          {streakUpdate && (
            <Card className={cn(
              "border-2",
              streakUpdate.isNew ? "border-orange-500 bg-orange-50" : "border-muted"
            )}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Flame className={cn(
                      "h-8 w-8",
                      streakUpdate.isNew ? "text-orange-500" : "text-muted-foreground"
                    )} />
                    <div>
                      <p className="font-semibold">
                        {streakUpdate.isNew ? 'New Streak!' : 'Current Streak'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {streakUpdate.current} day{streakUpdate.current !== 1 ? 's' : ''} in a row
                      </p>
                    </div>
                  </div>
                  <Badge variant={streakUpdate.isNew ? "default" : "secondary"}>
                    {streakUpdate.current}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* New Achievements */}
          {newAchievements.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                New Achievements Unlocked!
              </h3>
              <div className="space-y-2">
                {newAchievements.map((achievement) => (
                  <Card key={achievement.id} className="border-yellow-500 bg-yellow-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <p className="font-semibold">{achievement.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Question Review */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Question Review</h3>
            <div className="space-y-2">
              {session.questions.map((question, index) => (
                <div
                  key={question.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    question.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  )}
                >
                  <span className="text-sm">
                    Question {index + 1}: {question.question.substring(0, 50)}...
                  </span>
                  <Badge variant={question.isCorrect ? "default" : "destructive"}>
                    {question.isCorrect ? 'Correct' : 'Incorrect'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            <Button
              onClick={() => router.push('/quiz')}
              className="flex-1"
            >
              <Trophy className="mr-2 h-4 w-4" />
              New Quiz
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
