import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { readingPlanService } from '@/lib/services/reading-plan.service';

// GET /api/reading-plans/[planId] - Get a specific reading plan
export async function GET(
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

    // Get the reading plan
    const plan = await readingPlanService.getReadingPlan(planId, userId);

    if (!plan) {
      return NextResponse.json(
        { error: 'Reading plan not found' },
        { status: 404 }
      );
    }

    // Get progress information
    const progress = await readingPlanService.getReadingPlanProgress(planId, userId);

    return NextResponse.json({
      plan,
      progress,
    });
  } catch (error) {
    console.error('Error fetching reading plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reading plan' },
      { status: 500 }
    );
  }
}

// PATCH /api/reading-plans/[planId] - Update a reading plan
export async function PATCH(
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
    const body = await request.json();

    // Extract allowed update fields
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.isPublic !== undefined) updates.isPublic = body.isPublic;

    // Update the reading plan
    const success = await readingPlanService.updateReadingPlan(
      planId,
      userId,
      updates
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update reading plan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating reading plan:', error);
    return NextResponse.json(
      { error: 'Failed to update reading plan' },
      { status: 500 }
    );
  }
}

// DELETE /api/reading-plans/[planId] - Delete a reading plan
export async function DELETE(
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

    // Delete the reading plan
    const success = await readingPlanService.deleteReadingPlan(planId, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete reading plan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reading plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete reading plan' },
      { status: 500 }
    );
  }
}
