import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PaymentService } from '@/lib/services/payment.service';

export async function POST(request: NextRequest) {
  // Initialize Stripe and webhook secret inside the handler
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Stripe webhook secret is not configured' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia' as any,
  });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
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
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Handle successful payment
        await PaymentService.handlePaymentSuccess(session.id);
        
        console.log('Payment successful for session:', session.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update payment record as failed
        const { getDatabase } = await import('@/lib/mongodb');
        const db = await getDatabase();
        
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
        
        // Create subscription record
        const { getDatabase } = await import('@/lib/mongodb');
        const db = await getDatabase();
        
        await db.collection('subscriptions').insertOne({
          id: subscription.id,
          userId: subscription.metadata.userId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          status: subscription.status,
          plan: {
            id: subscription.items.data[0].price.id,
            name: subscription.items.data[0].price.nickname || 'Subscription',
            stripePriceId: subscription.items.data[0].price.id,
            amount: subscription.items.data[0].price.unit_amount! / 100,
            currency: subscription.items.data[0].price.currency,
            interval: subscription.items.data[0].price.recurring!.interval,
            intervalCount: subscription.items.data[0].price.recurring!.interval_count,
          },
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log('Subscription created:', subscription.id);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update subscription record
        const { getDatabase } = await import('@/lib/mongodb');
        const db = await getDatabase();
        
        await db.collection('subscriptions').updateOne(
          { stripeSubscriptionId: subscription.id },
          {
            $set: {
              status: subscription.status,
              currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
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
        const { getDatabase } = await import('@/lib/mongodb');
        const db = await getDatabase();
        
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
        const { getDatabase } = await import('@/lib/mongodb');
        const db = await getDatabase();
        
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
