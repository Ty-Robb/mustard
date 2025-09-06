# Stripe Configuration Summary

## What We've Configured

### 1. Environment Variables (`.env.local`)
✅ Added your Stripe test API keys:
- `STRIPE_SECRET_KEY`: Your test secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your test publishable key
- `STRIPE_WEBHOOK_SECRET`: Placeholder for webhook secret (needs Stripe CLI)
- `NEXT_PUBLIC_APP_URL`: Set to `http://localhost:9001`

### 2. Test Page Created
✅ Created `/test-stripe` page with:
- Configuration test button
- Checkout test button
- Test card numbers reference

### 3. Test Configuration Endpoint
✅ Created `/api/payments/test-config` endpoint to verify Stripe setup

## Next Steps

### 1. Complete Stripe CLI Authentication
If you haven't already:
1. Complete the browser authentication with pairing code: `ardor-easy-feat-lucky`
2. Once authenticated, run:
   ```bash
   stripe listen --forward-to localhost:9001/api/payments/webhook
   ```
3. Copy the webhook signing secret (starts with `whsec_`) and update `.env.local`

### 2. Test the Integration
1. Start your development server:
   ```bash
   cd apps/app
   pnpm dev
   ```
2. Navigate to: http://localhost:9001/test-stripe
3. Click "Test Stripe Config" to verify your API keys work
4. Click "Test Checkout" to create a test payment session

### 3. Test Webhooks (Optional)
With Stripe CLI running:
```bash
# In another terminal
stripe trigger checkout.session.completed
```

## Test Card Numbers
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

## Troubleshooting

### "Expired API Key" Error
- Your test keys might be old. Get fresh ones from Stripe Dashboard
- Make sure you're using test keys (start with `sk_test_` and `pk_test_`)

### Webhook Issues
- For local testing, you must use Stripe CLI
- Make sure the webhook URL matches: `localhost:9001/api/payments/webhook`
- Update the webhook secret in `.env.local` after running `stripe listen`

### MongoDB Connection
- You'll need to update `MONGODB_URI` in `.env.local` with your actual connection string
- The payment system expects MongoDB collections for storing payment data

## Production Deployment
When ready for production:
1. Use live API keys from Stripe Dashboard
2. Create webhook endpoint in Stripe Dashboard with your production URL
3. Update all environment variables in your production environment
4. Test thoroughly with real payments in test mode first
