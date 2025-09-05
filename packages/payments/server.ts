import 'server-only';

// Stripe client
export { getStripe } from './lib/stripe-client';

// Checkout functionality
export { 
  createCheckoutSession, 
  retrieveCheckoutSession 
} from './lib/checkout';

// Webhook handling
export { 
  constructWebhookEvent,
  extractPaymentSuccessData,
  extractSubscriptionData,
  type PaymentSuccessData,
  type SubscriptionData
} from './lib/webhooks';

// Pricing analysis
export { 
  analyzePricingSurveys,
  calculateDynamicPriceAdjustment
} from './lib/pricing-analysis';

// Re-export types from @repo/types for convenience
export type {
  Payment,
  Subscription,
  CheckoutSession,
  PaymentIntent,
  CreateCheckoutSessionResponse,
  CoursePrice,
  PricingSurvey,
  VanWestendorpResponses,
  PriceAnalysis,
  PricingAnalysisResponse
} from '@repo/types';
