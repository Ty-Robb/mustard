import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { Payment } from '@repo/payments/server';

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

    // Get database connection
    const db = await getDatabase();
    
    // Fetch user's payment history
    const payments = await db.collection<Payment>('payments')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    // Enrich with course names
    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        if (payment.courseId) {
          const courseIds = payment.courseId.split(',');
          const courses = await db.collection('courses')
            .find({ _id: { $in: courseIds.map(id => new ObjectId(id)) } })
            .toArray();
          
          const courseNames = courses.map(c => c.title).join(', ');
          
          return {
            ...payment,
            courseName: courseNames
          };
        }
        return payment;
      })
    );

    return NextResponse.json({
      payments: enrichedPayments
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}
