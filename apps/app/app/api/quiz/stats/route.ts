import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { quizService } from '@/lib/services/quiz.service';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user's quiz statistics
    const stats = await quizService.getUserStats(userId);

    if (!stats) {
      // Return default stats if user has no quiz history
      return NextResponse.json({
        success: true,
        stats: {
          userId,
          totalQuizzes: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          currentStreak: 0,
          longestStreak: 0,
          categoryStats: {},
          achievements: [],
          lastQuizDate: null,
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz statistics' },
      { status: 500 }
    );
  }
}
