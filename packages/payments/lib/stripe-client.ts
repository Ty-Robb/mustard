import Stripe from 'stripe';
import { env } from '../keys';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia' as any,
      typescript: true,
    });
  }
  return stripeInstance;
}

// Client-side Stripe instance for use in React components
export function getStripePublishableKey(): string {
  return env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}
