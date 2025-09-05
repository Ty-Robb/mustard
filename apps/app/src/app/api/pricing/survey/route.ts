import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { PaymentService } from '@/lib/services/payment.service';
import { VanWestendorpResponses } from '@/types/payment';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let userId: string;
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (authError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { responses, courseId } = body;

    // Validate responses
    if (!responses || typeof responses !== 'object') {
      return NextResponse.json(
        { error: 'Invalid survey responses' },
        { status: 400 }
      );
    }

    const requiredFields = ['tooExpensive', 'expensive', 'cheap', 'tooCheap', 'currency'];
    for (const field of requiredFields) {
      if (!responses[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate price logic
    const { tooExpensive, expensive, cheap, tooCheap } = responses as VanWestendorpResponses;
    if (tooCheap >= cheap || cheap >= expensive || expensive >= tooExpensive) {
      return NextResponse.json(
        { error: 'Invalid price progression. Prices should increase from too cheap to too expensive.' },
        { status: 400 }
      );
    }

    // Save survey response
    await PaymentService.savePricingSurvey(
      userId,
      responses as VanWestendorpResponses,
      courseId
    );

    // Return success with potential incentive information
    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
      incentive: {
        type: 'discount',
        code: 'SURVEY10',
        value: 10,
        description: 'Use code SURVEY10 for 10% off your first course'
      }
    });
  } catch (error) {
    console.error('Error saving pricing survey:', error);
    return NextResponse.json(
      { error: 'Failed to save survey response' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let userId: string;
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (authError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    // Check if user has already completed survey for this course
    const { getDatabase } = await import('@/lib/mongodb');
    const db = await getDatabase();
    
    const existingSurvey = await db.collection('pricing_surveys').findOne({
      userId,
      ...(courseId ? { courseId } : { courseId: { $exists: false } })
    });

    return NextResponse.json({
      hasCompleted: !!existingSurvey,
      completedAt: existingSurvey?.createdAt
    });
  } catch (error) {
    console.error('Error checking survey status:', error);
    return NextResponse.json(
      { error: 'Failed to check survey status' },
      { status: 500 }
    );
  }
}
