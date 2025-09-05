import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { PaymentService } from '@/lib/services/payment.service';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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
    const type = searchParams.get('type') || 'all'; // all, payments, subscriptions
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await getDatabase();
    const response: any = {};

    // Get payment history
    if (type === 'all' || type === 'payments') {
      const payments = await PaymentService.getPaymentHistory(userId);
      
      // Enrich with course information
      const enrichedPayments = await Promise.all(
        payments.slice(offset, offset + limit).map(async (payment) => {
          if (payment.courseId) {
            const courseIds = payment.courseId.split(',');
            const courses = await db.collection('lmsCourses')
              .find({ id: { $in: courseIds } })
              .project({ id: 1, title: 1, thumbnail: 1 })
              .toArray();
            
            return {
              ...payment,
              courses: courses.map(c => ({
                id: c.id,
                title: c.title,
                thumbnail: c.thumbnail
              }))
            };
          }
          return payment;
        })
      );

      response.payments = {
        items: enrichedPayments,
        total: payments.length,
        hasMore: payments.length > offset + limit
      };
    }

    // Get subscription history
    if (type === 'all' || type === 'subscriptions') {
      const subscriptions = await db.collection('subscriptions')
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray();

      const totalSubs = await db.collection('subscriptions')
        .countDocuments({ userId });

      response.subscriptions = {
        items: subscriptions,
        total: totalSubs,
        hasMore: totalSubs > offset + limit
      };
    }

    // Get summary statistics
    if (type === 'all') {
      const stats = await db.collection('payments').aggregate([
        { $match: { userId, status: 'succeeded' } },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$amount' },
            paymentCount: { $sum: 1 },
            currencies: { $addToSet: '$currency' }
          }
        }
      ]).toArray();

      const activeSubscriptions = await db.collection('subscriptions')
        .countDocuments({ userId, status: 'active' });

      response.summary = {
        totalSpent: stats[0]?.totalSpent || 0,
        paymentCount: stats[0]?.paymentCount || 0,
        currencies: stats[0]?.currencies || [],
        activeSubscriptions
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}

// DELETE: Request refund
export async function DELETE(request: NextRequest) {
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
    const { paymentId, reason } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Verify payment belongs to user
    const db = await getDatabase();
    const payment = await db.collection('payments').findOne({
      id: paymentId,
      userId
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if payment is eligible for refund
    const daysSincePurchase = (Date.now() - new Date(payment.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePurchase > 30) {
      return NextResponse.json(
        { error: 'Refund period expired (30 days)' },
        { status: 400 }
      );
    }

    if (payment.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Only successful payments can be refunded' },
        { status: 400 }
      );
    }

    // Process refund through Stripe
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia' as any,
    });

    try {
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          userId,
          userReason: reason || 'No reason provided'
        }
      });

      // Update payment record
      await db.collection('payments').updateOne(
        { id: paymentId },
        {
          $set: {
            refundReason: reason,
            refundRequestedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      // Revoke course access if applicable
      if (payment.courseId) {
        const courseIds = payment.courseId.split(',');
        for (const courseId of courseIds) {
          // Remove from enrolled courses
          await db.collection('users').updateOne(
            { firebaseUid: userId },
            { $pull: { enrolledCourses: courseId } }
          );

          // Delete progress record
          await db.collection('user_progress').deleteOne({
            userId,
            courseId
          });
        }
      }

      return NextResponse.json({
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status
      });
    } catch (stripeError: any) {
      console.error('Stripe refund error:', stripeError);
      return NextResponse.json(
        { 
          error: 'Refund failed',
          message: stripeError.message 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
