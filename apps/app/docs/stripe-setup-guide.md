# Stripe Payment Integration Setup Guide

This guide will walk you through setting up Stripe payments for the Mustard application.

## Prerequisites

- A Stripe account (create one at https://stripe.com)
- Access to your MongoDB database
- Environment variables configured

## Step 1: Stripe Account Setup

1. **Create a Stripe Account**
   - Go to https://stripe.com and sign up
   - Complete the account verification process

2. **Get Your API Keys**
   - Navigate to Developers > API keys in your Stripe Dashboard
   - Copy your **Publishable key** (starts with `pk_`)
   - Copy your **Secret key** (starts with `sk_`)
   - Keep these keys secure!

## Step 2: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Use sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Use pk_live_... for production
NEXT_PUBLIC_APP_URL=http://localhost:9001 # Your app URL
```

## Step 3: Set Up Webhook Endpoint

1. **In Stripe Dashboard:**
   - Go to Developers > Webhooks
   - Click "Add endpoint"
   - Enter your webhook URL: `https://your-domain.com/api/payments/webhook`
   - Select the following events:
     - `checkout.session.completed`
     - `payment_intent.payment_failed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `charge.refunded`

2. **Copy the Webhook Secret:**
   - After creating the webhook, click on it
   - Copy the "Signing secret" (starts with `whsec_`)
   - Add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

## Step 4: Create Products and Prices in Stripe

### Option A: Using Stripe Dashboard

1. Go to Products in your Stripe Dashboard
2. Click "Add product"
3. Fill in:
   - Name: Your course name
   - Description: Course description
   - Pricing: Set your price
   - Billing: One-time
4. Save the product

### Option B: Using Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Create a product
stripe products create \
  --name="JavaScript Fundamentals Course" \
  --description="Learn JavaScript from scratch"

# Create a price for the product
stripe prices create \
  --product=prod_xxx \
  --unit-amount=4900 \
  --currency=usd
```

## Step 5: Database Setup

Ensure your MongoDB has the following collections:

- `course_prices` - Stores course pricing information
- `payments` - Stores payment records
- `checkout_sessions` - Stores Stripe checkout sessions
- `subscriptions` - Stores subscription information (if using subscriptions)
- `pricing_surveys` - Stores Van Westendorp survey responses
- `price_analyses` - Stores pricing analysis results

### Example Course Price Document

```javascript
{
  "courseId": "course_123",
  "basePrice": 49.99,
  "currency": "usd",
  "stripePriceId": "price_xxx", // Optional, if using Stripe prices
  "stripeProductId": "prod_xxx", // Optional
  "dynamicPricing": {
    "enabled": false,
    "algorithm": "van_westendorp",
    "adjustmentPercentage": 0
  }
}
```

## Step 6: Testing the Integration

### Test Cards

Use these test card numbers in development:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0025 0000 3155

### Test Checkout Flow

1. Create a test course in your database
2. Add pricing information to `course_prices` collection
3. Navigate to the course page
4. Click the purchase button
5. Complete the Stripe checkout
6. Verify:
   - Payment record created in database
   - User enrolled in course
   - Webhook processed successfully

### Test Webhook Locally

Use Stripe CLI to forward webhooks to your local server:

```bash
# Forward webhooks to your local server
stripe listen --forward-to localhost:9001/api/payments/webhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
```

## Step 7: Production Deployment

1. **Update Environment Variables:**
   - Use production Stripe keys (`sk_live_...` and `pk_live_...`)
   - Update `NEXT_PUBLIC_APP_URL` to your production domain

2. **Configure Production Webhook:**
   - Add your production webhook endpoint in Stripe Dashboard
   - Update `STRIPE_WEBHOOK_SECRET` with production webhook secret

3. **Security Checklist:**
   - [ ] Never commit API keys to version control
   - [ ] Use environment variables for all sensitive data
   - [ ] Enable webhook signature verification
   - [ ] Implement proper error handling
   - [ ] Set up monitoring and alerts

## Troubleshooting

### Common Issues

1. **"Stripe is not configured" error**
   - Ensure all environment variables are set
   - Restart your development server after adding env vars

2. **Webhook signature verification failed**
   - Verify `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure you're using the raw request body

3. **Payment not processing**
   - Check Stripe Dashboard for failed payments
   - Verify webhook endpoint is accessible
   - Check server logs for errors

### Debug Mode

Enable Stripe debug logging:

```javascript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  telemetry: false,
  maxNetworkRetries: 2,
});
```

## Additional Features

### Van Westendorp Pricing

The system includes Van Westendorp price sensitivity analysis:

1. Users complete pricing surveys
2. System analyzes responses to find optimal price points
3. Dynamic pricing can be enabled based on analysis

### Subscription Support

The payment system supports subscriptions:

1. Create subscription products in Stripe
2. Use `mode: 'subscription'` in checkout sessions
3. Handle subscription lifecycle webhooks

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- API Reference: https://stripe.com/docs/api

## Next Steps

1. Test the complete payment flow
2. Set up monitoring and alerts
3. Implement additional features (subscriptions, discounts)
4. Configure tax settings if needed
5. Set up revenue reporting
