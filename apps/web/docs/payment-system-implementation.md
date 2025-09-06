# Payment System Implementation with Van Westendorp Price Sensitivity Meter

## Overview

This document outlines the implementation of a comprehensive payment system integrated with the Van Westendorp Price Sensitivity Meter for dynamic pricing optimization.

## Architecture

### 1. Type Definitions (`src/types/payment.ts`)
- **PricingSurvey**: Stores Van Westendorp survey responses
- **VanWestendorpResponses**: The four key price points (too cheap, cheap, expensive, too expensive)
- **PriceAnalysis**: Calculated optimal price points and acceptable price ranges
- **Payment**: Transaction records
- **Subscription**: Subscription management
- **CoursePrice**: Course pricing with dynamic pricing support

### 2. Payment Service (`src/lib/services/payment.service.ts`)
Core service handling:
- Stripe checkout session creation
- Payment processing
- Van Westendorp survey data collection and analysis
- Dynamic pricing calculations
- Access control verification

### 3. API Endpoints

#### Pricing Survey (`/api/pricing/survey`)
- **POST**: Save Van Westendorp survey responses
- **GET**: Check if user has completed survey
- Returns discount codes as incentives

#### Pricing Analysis (`/api/pricing/analysis`)
- **GET**: Retrieve pricing analysis with insights
- **POST**: Enable/disable dynamic pricing
- Requires at least 10 survey responses for analysis

#### Payment Checkout (`/api/payments/checkout`)
- **POST**: Create Stripe checkout session
- **GET**: Retrieve checkout session details
- Validates user doesn't already own the course

#### Webhook Handler (`/api/payments/webhook`)
Handles Stripe events:
- Payment success/failure
- Subscription lifecycle events
- Refund processing

### 4. UI Components

#### PricingSurvey Component (`src/components/payment/PricingSurvey.tsx`)
- Step-by-step survey interface
- Price validation logic
- Progress tracking
- Incentive display

## Van Westendorp Implementation

### Survey Questions
1. **Too Cheap**: "At what price would you consider the product to be priced so low that you would feel the quality couldn't be very good?"
2. **Cheap**: "At what price would you consider the product to be a bargain—a great buy for the money?"
3. **Expensive**: "At what price would you consider the product to be getting expensive, but you would still consider buying it?"
4. **Too Expensive**: "At what price would you consider the product to be so expensive that you would not consider buying it?"

### Price Analysis Algorithm
The system calculates:
- **Optimal Price Point (OPP)**: Intersection of "too cheap" and "too expensive" curves
- **Indifference Price Point (IPP)**: Intersection of "cheap" and "expensive" curves
- **Acceptable Price Range**: Between marginal cheapness and marginal expensiveness

### Dynamic Pricing
When enabled, the system:
1. Analyzes survey data regularly
2. Calculates recommended price adjustments
3. Updates course prices automatically
4. Tracks conversion rates at different price points

## Integration Points

### With LMS System
- Course enrollment after successful payment
- Access control for paid courses
- Progress tracking for enrolled users

### With MongoDB
Collections used:
- `pricing_surveys`: Survey responses
- `price_analyses`: Calculated price points
- `course_prices`: Course pricing configuration
- `payments`: Transaction records
- `subscriptions`: Active subscriptions
- `checkout_sessions`: Stripe session tracking

### With Stripe
- Products and prices management
- Checkout session creation
- Webhook event processing
- Subscription management

## Security Considerations

1. **Authentication**: All endpoints require Firebase authentication
2. **Payment Verification**: Webhook signature validation
3. **Access Control**: Verify payment before granting course access
4. **Data Validation**: Strict validation of survey responses

## Usage Flow

1. **User Views Course**
   - Check if pricing survey completed
   - Optionally show survey with incentive

2. **Survey Completion**
   - Collect Van Westendorp responses
   - Provide discount code
   - Trigger price analysis update

3. **Purchase Flow**
   - Create Stripe checkout session
   - Apply dynamic pricing if enabled
   - Handle discount codes
   - Process payment via webhook

4. **Post-Payment**
   - Grant course access
   - Create progress tracking
   - Send confirmation

## Environment Variables Required

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_APP_URL=https://your-app.com
```

## Testing

### Test Van Westendorp Survey
```bash
# Submit survey response
curl -X POST /api/pricing/survey \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "responses": {
      "tooCheap": 5,
      "cheap": 15,
      "expensive": 50,
      "tooExpensive": 100,
      "currency": "USD"
    },
    "courseId": "course-123"
  }'
```

### Test Checkout
```bash
# Create checkout session
curl -X POST /api/payments/checkout \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "courseIds": ["course-123"],
    "discountCode": "SURVEY10"
  }'
```

## Future Enhancements

1. **A/B Testing**: Test different price points simultaneously
2. **Segmented Pricing**: Different prices for different user segments
3. **Bundle Pricing**: Optimize pricing for course bundles
4. **Regional Pricing**: Adjust prices based on user location
5. **Price Elasticity**: Track demand changes at different price points
6. **Competitor Analysis**: Integrate competitor pricing data
7. **Machine Learning**: Predict optimal prices using ML models

## Monitoring

Key metrics to track:
- Survey completion rate
- Price point distribution
- Conversion rates at different prices
- Revenue optimization
- Customer lifetime value
- Churn rate for subscriptions
