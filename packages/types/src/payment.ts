// Payment and Pricing type definitions

export interface PricingSurvey {
  id: string;
  userId: string;
  courseId?: string; // Optional - can be for general platform pricing
  responses: VanWestendorpResponses;
  metadata?: {
    userType?: 'new' | 'existing' | 'premium';
    referralSource?: string;
    country?: string;
    completedCourses?: number;
  };
  createdAt: Date;
}

export interface VanWestendorpResponses {
  tooExpensive: number; // "At what price would you consider the product to be so expensive that you would not consider buying it?"
  expensive: number; // "At what price would you consider the product to be priced so high that you would think hard before buying it?"
  cheap: number; // "At what price would you consider the product to be a bargain—a great buy for the money?"
  tooCheap: number; // "At what price would you consider the product to be priced so low that you would feel the quality couldn't be very good?"
  currency: string; // USD, EUR, GBP, etc.
}

export interface PriceAnalysis {
  courseId?: string;
  optimalPricePoint: number; // Where "too cheap" and "too expensive" lines intersect
  indifferencePricePoint: number; // Where "cheap" and "expensive" lines intersect
  acceptablePriceRange: {
    min: number; // Point of Marginal Cheapness
    max: number; // Point of Marginal Expensiveness
  };
  sampleSize: number;
  lastUpdated: Date;
  currency: string;
}

export interface Payment {
  id: string;
  userId: string;
  courseId?: string;
  subscriptionId?: string;
  stripePaymentIntentId: string;
  stripeCustomerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded';
  paymentMethod: {
    type: string;
    last4?: string;
    brand?: string;
  };
  metadata?: {
    promoCode?: string;
    referralSource?: string;
    bundleId?: string;
  };
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid';
  plan: SubscriptionPlan;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialEnd?: Date;
  metadata?: {
    referralSource?: string;
    initialPromoCode?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  stripePriceId: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  intervalCount: number;
  features: string[];
  limits?: {
    coursesPerMonth?: number;
    aiInteractionsPerMonth?: number;
    storageGB?: number;
  };
  trialPeriodDays?: number;
}

export interface CoursePrice {
  courseId: string;
  basePrice: number;
  currency: string;
  stripePriceId?: string; // For one-time purchases
  stripeProductId?: string;
  discounts?: Discount[];
  dynamicPricing?: {
    enabled: boolean;
    algorithm: 'van_westendorp' | 'demand_based' | 'time_based';
    lastAdjusted: Date;
    adjustmentPercentage: number; // Percentage adjustment from base price
  };
  bundleDiscounts?: {
    bundleSize: number;
    discountPercentage: number;
  }[];
}

export interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usageCount: number;
  conditions?: {
    minPurchaseAmount?: number;
    specificCourses?: string[];
    userTypes?: string[];
    firstTimePurchase?: boolean;
  };
}

export interface PaymentIntent {
  userId: string;
  courseIds?: string[];
  subscriptionPlanId?: string;
  amount: number;
  currency: string;
  discountCode?: string;
  metadata?: Record<string, any>;
}

export interface CheckoutSession {
  id: string;
  userId: string;
  items: CheckoutItem[];
  subtotal: number;
  discount?: {
    code: string;
    amount: number;
  };
  tax?: {
    rate: number;
    amount: number;
  };
  total: number;
  currency: string;
  stripeSessionId?: string;
  status: 'pending' | 'completed' | 'expired' | 'canceled';
  expiresAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface CheckoutItem {
  type: 'course' | 'subscription' | 'bundle';
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  stripePaymentMethodId: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  paymentId: string;
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  tax?: {
    rate: number;
    amount: number;
  };
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'void';
  dueDate?: Date;
  paidAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// Van Westendorp Survey Component Props
export interface PricingSurveyProps {
  courseId?: string;
  onComplete: (responses: VanWestendorpResponses) => void;
  onSkip?: () => void;
  currency?: string;
  productName?: string;
  incentive?: {
    type: 'discount' | 'points' | 'feature';
    value: string | number;
    description: string;
  };
}

// Payment UI Component Props
export interface PaymentFormProps {
  courseId?: string;
  subscriptionPlanId?: string;
  amount: number;
  currency: string;
  onSuccess: (payment: Payment) => void;
  onError: (error: Error) => void;
  allowPromoCode?: boolean;
}

export interface PricingDisplayProps {
  courseId: string;
  showSurveyPrompt?: boolean;
  showBundleOptions?: boolean;
}

// API Response Types
export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface PricingAnalysisResponse {
  analysis: PriceAnalysis;
  recommendedPrice: number;
  confidence: number;
  priceHistory?: {
    date: Date;
    price: number;
    conversions: number;
  }[];
}
