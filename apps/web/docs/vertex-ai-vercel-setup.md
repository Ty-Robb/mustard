# Vertex AI Authentication Fix for Vercel Production

## Problem Summary

Your MongoDB is working perfectly - chat sessions and activities are being saved correctly. The issue is with Google Cloud/Vertex AI authentication in your production Vercel environment.

Error from production logs:
```
Streaming error: Error [GoogleAuthError]: [VertexAI.GoogleAuthError]: Unable to authenticate your request
```

## Root Cause

The Vertex AI service needs authentication credentials:
- **Local Development**: Uses `GOOGLE_APPLICATION_CREDENTIALS` (path to JSON file) ✅ Working
- **Production (Vercel)**: Needs `GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY` (base64 encoded JSON) ❌ Missing

## Solution Steps

### 1. Generate Base64 Google Cloud Credentials

First, locate your Google Cloud service account JSON file. If you don't have one:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **IAM & Admin > Service Accounts**
4. Create a new service account or select existing one
5. Click **Keys** tab > **Add Key** > **Create new key**
6. Choose **JSON** format and download

Then run the script:

```bash
npx tsx src/scripts/generate-gcloud-base64.ts path/to/your-service-account-key.json
```

This will:
- Validate your service account key
- Generate a base64-encoded version
- Save it to `gcloud-service-account-base64.txt`
- Display instructions for Vercel

### 2. Add to Vercel Environment Variables

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`mustard`)
3. Go to **Settings** > **Environment Variables**
4. Add these variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY` | [paste base64 string from step 1] | Production, Preview |
| `GOOGLE_CLOUD_PROJECT_ID` | [your-project-id from JSON] | Production, Preview |
| `GOOGLE_CLOUD_REGION` | `us-central1` (or your region) | Production, Preview |

### 3. Verify Configuration

Run the diagnostic script locally to ensure everything is set up correctly:

```bash
npx tsx src/scripts/test-vertex-ai-config.ts
```

This will show:
- Current environment variables
- Vertex AI service status
- Available AI agents
- Test API connection

### 4. Redeploy to Vercel

After adding the environment variables:

```bash
vercel --prod
```

Or trigger a redeployment from the Vercel dashboard.

## Service Account Permissions

Ensure your Google Cloud service account has these roles:
- **Vertex AI User** (`roles/aiplatform.user`)
- **Service Usage Consumer** (`roles/serviceusage.serviceUsageConsumer`)

To add permissions:
1. Go to [IAM page](https://console.cloud.google.com/iam-admin/iam)
2. Find your service account
3. Click edit (pencil icon)
4. Add the required roles

## Testing the Fix

After deployment, test the chat feature on your production site:
1. Go to https://mustard-lake.vercel.app/chat
2. Send a message to any AI agent
3. Check Vercel logs for any errors

## Security Notes

- **Never commit** the service account JSON or base64 string to git
- Delete `gcloud-service-account-base64.txt` after adding to Vercel
- Use Vercel's environment variables for all sensitive data
- Consider using different service accounts for dev/staging/production

## Troubleshooting

If you still see authentication errors:

1. **Check Project ID**: Ensure `GOOGLE_CLOUD_PROJECT_ID` matches your service account's project
2. **Verify Permissions**: Service account needs Vertex AI permissions
3. **Region Mismatch**: Some models are region-specific
4. **Quota Limits**: Check Google Cloud quotas for Vertex AI

## Local Development

For local development, keep using the file path method in `.env.local`:
```
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_REGION=us-central1
```

This approach keeps local and production configurations separate and secure.
