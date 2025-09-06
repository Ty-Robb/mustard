import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { createCheckoutSession, type CoursePrice } from '@repo/payments/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
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
    const { courseIds, discountCode } = body;

    // Validate input
    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: 'Please provide at least one course ID' },
        { status: 400 }
      );
    }

    // Get database connection
    const db = await getDatabase();
    
    // Check if user already has access to any of these courses
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    const enrolledCourses = user?.enrolledCourses || [];
    
    const alreadyOwned = courseIds.filter(courseId => enrolledCourses.includes(courseId));
    if (alreadyOwned.length > 0) {
      return NextResponse.json(
        { 
          error: 'Already purchased',
          message: 'You already have access to one or more of these courses',
          ownedCourses: alreadyOwned
        },
        { status: 400 }
      );
    }

    // Get course prices
    const coursePrices = await db.collection<CoursePrice>('course_prices')
      .find({ courseId: { $in: courseIds } })
      .toArray();

    if (coursePrices.length !== courseIds.length) {
      return NextResponse.json(
        { 
          error: 'Course not found',
          message: 'One or more courses are not available for purchase'
        },
        { status: 404 }
      );
    }

    // Get course details
    const courses = await db.collection('courses')
      .find({ _id: { $in: courseIds.map(id => new ObjectId(id)) } })
      .toArray();

    // Get user email
    const userEmail = user?.email;

    // Create success and cancel URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL;
    const successUrl = `${origin}/courses/purchase-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/courses/${courseIds[0]}?canceled=true`;

    // Create Stripe checkout session using the new package
    try {
      const session = await createCheckoutSession({
        userId,
        courseIds,
        successUrl,
        cancelUrl,
        discountCode,
        userEmail,
        coursePrices,
        courses: courses.map(c => ({
          _id: c._id.toString(),
          title: c.title,
          description: c.description
        }))
      });

      // Save checkout session to database
      await db.collection('checkout_sessions').insertOne({
        id: new ObjectId().toString(),
        userId,
        items: coursePrices.map(cp => ({
          type: 'course',
          id: cp.courseId,
          name: courses.find(c => c._id.toString() === cp.courseId)?.title || 'Course',
          price: cp.basePrice,
          quantity: 1,
        })),
        subtotal: coursePrices.reduce((sum, cp) => sum + cp.basePrice, 0),
        total: coursePrices.reduce((sum, cp) => sum + cp.basePrice, 0),
        currency: coursePrices[0].currency,
        stripeSessionId: session.sessionId,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
      });

      return NextResponse.json({
        sessionId: session.sessionId,
        url: session.url
      });
    } catch (stripeError: any) {
      console.error('Stripe checkout error:', stripeError);
      
      if (stripeError.message?.includes('not found')) {
        return NextResponse.json(
          { 
            error: 'Course not found',
            message: 'One or more courses are not available for purchase'
          },
          { status: 404 }
        );
      }
      
      throw stripeError;
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// GET: Retrieve checkout session details
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
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get session from database
    const db = await getDatabase();
    
    const checkoutSession = await db.collection('checkout_sessions').findOne({
      stripeSessionId: sessionId,
      userId
    });

    if (!checkoutSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: checkoutSession.status,
      items: checkoutSession.items,
      total: checkoutSession.total,
      currency: checkoutSession.currency,
      completedAt: checkoutSession.completedAt
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve checkout session' },
      { status: 500 }
    );
  }
}
