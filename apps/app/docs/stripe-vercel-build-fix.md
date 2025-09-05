# Stripe Vercel Build Fix

## Problem
The Vercel build was failing with the error "Neither apiKey nor config.authenticator provided" during the "Collecting page data" phase. This occurred because:

1. Stripe was being initialized at the module level in both `PaymentService` and the webhook route
2. During build time, environment variables like `STRIPE_SECRET_KEY` are not available
3. Next.js analyzes API routes during build, causing the modules to load and fail

## Solution
Implemented lazy initialization for Stripe to ensure it's only initialized at runtime when the environment variables are available.

### Changes Made

#### 1. PaymentService (`src/lib/services/payment.service.ts`)
- Removed module-level Stripe initialization
- Added a private static method `getStripe()` that lazily initializes Stripe
- Updated all methods to use `this.getStripe()` instead of the module-level `stripe` variable

```typescript
export class PaymentService {
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
  // ... rest of the class
}
```

#### 2. Webhook Route (`src/app/api/payments/webhook/route.ts`)
- Moved Stripe initialization inside the POST handler
- Added checks for required environment variables before initialization
- Returns appropriate error responses if configuration is missing

```typescript
export async function POST(request: NextRequest) {
  // Initialize Stripe and webhook secret inside the handler
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Stripe webhook secret is not configured' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia' as any,
  });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  // ... rest of the handler
}
```

#### 3. Environment Configuration
- Updated `.env.example` to include Stripe configuration variables
- Added Stripe keys to `.env.local` for local development

### Required Environment Variables
Add these to your Vercel project settings:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

### Setting up Stripe Webhook Secret
1. Go to your Stripe Dashboard
2. Navigate to Developers > Webhooks
3. Add endpoint: `https://your-domain.vercel.app/api/payments/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.refunded`
5. Copy the signing secret and add it as `STRIPE_WEBHOOK_SECRET` in Vercel

## Key Takeaways
- Never initialize external services that require environment variables at the module level
- Always use lazy initialization for services that depend on runtime configuration
- Vercel's build process doesn't have access to runtime environment variables
- API routes are analyzed during build time in Next.js, causing modules to load
