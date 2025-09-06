import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { 
  QuizType, 
  QuizDifficulty, 
  QuizQuestion, 
  QuizSession, 
  UserQuizStats,
  QuizGenerationRequest,
  QuizSubmissionRequest,
  Achievement
} from '@/types/quiz';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export class QuizService {
  private static instance: QuizService;

  private constructor() {}

  static getInstance(): QuizService {
    if (!QuizService.instance) {
      QuizService.instance = new QuizService();
    }
    return QuizService.instance;
  }

  /**
   * Generate quiz questions using AI
   */
  async generateQuiz(
    userId: string,
    request: QuizGenerationRequest,
    passageText?: string
  ): Promise<{ sessionId: string; questions: QuizQuestion[] }> {
    try {
      // Generate questions using AI
      const questions = await this.generateQuestionsWithAI(
        request.type,
        request.difficulty,
        request.questionCount,
        request.reference,
        passageText
      );

      // Create quiz session
      const session = await this.createQuizSession(userId, request, questions);

      return {
        sessionId: session._id!.toString(),
        questions: questions.map(q => {
          const { correctAnswer, explanation, ...questionWithoutAnswers } = q;
          return {
            ...questionWithoutAnswers,
            correctAnswer: '' // Include empty correctAnswer to satisfy type
          } as QuizQuestion;
        })
      };
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw new Error('Failed to generate quiz');
    }
  }

  /**
   * Submit quiz answers and calculate results
   */
  async submitQuiz(
    userId: string,
    submission: QuizSubmissionRequest
  ): Promise<{
    score: number;
    maxScore: number;
    correctAnswers: number;
    totalQuestions: number;
    questions: QuizQuestion[];
    newAchievements?: Achievement[];
    streakUpdate?: { current: number; isNew: boolean };
  }> {
    try {
      const db = await getDatabase();
      
      // Get quiz session
      const session = await db.collection<QuizSession>('quizSessions').findOne({
        _id: submission.sessionId,
        userId
      } as any);

      if (!session) {
        throw new Error('Quiz session not found');
      }

      // Calculate score
      let score = 0;
      let correctAnswers = 0;
      const maxScore = session.questions.reduce((sum: number, q: QuizQuestion) => sum + q.points, 0);

      // Process answers
      const questionsWithResults = session.questions.map((question: QuizQuestion) => {
        const userAnswer = submission.answers.find(a => a.questionId === question.id);
        
        if (userAnswer) {
          const isCorrect = this.checkAnswer(question, userAnswer.answer);
          if (isCorrect) {
            score += question.points;
            correctAnswers++;
          }
          
          return {
            ...question,
            userAnswer: userAnswer.answer,
            isCorrect
          };
        }
        
        return {
          ...question,
          userAnswer: undefined,
          isCorrect: false
        };
      });

      // Update session with results
      await db.collection<QuizSession>('quizSessions').updateOne(
        { _id: submission.sessionId } as any,
        {
          $set: {
            questions: questionsWithResults,
            score,
            timeCompleted: new Date(),
            duration: submission.timeSpent
          }
        }
      );

      // Update user stats
      const { newAchievements, streakUpdate } = await this.updateUserStats(
        userId,
        session.quizType,
        score,
        maxScore,
        correctAnswers,
        questionsWithResults.length
      );

      return {
        score,
        maxScore,
        correctAnswers,
        totalQuestions: questionsWithResults.length,
        questions: questionsWithResults,
        newAchievements,
        streakUpdate
      };
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw new Error('Failed to submit quiz');
    }
  }

  /**
   * Generate questions using Gemini AI
   */
  private async generateQuestionsWithAI(
    type: QuizType,
    difficulty: QuizDifficulty,
    questionCount: number,
    reference?: string,
    passageText?: string
  ): Promise<QuizQuestion[]> {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = this.buildQuizPrompt(type, difficulty, questionCount, reference, passageText);

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and format questions
      return parsed.questions.map((q: any, index: number) => ({
        id: `q${index + 1}`,
        type: q.type || 'multiple-choice',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        reference: q.reference,
        difficulty: this.getDifficultyNumber(difficulty),
        points: this.calculatePoints(q.type, difficulty)
      }));
    } catch (error) {
      console.error('Error generating questions with AI:', error);
      throw new Error('Failed to generate questions');
    }
  }

  /**
   * Build AI prompt for quiz generation
   */
  private buildQuizPrompt(
    type: QuizType,
    difficulty: QuizDifficulty,
    questionCount: number,
    reference?: string,
    passageText?: string
  ): string {
    const typeDescriptions = {
      passage: 'comprehension of the specific Bible passage',
      book: 'knowledge about Bible books, authors, and themes',
      character: 'Biblical characters and their stories',
      timeline: 'Biblical events and chronology',
      theology: 'Biblical teachings and doctrine',
      memory: 'verse memorization and recall'
    };

    const difficultyGuidelines = {
      easy: 'Basic recall and simple comprehension questions',
      medium: 'Deeper understanding and application questions',
      hard: 'Complex analysis and theological interpretation questions'
    };

    let contextSection = '';
    if (passageText) {
      contextSection = `\nBible Passage:\n${passageText}\n`;
    } else if (reference) {
      contextSection = `\nBible Reference: ${reference}\n`;
    }

    return `Generate ${questionCount} Bible quiz questions testing ${typeDescriptions[type]}.
${contextSection}
Difficulty Level: ${difficulty} - ${difficultyGuidelines[difficulty]}

Requirements:
1. Create a mix of question types (multiple-choice, true/false, fill-in-the-blank)
2. Questions should be clear and unambiguous
3. Multiple choice options should be plausible but with only one correct answer
4. Include brief explanations for each answer
5. Reference specific verses when applicable
6. For fill-in-the-blank questions, the blank should be a key word or phrase

Format your response as a JSON object with this exact structure:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Question text here",
      "options": ["a) Option 1", "b) Option 2", "c) Option 3", "d) Option 4"],
      "correctAnswer": "a",
      "explanation": "Explanation of why this is correct",
      "reference": "Book Chapter:Verse"
    },
    {
      "type": "true-false",
      "question": "Statement that is either true or false",
      "correctAnswer": "true",
      "explanation": "Explanation of why this is true/false",
      "reference": "Book Chapter:Verse"
    },
    {
      "type": "fill-blank",
      "question": "Sentence with _____ for the blank",
      "correctAnswer": "word or phrase",
      "explanation": "Explanation of the answer",
      "reference": "Book Chapter:Verse"
    }
  ]
}

Ensure the JSON is valid and follows this structure exactly.`;
  }

  /**
   * Check if user's answer is correct
   */
  private checkAnswer(question: QuizQuestion, userAnswer: string | string[]): boolean {
    const normalizeAnswer = (answer: string) => answer.toLowerCase().trim();

    if (question.type === 'multiple-choice') {
      return normalizeAnswer(userAnswer as string) === normalizeAnswer(question.correctAnswer as string);
    } else if (question.type === 'true-false') {
      return normalizeAnswer(userAnswer as string) === normalizeAnswer(question.correctAnswer as string);
    } else if (question.type === 'fill-blank') {
      // For fill-in-the-blank, be more flexible with matching
      const correct = normalizeAnswer(question.correctAnswer as string);
      const user = normalizeAnswer(userAnswer as string);
      
      // Check for exact match or if user answer contains the correct answer
      return user === correct || user.includes(correct) || correct.includes(user);
    }

    return false;
  }

  /**
   * Create a new quiz session
   */
  private async createQuizSession(
    userId: string,
    request: QuizGenerationRequest,
    questions: QuizQuestion[]
  ): Promise<QuizSession> {
    const db = await getDatabase();

    const session: Omit<QuizSession, '_id'> = {
      userId,
      quizType: request.type,
      difficulty: request.difficulty,
      reference: request.reference,
      questions,
      score: 0,
      maxScore: questions.reduce((sum: number, q: QuizQuestion) => sum + q.points, 0),
      timeStarted: new Date(),
      streak: 0,
      createdAt: new Date()
    };

    const result = await db.collection<QuizSession>('quizSessions').insertOne(session as any);
    
    return {
      ...session,
      _id: result.insertedId.toString()
    };
  }

  /**
   * Update user quiz statistics
   */
  private async updateUserStats(
    userId: string,
    quizType: QuizType,
    score: number,
    maxScore: number,
    correctAnswers: number,
    totalQuestions: number
  ): Promise<{
    newAchievements?: Achievement[];
    streakUpdate?: { current: number; isNew: boolean };
  }> {
    const db = await getDatabase();

    // Get current stats
    let stats = await db.collection<UserQuizStats>('userQuizStats').findOne({ userId });

    const currentStats = stats || {
      userId,
      totalQuizzes: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      currentStreak: 0,
      longestStreak: 0,
      categoryStats: {} as Record<string, any>,
      achievements: [],
      lastQuizDate: undefined,
      updatedAt: new Date()
    };

    // Update streak
    const today = new Date().toDateString();
    const lastQuizDate = currentStats.lastQuizDate ? new Date(currentStats.lastQuizDate).toDateString() : null;
    
    let newStreak = currentStats.currentStreak;
    let isNewStreak = false;

    if (lastQuizDate === today) {
      // Already played today, streak continues
    } else if (lastQuizDate === new Date(Date.now() - 86400000).toDateString()) {
      // Played yesterday, increment streak
      newStreak++;
      isNewStreak = true;
    } else {
      // Streak broken, start new
      newStreak = 1;
      isNewStreak = true;
    }

    // Update category stats
    const categoryStatsObj = currentStats.categoryStats as Record<string, any>;
    if (!categoryStatsObj[quizType]) {
      categoryStatsObj[quizType] = {
        quizzes: 0,
        questions: 0,
        correct: 0,
        avgScore: 0
      };
    }

    const categoryStats = categoryStatsObj[quizType];
    const newAvgScore = 
      (categoryStats.avgScore * categoryStats.quizzes + (score / maxScore * 100)) / 
      (categoryStats.quizzes + 1);

    // Update stats
    await db.collection<UserQuizStats>('userQuizStats').updateOne(
      { userId },
      {
        $set: {
          totalQuizzes: currentStats.totalQuizzes + 1,
          totalQuestions: currentStats.totalQuestions + totalQuestions,
          correctAnswers: currentStats.correctAnswers + correctAnswers,
          currentStreak: newStreak,
          longestStreak: Math.max(currentStats.longestStreak, newStreak),
          [`categoryStats.${quizType}`]: {
            quizzes: categoryStats.quizzes + 1,
            questions: categoryStats.questions + totalQuestions,
            correct: categoryStats.correct + correctAnswers,
            avgScore: newAvgScore
          },
          lastQuizDate: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    // Check for new achievements
    const newAchievements = await this.checkAchievements(
      userId,
      currentStats.totalQuizzes + 1,
      currentStats.totalQuestions + totalQuestions,
      newStreak,
      score === maxScore
    );

    return {
      newAchievements: newAchievements.length > 0 ? newAchievements : undefined,
      streakUpdate: isNewStreak ? { current: newStreak, isNew: true } : undefined
    };
  }

  /**
   * Check and award achievements
   */
  private async checkAchievements(
    userId: string,
    totalQuizzes: number,
    totalQuestions: number,
    currentStreak: number,
    isPerfectScore: boolean
  ): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];
    const db = await getDatabase();

    // Define achievement criteria
    const achievementCriteria = [
      { id: 'first-quiz', name: 'First Steps', description: 'Complete your first quiz', check: totalQuizzes === 1 },
      { id: 'quiz-10', name: 'Quiz Enthusiast', description: 'Complete 10 quizzes', check: totalQuizzes === 10 },
      { id: 'quiz-50', name: 'Quiz Master', description: 'Complete 50 quizzes', check: totalQuizzes === 50 },
      { id: 'questions-100', name: 'Century', description: 'Answer 100 questions', check: totalQuestions >= 100 },
      { id: 'questions-500', name: 'Scholar', description: 'Answer 500 questions', check: totalQuestions >= 500 },
      { id: 'streak-7', name: 'Week Warrior', description: '7-day quiz streak', check: currentStreak >= 7 },
      { id: 'streak-30', name: 'Monthly Master', description: '30-day quiz streak', check: currentStreak >= 30 },
      { id: 'perfect-score', name: 'Perfectionist', description: 'Get a perfect score', check: isPerfectScore }
    ];

    // Get user's existing achievements
    const userStats = await db.collection<UserQuizStats>('userQuizStats').findOne({ userId });
    const existingAchievementIds = userStats?.achievements.map((a: Achievement) => a.id) || [];

    // Check for new achievements
    for (const criteria of achievementCriteria) {
      if (criteria.check && !existingAchievementIds.includes(criteria.id)) {
        const achievement: Achievement = {
          id: criteria.id,
          name: criteria.name,
          description: criteria.description,
          icon: '🏆', // You can customize icons per achievement
          unlockedAt: new Date()
        };
        
        newAchievements.push(achievement);
        
        // Add to user's achievements
        await db.collection<UserQuizStats>('userQuizStats').updateOne(
          { userId },
          { $push: { achievements: achievement } }
        );
      }
    }

    return newAchievements;
  }

  /**
   * Get difficulty as number
   */
  private getDifficultyNumber(difficulty: QuizDifficulty): number {
    const difficultyMap = { easy: 1, medium: 2, hard: 3 };
    return difficultyMap[difficulty];
  }

  /**
   * Calculate points based on question type and difficulty
   */
  private calculatePoints(type: string, difficulty: QuizDifficulty): number {
    const basePoints = {
      'multiple-choice': 10,
      'true-false': 5,
      'fill-blank': 15,
      'matching': 20
    };

    const difficultyMultiplier = {
      easy: 1,
      medium: 1.5,
      hard: 2
    };

    const base = basePoints[type as keyof typeof basePoints] || 10;
    return Math.round(base * difficultyMultiplier[difficulty]);
  }

  /**
   * Get user's quiz history
   */
  async getUserQuizHistory(userId: string, limit: number = 20): Promise<QuizSession[]> {
    const db = await getDatabase();
    
    return await db.collection<QuizSession>('quizSessions')
      .find({ userId, timeCompleted: { $exists: true } })
      .sort({ timeCompleted: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get user's quiz statistics
   */
  async getUserStats(userId: string): Promise<UserQuizStats | null> {
    const db = await getDatabase();
    return await db.collection<UserQuizStats>('userQuizStats').findOne({ userId });
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    type: 'daily' | 'weekly' | 'all-time',
    category?: QuizType,
    limit: number = 10
  ): Promise<any[]> {
    const db = await getDatabase();
    
    // Calculate date range
    const now = new Date();
    let dateFilter = {};
    
    if (type === 'daily') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      dateFilter = { createdAt: { $gte: startOfDay } };
    } else if (type === 'weekly') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: startOfWeek } };
    }

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: { ...dateFilter, ...(category ? { quizType: category } : {}) } },
      {
        $group: {
          _id: '$userId',
          totalScore: { $sum: '$score' },
          quizCount: { $sum: 1 },
          avgScore: { $avg: { $divide: ['$score', '$maxScore'] } }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: limit }
    ];

    const results = await db.collection<QuizSession>('quizSessions')
      .aggregate(pipeline)
      .toArray();

    // Fetch user details
    // Note: You'll need to implement user fetching based on your auth system
    return results.map((result: any, index: number) => ({
      rank: index + 1,
      userId: result._id,
      score: result.totalScore,
      quizCount: result.quizCount,
      avgScore: Math.round(result.avgScore * 100)
    }));
  }
}

export const quizService = QuizService.getInstance();
