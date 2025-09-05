import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { activityService } from '@/lib/services/activity.service';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let stats;
    
    if (startDateParam && endDateParam) {
      // Get stats for specific date range
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      stats = await activityService.getActivityStatsByDateRange(userId, startDate, endDate);
    } else {
      // Get all-time stats
      stats = await activityService.getActivityStats(userId);
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity stats' },
      { status: 500 }
    );
  }
}
