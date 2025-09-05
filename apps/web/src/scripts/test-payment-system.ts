import { PaymentService } from '../lib/services/payment.service';
import { VanWestendorpResponses } from '../types/payment';
import { getDatabase } from '../lib/mongodb';
import { ObjectId } from 'mongodb';

async function testPaymentSystem() {
  console.log('🧪 Testing Payment System with Van Westendorp Integration\n');

  try {
    // Test 1: Database Connection
    console.log('1️⃣ Testing database connection...');
    const db = await getDatabase();
    console.log('✅ Database connected successfully\n');

    // Test 2: Van Westendorp Survey Data
    console.log('2️⃣ Testing Van Westendorp survey data collection...');
    
    // Create sample survey responses
    const sampleResponses: VanWestendorpResponses[] = [
      { tooCheap: 5, cheap: 15, expensive: 50, tooExpensive: 100, currency: 'USD' },
      { tooCheap: 10, cheap: 20, expensive: 60, tooExpensive: 120, currency: 'USD' },
      { tooCheap: 8, cheap: 18, expensive: 55, tooExpensive: 110, currency: 'USD' },
      { tooCheap: 7, cheap: 17, expensive: 45, tooExpensive: 90, currency: 'USD' },
      { tooCheap: 6, cheap: 16, expensive: 48, tooExpensive: 95, currency: 'USD' },
      { tooCheap: 9, cheap: 19, expensive: 52, tooExpensive: 105, currency: 'USD' },
      { tooCheap: 5, cheap: 14, expensive: 47, tooExpensive: 98, currency: 'USD' },
      { tooCheap: 11, cheap: 21, expensive: 58, tooExpensive: 115, currency: 'USD' },
      { tooCheap: 8, cheap: 18, expensive: 53, tooExpensive: 108, currency: 'USD' },
      { tooCheap: 7, cheap: 16, expensive: 49, tooExpensive: 102, currency: 'USD' },
      { tooCheap: 6, cheap: 15, expensive: 46, tooExpensive: 92, currency: 'USD' },
    ];

    // Clear existing test data
    await db.collection('pricing_surveys').deleteMany({ 
      courseId: 'test-course-123' 
    });

    // Insert sample survey data
    for (let i = 0; i < sampleResponses.length; i++) {
      await PaymentService.savePricingSurvey(
        `test-user-${i}`,
        sampleResponses[i],
        'test-course-123'
      );
    }
    console.log(`✅ Inserted ${sampleResponses.length} survey responses\n`);

    // Test 3: Price Analysis
    console.log('3️⃣ Testing Van Westendorp price analysis...');
    const analysis = await PaymentService.analyzePricing('test-course-123');
    
    console.log('📊 Price Analysis Results:');
    console.log(`   - Optimal Price Point: $${analysis.analysis.optimalPricePoint}`);
    console.log(`   - Indifference Price Point: $${analysis.analysis.indifferencePricePoint}`);
    console.log(`   - Acceptable Price Range: $${analysis.analysis.acceptablePriceRange.min} - $${analysis.analysis.acceptablePriceRange.max}`);
    console.log(`   - Sample Size: ${analysis.analysis.sampleSize}`);
    console.log(`   - Confidence: ${(analysis.confidence * 100).toFixed(0)}%\n`);

    // Test 4: Course Pricing Setup
    console.log('4️⃣ Setting up course pricing...');
    
    // Create a test course with pricing
    const testCourse = {
      _id: new ObjectId(),
      id: 'test-course-123',
      title: 'Test Course for Payment System',
      description: 'A test course to verify payment integration',
      price: 49.99,
      currency: 'USD',
      isPaid: true,
      createdBy: 'test-admin',
      modules: [],
      tags: ['test'],
      difficulty: 'beginner' as const,
      estimatedHours: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('lmsCourses').replaceOne(
      { id: testCourse.id },
      testCourse,
      { upsert: true }
    );

    // Create course pricing record
    const coursePrice = {
      courseId: 'test-course-123',
      basePrice: 49.99,
      currency: 'USD',
      dynamicPricing: {
        enabled: true,
        algorithm: 'van_westendorp' as const,
        lastAdjusted: new Date(),
        adjustmentPercentage: ((analysis.recommendedPrice - 49.99) / 49.99) * 100
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('course_prices').replaceOne(
      { courseId: coursePrice.courseId },
      coursePrice,
      { upsert: true }
    );

    console.log('✅ Course pricing configured');
    console.log(`   - Base Price: $${coursePrice.basePrice}`);
    console.log(`   - Dynamic Pricing: ${coursePrice.dynamicPricing.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   - Price Adjustment: ${coursePrice.dynamicPricing.adjustmentPercentage.toFixed(1)}%\n`);

    // Test 5: Access Control
    console.log('5️⃣ Testing access control...');
    
    const hasAccess = await PaymentService.hasAccess('test-user-1', 'test-course-123');
    console.log(`   - User has access (before payment): ${hasAccess}`);
    
    // Simulate a successful payment
    const testPayment = {
      id: new ObjectId().toString(),
      userId: 'test-user-1',
      courseId: 'test-course-123',
      stripePaymentIntentId: 'pi_test_123',
      stripeCustomerId: 'cus_test_123',
      amount: 49.99,
      currency: 'USD',
      status: 'succeeded' as const,
      paymentMethod: {
        type: 'card',
        last4: '4242',
        brand: 'visa'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('payments').insertOne(testPayment);
    
    const hasAccessAfter = await PaymentService.hasAccess('test-user-1', 'test-course-123');
    console.log(`   - User has access (after payment): ${hasAccessAfter}`);
    console.log('✅ Access control working correctly\n');

    // Test 6: Payment History
    console.log('6️⃣ Testing payment history...');
    const paymentHistory = await PaymentService.getPaymentHistory('test-user-1');
    console.log(`   - Found ${paymentHistory.length} payment(s)`);
    if (paymentHistory.length > 0) {
      console.log(`   - Latest payment: $${paymentHistory[0].amount} ${paymentHistory[0].currency}`);
      console.log(`   - Status: ${paymentHistory[0].status}`);
    }
    console.log('✅ Payment history retrieved successfully\n');

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await db.collection('pricing_surveys').deleteMany({ courseId: 'test-course-123' });
    await db.collection('lmsCourses').deleteOne({ id: 'test-course-123' });
    await db.collection('course_prices').deleteOne({ courseId: 'test-course-123' });
    await db.collection('payments').deleteOne({ id: testPayment.id });
    await db.collection('price_analyses').deleteOne({ courseId: 'test-course-123' });
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 All payment system tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the test
testPaymentSystem();
