'use client'

import { useState, useEffect } from 'react'
import { QuizGenerator } from '@/components/quiz/QuizGenerator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Brain, History, TrendingUp, Users, Flame } from 'lucide-react'
import { UserQuizStats, QuizSession, QuizLeaderboardEntry } from '@/types/quiz'
import { formatDistanceToNow } from 'date-fns'

export default function QuizHomePage() {
  const [stats, setStats] = useState<UserQuizStats | null>(null)
  const [recentQuizzes, setRecentQuizzes] = useState<QuizSession[]>([])
  const [leaderboard, setLeaderboard] = useState<QuizLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuizData()
    
    // Check for retry params
    const retryParams = localStorage.getItem('quiz_retry_params')
    if (retryParams) {
      // Clear retry params
      localStorage.removeItem('quiz_retry_params')
      // The QuizGenerator will handle the retry
    }
  }, [])

  const fetchQuizData = async () => {
    try {
      // Fetch user stats
      const statsResponse = await fetch('/api/quiz/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch recent quizzes
      const historyResponse = await fetch('/api/quiz/history?limit=5')
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setRecentQuizzes(historyData.sessions)
      }

      // Fetch leaderboard
      const leaderboardResponse = await fetch('/api/quiz/leaderboard?period=week&limit=10')
      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json()
        setLeaderboard(leaderboardData.entries)
      }
    } catch (error) {
      console.error('Error fetching quiz data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Bible Quiz</h1>
        <p className="text-muted-foreground">
          Test your Bible knowledge and compete with others
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Quizzes</p>
                  <p className="text-2xl font-bold">{stats.totalQuizzes}</p>
                </div>
                <Brain className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold">
                    {stats.totalQuestions > 0
                      ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold">{stats.currentStreak} days</p>
                </div>
                <Flame className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                  <p className="text-2xl font-bold">{stats.achievements.length}</p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="new-quiz" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new-quiz">New Quiz</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* New Quiz Tab */}
        <TabsContent value="new-quiz" className="space-y-4">
          <QuizGenerator />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Quizzes
              </CardTitle>
              <CardDescription>
                Your quiz history and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentQuizzes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No quizzes taken yet. Start your first quiz above!
                </p>
              ) : (
                <div className="space-y-3">
                  {recentQuizzes.map((quiz) => (
                    <Card key={quiz._id} className="border-muted">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {quiz.quizType.charAt(0).toUpperCase() + quiz.quizType.slice(1)} Quiz
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {quiz.reference || 'General'} • {quiz.difficulty}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(quiz.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              {Math.round((quiz.score / quiz.maxScore) * 100)}%
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {quiz.score}/{quiz.maxScore} points
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Weekly Leaderboard
              </CardTitle>
              <CardDescription>
                Top performers this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No leaderboard data available yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.userId}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`text-lg font-bold ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          index === 2 ? 'text-orange-600' :
                          'text-muted-foreground'
                        }`}>
                          #{entry.rank}
                        </div>
                        <div>
                          <p className="font-medium">{entry.userName}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.quizCount} quizzes
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{entry.score}</p>
                        <p className="text-sm text-muted-foreground">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
