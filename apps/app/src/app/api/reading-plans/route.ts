import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { readingPlanService } from '@/lib/services/reading-plan.service';

// GET /api/reading-plans - Get all reading plans for the authenticated user
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
    const searchParams = request.nextUrl.searchParams;
    const includePublic = searchParams.get('includePublic') === 'true';

    // Get user's reading plans
    const userPlans = await readingPlanService.getUserReadingPlans(userId);

    // Optionally include popular public plans
    let publicPlans: any[] = [];
    if (includePublic) {
      publicPlans = await readingPlanService.getPopularReadingPlans();
    }

    return NextResponse.json({
      userPlans,
      publicPlans,
    });
  } catch (error) {
    console.error('Error fetching reading plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reading plans' },
      { status: 500 }
    );
  }
}

// POST /api/reading-plans - Create a new reading plan
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
    const body = await request.json();
    const { name, description, duration, isPublic, entries, tags, groupId } = body;

    // Validate required fields
    if (!name || !entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: 'Name and entries are required' },
        { status: 400 }
      );
    }

    // Validate entries structure - support both new and legacy formats
    for (const entry of entries) {
      // New format validation
      if (entry.day !== undefined && entry.passages !== undefined) {
        if (!Array.isArray(entry.passages)) {
          return NextResponse.json(
            { error: 'Each entry must have passages as an array' },
            { status: 400 }
          );
        }
      } 
      // Legacy format validation
      else if (!entry.reference || !entry.parsedReference) {
        return NextResponse.json(
          { error: 'Each entry must have either (day and passages) or (reference and parsedReference)' },
          { status: 400 }
        );
      }
    }

    // Create the reading plan
    const newPlan = await readingPlanService.createReadingPlan(userId, {
      name,
      description,
      duration,
      isPublic,
      entries,
      tags,
      groupId,
    });

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating reading plan:', error);
    return NextResponse.json(
      { error: 'Failed to create reading plan' },
      { status: 500 }
    );
  }
}
