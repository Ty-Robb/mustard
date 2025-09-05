import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { PaymentService } from '@/lib/services/payment.service';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user (admin only for analysis)
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
      
      // TODO: Add admin check here
      // For now, we'll allow any authenticated user to view analysis
    } catch (authError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    // Get pricing analysis
    try {
      const analysis = await PaymentService.analyzePricing(courseId || undefined);
      
      // Get additional insights
      const { getDatabase } = await import('@/lib/mongodb');
      const db = await getDatabase();
      
      // Get survey count by date for trend analysis
      const surveyTrend = await db.collection('pricing_surveys')
        .aggregate([
          {
            $match: courseId ? { courseId } : { courseId: { $exists: false } }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              count: { $sum: 1 },
              avgTooExpensive: { $avg: '$responses.tooExpensive' },
              avgExpensive: { $avg: '$responses.expensive' },
              avgCheap: { $avg: '$responses.cheap' },
              avgTooCheap: { $avg: '$responses.tooCheap' }
            }
          },
          {
            $sort: { _id: 1 }
          },
          {
            $limit: 30 // Last 30 days
          }
        ])
        .toArray();

      // Get demographic breakdown if available
      const demographicBreakdown = await db.collection('pricing_surveys')
        .aggregate([
          {
            $match: courseId ? { courseId } : { courseId: { $exists: false } }
          },
          {
            $group: {
              _id: '$metadata.userType',
              count: { $sum: 1 },
              avgOptimalPrice: { $avg: '$responses.expensive' }
            }
          }
        ])
        .toArray();

      return NextResponse.json({
        ...analysis,
        insights: {
          surveyTrend,
          demographicBreakdown,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (analysisError: any) {
      if (analysisError.message?.includes('Insufficient survey data')) {
        return NextResponse.json(
          { 
            error: 'Insufficient data',
            message: 'At least 10 survey responses are required for analysis',
            currentCount: 0 // TODO: Get actual count
          },
          { status: 400 }
        );
      }
      throw analysisError;
    }
  } catch (error) {
    console.error('Error getting pricing analysis:', error);
    return NextResponse.json(
      { error: 'Failed to get pricing analysis' },
      { status: 500 }
    );
  }
}

// POST: Trigger manual price update based on analysis
export async function POST(request: NextRequest) {
  try {
    // Authenticate user (admin only)
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
      
      // TODO: Add admin check here
    } catch (authError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId, enableDynamicPricing, algorithm = 'van_westendorp' } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const { getDatabase } = await import('@/lib/mongodb');
    const db = await getDatabase();

    // Update course pricing settings
    await db.collection('course_prices').updateOne(
      { courseId },
      {
        $set: {
          'dynamicPricing.enabled': enableDynamicPricing,
          'dynamicPricing.algorithm': algorithm,
          'dynamicPricing.lastAdjusted': new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    // If enabling dynamic pricing, trigger immediate analysis
    if (enableDynamicPricing) {
      try {
        const analysis = await PaymentService.analyzePricing(courseId);
        
        return NextResponse.json({
          success: true,
          message: 'Dynamic pricing enabled',
          analysis: {
            recommendedPrice: analysis.recommendedPrice,
            confidence: analysis.confidence,
            priceRange: analysis.analysis.acceptablePriceRange
          }
        });
      } catch (analysisError) {
        // Dynamic pricing enabled but analysis failed
        return NextResponse.json({
          success: true,
          message: 'Dynamic pricing enabled, but analysis pending more data',
          requiresMoreData: true
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing settings updated'
    });
  } catch (error) {
    console.error('Error updating pricing settings:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing settings' },
      { status: 500 }
    );
  }
}
