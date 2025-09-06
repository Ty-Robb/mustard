import { NextResponse } from 'next/server';
import { getStripe } from '@repo/payments/server';

export async function GET() {
  try {
    // Check if Stripe is configured
    const stripe = getStripe();
    
    // Try to retrieve account details to verify the API key works
    const account = await stripe.accounts.retrieve();
    
    return NextResponse.json({
      status: 'success',
      message: 'Stripe is configured correctly',
      account: {
        id: account.id,
        country: account.country,
        default_currency: account.default_currency,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      },
      environment: {
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
        hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      }
    });
  } catch (error: any) {
    console.error('Stripe configuration test failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        error: error.message || 'Failed to verify Stripe configuration',
        environment: {
          hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
          hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
          hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
          appUrl: process.env.NEXT_PUBLIC_APP_URL,
        }
      },
      { status: 500 }
    );
  }
}
