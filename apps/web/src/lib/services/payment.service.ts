import Stripe from 'stripe';
import { 
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
} from '@/types/payment';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export class PaymentService {
  // Lazy-load Stripe instance to avoid build-time initialization
  private static stripeInstance: Stripe | null = null;

  private static getStripe(): Stripe {
    if (!this.stripeInstance) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
      }
      this.stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia' as any,
      });
    }
    return this.stripeInstance;
  }
  // Create a Stripe checkout session for course purchase
  static async createCheckoutSession(
    userId: string,
    courseIds: string[],
    successUrl: string,
    cancelUrl: string,
    discountCode?: string
  ): Promise<CreateCheckoutSessionResponse> {
    const db = await getDatabase();
    
    // Get course prices
    const coursePrices = await db.collection<CoursePrice>('course_prices')
      .find({ courseId: { $in: courseIds } })
      .toArray();

    if (coursePrices.length !== courseIds.length) {
      throw new Error('Some courses not found or not priced');
    }

    // Calculate line items
    const lineItems = await Promise.all(coursePrices.map(async (coursePrice) => {
      const course = await db.collection('courses').findOne({ _id: new ObjectId(coursePrice.courseId) });
      
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
    }));

    // Apply discount if provided
    let discounts: Array<{ promotion_code: string }> = [];
    if (discountCode) {
      const discount = await db.collection('discounts').findOne({
        code: discountCode,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
        $or: [
          { usageLimit: { $exists: false } },
          { $expr: { $lt: ['$usageCount', '$usageLimit'] } }
        ]
      });

      if (discount && discount.stripePromotionCodeId) {
        discounts = [{ promotion_code: discount.stripePromotionCodeId }];
      }
    }

    // Create Stripe checkout session
    const stripe = this.getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: await this.getUserEmail(userId),
      metadata: {
        userId,
        courseIds: courseIds.join(','),
      },
      discounts,
    });

    // Save checkout session to database
    await db.collection<CheckoutSession>('checkout_sessions').insertOne({
      id: new ObjectId().toString(),
      userId,
      items: coursePrices.map(cp => ({
        type: 'course',
        id: cp.courseId,
        name: 'Course',
        price: cp.basePrice,
        quantity: 1,
      })),
      subtotal: coursePrices.reduce((sum, cp) => sum + cp.basePrice, 0),
      total: coursePrices.reduce((sum, cp) => sum + cp.basePrice, 0),
      currency: coursePrices[0].currency,
      stripeSessionId: session.id,
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date(),
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  // Handle successful payment (webhook)
  static async handlePaymentSuccess(stripeSessionId: string): Promise<void> {
    const db = await getDatabase();
    
    // Get session from Stripe
    const stripe = this.getStripe();
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId, {
      expand: ['payment_intent', 'customer'],
    });

    // Update checkout session
    await db.collection<CheckoutSession>('checkout_sessions').updateOne(
      { stripeSessionId },
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
      userId: session.metadata!.userId,
      courseId: session.metadata!.courseIds,
      stripePaymentIntentId: (session.payment_intent as Stripe.PaymentIntent).id,
      stripeCustomerId: session.customer as string,
      amount: session.amount_total! / 100,
      currency: session.currency!,
      status: 'succeeded',
      paymentMethod: {
        type: 'card',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection<Payment>('payments').insertOne(payment);

    // Grant course access
    const courseIds = session.metadata!.courseIds.split(',');
    for (const courseId of courseIds) {
      await this.grantCourseAccess(session.metadata!.userId, courseId);
    }
  }

  // Grant course access to user
  static async grantCourseAccess(userId: string, courseId: string): Promise<void> {
    const db = await getDatabase();
    
    // Add to user's enrolled courses
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $addToSet: { enrolledCourses: courseId },
        $set: { lastUpdated: new Date() },
      }
    );

    // Create initial progress record
    await db.collection('user_progress').insertOne({
      id: new ObjectId().toString(),
      userId,
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

  // Save Van Westendorp survey response
  static async savePricingSurvey(
    userId: string,
    responses: VanWestendorpResponses,
    courseId?: string
  ): Promise<void> {
    const db = await getDatabase();
    
    const survey: PricingSurvey = {
      id: new ObjectId().toString(),
      userId,
      courseId,
      responses,
      createdAt: new Date(),
    };

    await db.collection<PricingSurvey>('pricing_surveys').insertOne(survey);
    
    // Trigger price analysis update
    if (courseId) {
      await this.updatePriceAnalysis(courseId);
    }
  }

  // Analyze Van Westendorp survey data
  static async analyzePricing(courseId?: string): Promise<PricingAnalysisResponse> {
    const db = await getDatabase();
    
    // Get all surveys for the course (or platform-wide if no courseId)
    const query = courseId ? { courseId } : { courseId: { $exists: false } };
    const surveys = await db.collection<PricingSurvey>('pricing_surveys')
      .find(query)
      .toArray();

    if (surveys.length < 10) {
      throw new Error('Insufficient survey data for analysis');
    }

    // Extract price points
    const tooExpensive = surveys.map(s => s.responses.tooExpensive).sort((a, b) => a - b);
    const expensive = surveys.map(s => s.responses.expensive).sort((a, b) => a - b);
    const cheap = surveys.map(s => s.responses.cheap).sort((a, b) => a - b);
    const tooCheap = surveys.map(s => s.responses.tooCheap).sort((a, b) => a - b);

    // Calculate cumulative percentages
    const calculateCumulative = (prices: number[], reverse = false) => {
      const unique = [...new Set(prices)].sort((a, b) => reverse ? b - a : a - b);
      return unique.map(price => ({
        price,
        percentage: (reverse 
          ? prices.filter(p => p >= price).length 
          : prices.filter(p => p <= price).length) / prices.length * 100
      }));
    };

    const tooExpensiveCurve = calculateCumulative(tooExpensive);
    const tooCheapCurve = calculateCumulative(tooCheap, true);
    const expensiveCurve = calculateCumulative(expensive);
    const cheapCurve = calculateCumulative(cheap, true);

    // Find intersection points
    const findIntersection = (curve1: any[], curve2: any[]) => {
      for (let i = 0; i < curve1.length - 1; i++) {
        for (let j = 0; j < curve2.length - 1; j++) {
          if (curve1[i].price <= curve2[j].price && curve1[i + 1].price >= curve2[j + 1].price) {
            // Linear interpolation
            const x1 = curve1[i].price;
            const y1 = curve1[i].percentage;
            const x2 = curve1[i + 1].price;
            const y2 = curve1[i + 1].percentage;
            const x3 = curve2[j].price;
            const y3 = curve2[j].percentage;
            const x4 = curve2[j + 1].price;
            const y4 = curve2[j + 1].percentage;
            
            const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (denominator !== 0) {
              const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
              return x1 + t * (x2 - x1);
            }
          }
        }
      }
      return null;
    };

    const optimalPrice = findIntersection(tooCheapCurve, tooExpensiveCurve) || 0;
    const indifferencePrice = findIntersection(cheapCurve, expensiveCurve) || 0;
    
    // Find acceptable price range
    const minAcceptable = findIntersection(tooCheapCurve, expensiveCurve) || 0;
    const maxAcceptable = findIntersection(cheapCurve, tooExpensiveCurve) || 0;

    const analysis: PriceAnalysis = {
      courseId,
      optimalPricePoint: Math.round(optimalPrice * 100) / 100,
      indifferencePricePoint: Math.round(indifferencePrice * 100) / 100,
      acceptablePriceRange: {
        min: Math.round(minAcceptable * 100) / 100,
        max: Math.round(maxAcceptable * 100) / 100,
      },
      sampleSize: surveys.length,
      lastUpdated: new Date(),
      currency: surveys[0].responses.currency,
    };

    // Save analysis
    await db.collection<PriceAnalysis>('price_analyses').replaceOne(
      { courseId },
      analysis,
      { upsert: true }
    );

    return {
      analysis,
      recommendedPrice: analysis.optimalPricePoint,
      confidence: Math.min(surveys.length / 100, 1), // Confidence increases with sample size
    };
  }

  // Update price analysis for a course
  private static async updatePriceAnalysis(courseId: string): Promise<void> {
    try {
      const analysis = await this.analyzePricing(courseId);
      
      // Update course price if dynamic pricing is enabled
      const db = await getDatabase();
      const coursePrice = await db.collection<CoursePrice>('course_prices').findOne({ courseId });
      
      if (coursePrice?.dynamicPricing?.enabled && coursePrice.dynamicPricing.algorithm === 'van_westendorp') {
        const adjustmentPercentage = ((analysis.recommendedPrice - coursePrice.basePrice) / coursePrice.basePrice) * 100;
        
        await db.collection<CoursePrice>('course_prices').updateOne(
          { courseId },
          {
            $set: {
              'dynamicPricing.adjustmentPercentage': adjustmentPercentage,
              'dynamicPricing.lastAdjusted': new Date(),
            },
          }
        );
      }
    } catch (error) {
      console.error('Error updating price analysis:', error);
    }
  }

  // Get user email for Stripe
  private static async getUserEmail(userId: string): Promise<string | undefined> {
    const db = await getDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    return user?.email;
  }

  // Check if user has access to a course
  static async hasAccess(userId: string, courseId: string): Promise<boolean> {
    const db = await getDatabase();
    
    // Check if user has purchased the course
    const payment = await db.collection<Payment>('payments').findOne({
      userId,
      courseId: { $regex: courseId },
      status: 'succeeded',
    });

    if (payment) return true;

    // Check if user has active subscription
    const subscription = await db.collection<Subscription>('subscriptions').findOne({
      userId,
      status: 'active',
    });

    return !!subscription;
  }

  // Get user's payment history
  static async getPaymentHistory(userId: string): Promise<Payment[]> {
    const db = await getDatabase();
    
    return db.collection<Payment>('payments')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
  }
}
