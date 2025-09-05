import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { quizService } from '@/lib/services/quiz.service';
import type { QuizSubmissionRequest } from '@/types/quiz';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Parse request body
    const body: QuizSubmissionRequest = await request.json();
    
    // Validate request
    if (!body.sessionId || !body.answers || !Array.isArray(body.answers)) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, answers' },
        { status: 400 }
      );
    }

    if (typeof body.timeSpent !== 'number' || body.timeSpent < 0) {
      return NextResponse.json(
        { error: 'Invalid timeSpent value' },
        { status: 400 }
      );
    }

    // Submit quiz
    const result = await quizService.submitQuiz(userId, body);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    
    if (error instanceof Error && error.message === 'Quiz session not found') {
      return NextResponse.json(
        { error: 'Quiz session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
