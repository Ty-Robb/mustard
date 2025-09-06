import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { readingPlanService } from '@/lib/services/reading-plan.service';

// POST /api/reading-plans/[planId]/clone - Clone a public reading plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { planId } = await params;

    // Parse request body for optional new name
    const body = await request.json();
    const { name } = body;

    // Clone the reading plan
    const clonedPlan = await readingPlanService.cloneReadingPlan(
      planId,
      userId,
      name
    );

    if (!clonedPlan) {
      return NextResponse.json(
        { error: 'Reading plan not found or not public' },
        { status: 404 }
      );
    }

    return NextResponse.json(clonedPlan, { status: 201 });
  } catch (error) {
    console.error('Error cloning reading plan:', error);
    return NextResponse.json(
      { error: 'Failed to clone reading plan' },
      { status: 500 }
    );
  }
}
