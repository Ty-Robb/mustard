import 'server-only';
import { getStripe } from './stripe-client';
import type { 
  CoursePrice, 
  CheckoutSession, 
  CreateCheckoutSessionResponse 
} from '@repo/types';

interface CreateCheckoutSessionParams {
  userId: string;
  courseIds: string[];
  successUrl: string;
  cancelUrl: string;
  discountCode?: string;
  userEmail?: string;
  coursePrices: CoursePrice[];
  courses: Array<{ _id: string; title: string; description?: string }>;
}

export async function createCheckoutSession({
  userId,
  courseIds,
  successUrl,
  cancelUrl,
  discountCode,
  userEmail,
  coursePrices,
  courses,
}: CreateCheckoutSessionParams): Promise<CreateCheckoutSessionResponse> {
  const stripe = getStripe();

  // Calculate line items
  const lineItems = coursePrices.map((coursePrice) => {
    const course = courses.find(c => c._id.toString() === coursePrice.courseId);
    
    // Apply dynamic pricing if enabled
    let finalPrice = coursePrice.basePrice;
    if (coursePrice.dynamicPricing?.enabled) {
      finalPrice = coursePrice.basePrice * (1 + coursePrice.dynamicPricing.adjustmentPercentage / 100);
    }

    return {
      price_data: {
        currency: coursePrice.currency,
        product_data: {
          name: course?.title || 'Course',
          description: course?.description,
          metadata: {
            courseId: coursePrice.courseId,
          },
        },
        unit_amount: Math.round(finalPrice * 100), // Convert to cents
      },
      quantity: 1,
    };
  });

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    metadata: {
      userId,
      courseIds: courseIds.join(','),
    },
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

export async function retrieveCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent', 'customer'],
  });
}
