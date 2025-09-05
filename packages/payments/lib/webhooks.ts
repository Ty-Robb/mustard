import 'server-only';
import Stripe from 'stripe';
import { getStripe } from './stripe-client';
import { env } from '../keys';

export async function constructWebhookEvent(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  const stripe = getStripe();
  
  return stripe.webhooks.constructEvent(
    body,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );
}

export interface PaymentSuccessData {
  sessionId: string;
  userId: string;
  courseIds: string[];
  paymentIntentId: string;
  customerId: string;
  amount: number;
  currency: string;
}

export function extractPaymentSuccessData(
  session: Stripe.Checkout.Session
): PaymentSuccessData {
  return {
    sessionId: session.id,
    userId: session.metadata!.userId,
    courseIds: session.metadata!.courseIds.split(','),
    paymentIntentId: (session.payment_intent as Stripe.PaymentIntent).id,
    customerId: session.customer as string,
    amount: session.amount_total! / 100,
    currency: session.currency!,
  };
}

export interface SubscriptionData {
  subscriptionId: string;
  userId: string;
  customerId: string;
  status: string;
  priceId: string;
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
}

export function extractSubscriptionData(
  subscription: Stripe.Subscription
): SubscriptionData {
  const price = subscription.items.data[0].price;
  
  return {
    subscriptionId: subscription.id,
    userId: subscription.metadata.userId,
    customerId: subscription.customer as string,
    status: subscription.status,
    priceId: price.id,
    amount: price.unit_amount! / 100,
    currency: price.currency,
    interval: price.recurring!.interval,
    intervalCount: price.recurring!.interval_count,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
  };
}
