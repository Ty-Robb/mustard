import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { 
  constructWebhookEvent, 
  extractPaymentSuccessData,
  extractSubscriptionData,
  type Payment,
  type Subscription
} from '@repo/payments/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = await constructWebhookEvent(body, signature);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract payment data
        const paymentData = extractPaymentSuccessData(session);
        
        // Update checkout session
        await db.collection('checkout_sessions').updateOne(
          { stripeSessionId: session.id },
          {
            $set: {
              status: 'completed',
              completedAt: new Date(),
            },
          }
        );

        // Create payment record
        const payment: Payment = {
          id: new ObjectId().toString(),
          userId: paymentData.userId,
          courseId: paymentData.courseIds.join(','),
          stripePaymentIntentId: paymentData.paymentIntentId,
          stripeCustomerId: paymentData.customerId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: 'succeeded',
          paymentMethod: {
            type: 'card',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.collection<Payment>('payments').insertOne(payment);

        // Grant course access
        for (const courseId of paymentData.courseIds) {
          // Add to user's enrolled courses
          await db.collection('users').updateOne(
            { _id: new ObjectId(paymentData.userId) },
            {
              $addToSet: { enrolledCourses: courseId },
              $set: { lastUpdated: new Date() },
            }
          );

          // Create initial progress record
          await db.collection('user_progress').insertOne({
            id: new ObjectId().toString(),
            userId: paymentData.userId,
            courseId,
            enrolledAt: new Date(),
            currentModuleId: '',
            currentStepId: '',
            completedSteps: [],
            overallProgress: 0,
            lastAccessedAt: new Date(),
            totalTimeSpent: 0,
          });
        }
        
        console.log('Payment successful for session:', session.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update payment record as failed
        await db.collection('payments').updateOne(
          { stripePaymentIntentId: paymentIntent.id },
          {
            $set: {
              status: 'failed',
              updatedAt: new Date(),
              failureReason: paymentIntent.last_payment_error?.message
            }
          }
        );
        
        console.log('Payment failed for intent:', paymentIntent.id);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Extract subscription data
        const subscriptionData = extractSubscriptionData(subscription);
        
        // Create subscription record
        const subscriptionRecord: Subscription = {
          id: new ObjectId().toString(),
          userId: subscriptionData.userId,
          stripeSubscriptionId: subscriptionData.subscriptionId,
          stripeCustomerId: subscriptionData.customerId,
          status: subscriptionData.status as any,
          plan: {
            id: subscriptionData.priceId,
            name: 'Subscription',
            description: '',
            stripePriceId: subscriptionData.priceId,
            amount: subscriptionData.amount,
            currency: subscriptionData.currency,
            interval: subscriptionData.interval as 'month' | 'year',
            intervalCount: subscriptionData.intervalCount,
            features: [],
          },
          currentPeriodStart: subscriptionData.currentPeriodStart,
          currentPeriodEnd: subscriptionData.currentPeriodEnd,
          cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
          trialEnd: subscriptionData.trialEnd,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.collection<Subscription>('subscriptions').insertOne(subscriptionRecord);
        
        console.log('Subscription created:', subscription.id);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Extract subscription data
        const subscriptionData = extractSubscriptionData(subscription);
        
        // Update subscription record
        await db.collection('subscriptions').updateOne(
          { stripeSubscriptionId: subscription.id },
          {
            $set: {
              status: subscriptionData.status,
              currentPeriodStart: subscriptionData.currentPeriodStart,
              currentPeriodEnd: subscriptionData.currentPeriodEnd,
              cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
              canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
              updatedAt: new Date()
            }
          }
        );
        
        console.log('Subscription updated:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Mark subscription as canceled
        await db.collection('subscriptions').updateOne(
          { stripeSubscriptionId: subscription.id },
          {
            $set: {
              status: 'canceled',
              canceledAt: new Date(),
              updatedAt: new Date()
            }
          }
        );
        
        console.log('Subscription canceled:', subscription.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        
        // Update payment record with refund info
        const refundAmount = charge.amount_refunded / 100;
        const isFullRefund = charge.amount_refunded === charge.amount;
        
        await db.collection('payments').updateOne(
          { stripePaymentIntentId: charge.payment_intent },
          {
            $set: {
              status: isFullRefund ? 'refunded' : 'partially_refunded',
              refundAmount: refundAmount,
              updatedAt: new Date()
            }
          }
        );
        
        console.log('Refund processed for charge:', charge.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Stripe requires raw body for webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
};
