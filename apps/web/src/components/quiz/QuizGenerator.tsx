'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Loader2, Brain, BookOpen, Users, Trophy } from 'lucide-react'
import { QuizType, QuizDifficulty } from '@/types/quiz'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

export function QuizGenerator() {
  const router = useRouter()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  
  const [quizParams, setQuizParams] = useState({
    type: 'general' as QuizType,
    difficulty: 'medium' as QuizDifficulty,
    questionCount: 10,
    bibleReference: ''
  })

  const handleGenerateQuiz = async () => {
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizParams),
      })

      if (!response.ok) {
        throw new Error('Failed to generate quiz')
      }

      const data = await response.json()
      
      // Store session in localStorage for the quiz taking page
      if (data.session) {
        localStorage.setItem(`quiz_session_${data.sessionId}`, JSON.stringify(data.session))
      }
      
      // Navigate to quiz taking page with the quiz session ID
      router.push(`/quiz/${data.sessionId}`)
    } catch (error) {
      console.error('Error generating quiz:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate quiz. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-6 w-6" />
          Generate Bible Quiz
        </CardTitle>
        <CardDescription>
          Customize your quiz experience by selecting the type, difficulty, and number of questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quiz Type Selection */}
        <div className="space-y-3">
          <Label>Quiz Type</Label>
          <RadioGroup
            value={quizParams.type}
            onValueChange={(value: string) => setQuizParams({ ...quizParams, type: value as QuizType })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="general" id="general" />
              <Label htmlFor="general" className="font-normal cursor-pointer">
                General Knowledge - Test your overall Bible knowledge
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="verse" id="verse" />
              <Label htmlFor="verse" className="font-normal cursor-pointer">
                Verse Identification - Identify who said what or where verses are from
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="character" id="character" />
              <Label htmlFor="character" className="font-normal cursor-pointer">
                Character Study - Questions about Biblical figures
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="theme" id="theme" />
              <Label htmlFor="theme" className="font-normal cursor-pointer">
                Thematic - Questions about Biblical themes and concepts
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="historical" id="historical" />
              <Label htmlFor="historical" className="font-normal cursor-pointer">
                Historical Context - Questions about historical events and timeline
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-3">
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <Select
            value={quizParams.difficulty}
            onValueChange={(value) => setQuizParams({ ...quizParams, difficulty: value as QuizDifficulty })}
          >
            <SelectTrigger id="difficulty">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy - Basic Bible knowledge</SelectItem>
              <SelectItem value="medium">Medium - Regular Bible reader</SelectItem>
              <SelectItem value="hard">Hard - Advanced Bible student</SelectItem>
              <SelectItem value="expert">Expert - Seminary level</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Question Count */}
        <div className="space-y-3">
          <Label htmlFor="questionCount">Number of Questions</Label>
          <Select
            value={quizParams.questionCount.toString()}
            onValueChange={(value) => setQuizParams({ ...quizParams, questionCount: parseInt(value) })}
          >
            <SelectTrigger id="questionCount">
              <SelectValue placeholder="Select number of questions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 Questions - Quick quiz</SelectItem>
              <SelectItem value="10">10 Questions - Standard quiz</SelectItem>
              <SelectItem value="15">15 Questions - Extended quiz</SelectItem>
              <SelectItem value="20">20 Questions - Challenge mode</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bible Reference (Optional) */}
        <div className="space-y-3">
          <Label htmlFor="bibleReference">
            Bible Reference (Optional)
            <span className="text-sm text-muted-foreground ml-2">
              e.g., "John 3", "Genesis 1-3", "Romans"
            </span>
          </Label>
          <Input
            id="bibleReference"
            placeholder="Enter a book, chapter, or verse range"
            value={quizParams.bibleReference}
            onChange={(e) => setQuizParams({ ...quizParams, bibleReference: e.target.value })}
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateQuiz}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Quiz...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Generate Quiz
            </>
          )}
        </Button>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <Card className="border-muted">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Learn as you play</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-muted">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-sm">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Earn achievements</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-muted">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Compete globally</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
