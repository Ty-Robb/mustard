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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Get user's quiz history
    const history = await quizService.getUserQuizHistory(userId, limit);

    return NextResponse.json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz history' },
      { status: 500 }
    );
  }
}
