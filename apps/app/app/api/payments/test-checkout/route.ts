import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@repo/payments/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      courseId = 'test-course-123',
      courseName = 'Test Course',
      amount = 4999,
      currency = 'usd',
      userId = 'test-user-123'
    } = body;

    // Create success and cancel URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL;
    const successUrl = `${origin}/courses/purchase-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/test-stripe?canceled=true`;

    // Create a simplified checkout session for testing
    const session = await createCheckoutSession({
      userId,
      courseIds: [courseId],
      successUrl,
      cancelUrl,
      userEmail: 'test@example.com',
      coursePrices: [{
        courseId,
        basePrice: amount / 100, // Convert cents to dollars
        currency,
        stripePriceId: undefined,
        stripeProductId: undefined,
        dynamicPricing: {
          enabled: false,
          algorithm: 'van_westendorp' as const,
          adjustmentPercentage: 0,
          lastAdjusted: new Date()
        }
      }],
      courses: [{
        _id: courseId,
        title: courseName,
        description: 'Test course for Stripe integration'
      }]
    });

    return NextResponse.json({
      sessionId: session.sessionId,
      url: session.url
    });
  } catch (error: any) {
    console.error('Error creating test checkout session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
