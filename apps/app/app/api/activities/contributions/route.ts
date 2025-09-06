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
    
    // Check for date range parameters first
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    let contributionData;
    
    if (startDateParam && endDateParam) {
      // Use date range if provided
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      contributionData = await activityService.getContributionDataByDateRange(userId, startDate, endDate);
    } else {
      // Fall back to days parameter for backward compatibility
      const days = parseInt(searchParams.get('days') || '365', 10);
      contributionData = await activityService.getContributionData(userId, days);
    }

    return NextResponse.json(contributionData);
  } catch (error) {
    console.error('Error fetching contribution data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contribution data' },
      { status: 500 }
    );
  }
}
