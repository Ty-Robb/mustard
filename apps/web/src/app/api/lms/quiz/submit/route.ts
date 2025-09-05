import { NextRequest, NextResponse } from 'next/server';
import { getLMSService } from '@/lib/services/lms.service';
import { adminAuth } from '@/lib/firebase-admin';

// POST: Submit a quiz attempt
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { stepId, questions, answers, score, passed, timeSpent } = await request.json();
    
    if (!stepId || !questions || !answers) {
      return NextResponse.json({ 
        error: 'Missing required fields: stepId, questions, answers' 
      }, { status: 400 });
    }

    const lmsService = getLMSService(userId);
    const attempt = await lmsService.submitQuizAttempt(stepId, {
      stepId,
      userId,
      questions,
      answers,
      score,
      passed,
      attemptedAt: new Date(),
      timeSpent: timeSpent || 0,
    });

    return NextResponse.json({ attempt });
  } catch (error: any) {
    console.error('[LMS Quiz API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
