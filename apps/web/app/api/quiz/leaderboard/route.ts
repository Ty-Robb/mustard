import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { quizService } from '@/lib/services/quiz.service';
import type { QuizType } from '@/types/quiz';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'daily' | 'weekly' | 'all-time' || 'all-time';
    const category = searchParams.get('category') as QuizType | null;
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate parameters
    if (!['daily', 'weekly', 'all-time'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be daily, weekly, or all-time' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    if (category && !['passage', 'book', 'character', 'timeline', 'theology', 'memory'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Get leaderboard
    const leaderboard = await quizService.getLeaderboard(
      type,
      category || undefined,
      limit
    );

    return NextResponse.json({
      success: true,
      type,
      category,
      leaderboard,
      count: leaderboard.length
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
