import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { readingPlanService } from '@/lib/services/reading-plan.service';

// PATCH /api/reading-plans/[planId]/entries/[entryIndex] - Update an entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string; entryIndex: string }> }
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

    const { planId, entryIndex } = await params;
    const index = parseInt(entryIndex, 10);

    if (isNaN(index) || index < 0) {
      return NextResponse.json(
        { error: 'Invalid entry index' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, notes } = body;

    let success = false;

    switch (action) {
      case 'complete':
        success = await readingPlanService.markEntryCompleted(
          planId,
          userId,
          index,
          notes
        );
        break;

      case 'incomplete':
        success = await readingPlanService.markEntryIncomplete(
          planId,
          userId,
          index
        );
        break;

      case 'updateNotes':
        if (notes === undefined) {
          return NextResponse.json(
            { error: 'Notes are required for updateNotes action' },
            { status: 400 }
          );
        }
        success = await readingPlanService.updateEntryNotes(
          planId,
          userId,
          index,
          notes
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be complete, incomplete, or updateNotes' },
          { status: 400 }
        );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update entry' },
        { status: 404 }
      );
    }

    // Return updated progress
    const progress = await readingPlanService.getReadingPlanProgress(planId, userId);

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error('Error updating reading plan entry:', error);
    return NextResponse.json(
      { error: 'Failed to update reading plan entry' },
      { status: 500 }
    );
  }
}
