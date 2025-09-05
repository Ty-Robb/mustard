import { NextRequest, NextResponse } from 'next/server';
import { getLMSService } from '@/lib/services/lms.service';
import { adminAuth } from '@/lib/firebase-admin';

// GET: Get user's progress for a specific course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const lmsService = getLMSService(userId);
    const progress = await lmsService.getUserProgress(courseId);

    if (!progress) {
      return NextResponse.json({ progress: null });
    }

    return NextResponse.json({ progress });
  } catch (error: any) {
    console.error('[LMS Progress API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update progress (complete a step)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { stepId, submission, timeSpent } = await request.json();
    
    if (!stepId) {
      return NextResponse.json({ error: 'Step ID required' }, { status: 400 });
    }

    const lmsService = getLMSService(userId);
    const updatedProgress = await lmsService.completeStep(
      courseId,
      stepId,
      submission,
      timeSpent || 0
    );

    return NextResponse.json({ progress: updatedProgress });
  } catch (error: any) {
    console.error('[LMS Progress API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
