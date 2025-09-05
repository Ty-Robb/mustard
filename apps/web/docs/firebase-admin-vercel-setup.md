# Firebase Admin SDK Setup for Vercel Deployment

This guide explains how to configure Firebase Admin SDK for both local development and Vercel deployment.

## Problem

The Firebase Admin SDK requires service account credentials to authenticate server-side operations. Without proper configuration, you'll encounter the error:
```
Error: Neither apiKey nor config.authenticator provided
```

## Solution Overview

1. **Local Development**: Use the service account JSON file directly
2. **Production (Vercel)**: Use base64-encoded service account credentials as environment variable

## Step-by-Step Setup

### 1. Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the downloaded JSON file securely

### 2. Configure for Local Development

Add the service account JSON file to your project (but never commit it):
```bash
# Place the file in your project root or a secure location
cp ~/Downloads/your-service-account.json ./serviceAccountKey.json

# Make sure it's in .gitignore
echo "serviceAccountKey.json" >> .gitignore
```

### 3. Configure for Vercel Production

Convert the service account JSON to base64:

```bash
# On macOS/Linux
base64 -i serviceAccountKey.json

# On Windows (PowerShell)
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("serviceAccountKey.json"))
```

### 4. Set Environment Variables

#### Local (.env.local)
```env
# Firebase Admin SDK Service Account (base64 encoded)
FIREBASE_SERVICE_ACCOUNT=<your-base64-encoded-json>
```

#### Vercel Dashboard
1. Go to your project settings in Vercel
2. Navigate to **Environment Variables**
3. Add the following variable:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: The base64-encoded service account JSON
   - **Environment**: Production, Preview, Development (as needed)

### 5. Implementation

The `firebase-admin.ts` file is already configured to handle both scenarios:

```typescript
// Check for base64-encoded service account (preferred for production)
const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

if (base64ServiceAccount) {
  // Decode and use base64 service account
  const serviceAccountJson = Buffer.from(base64ServiceAccount, 'base64').toString('utf-8');
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  initializeApp({
    credential: cert(serviceAccount),
    projectId,
  });
}
```

## Security Best Practices

1. **Never commit service account files** to version control
2. **Use environment variables** for production deployments
3. **Limit service account permissions** to only what's needed
4. **Rotate credentials regularly**
5. **Use different service accounts** for development and production

## Troubleshooting

### Build Still Failing?

1. **Verify the base64 encoding**:
   ```bash
   # Test decoding
   echo $FIREBASE_SERVICE_ACCOUNT | base64 -d | jq .
   ```

2. **Check Vercel environment variables**:
   - Ensure no extra spaces or line breaks
   - Verify the variable name matches exactly
   - Check that it's enabled for the correct environments

3. **Clear Vercel cache**:
   - Trigger a new deployment with cache cleared
   - Use "Redeploy" → "Use existing Build Cache" unchecked

### Common Issues

- **Invalid base64**: Ensure you copied the entire base64 string
- **JSON parse errors**: Check for proper JSON formatting in the original file
- **Permission denied**: Verify the service account has necessary permissions

## Alternative: Using Individual Environment Variables

If base64 encoding causes issues, you can use individual environment variables:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Then update `firebase-admin.ts` to use these:
```typescript
credential: cert({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
})
```

## Summary

With this setup:
- ✅ Local development works with the service account file
- ✅ Vercel deployment works with base64-encoded credentials
- ✅ Service account files are never committed to git
- ✅ Firebase Admin SDK can authenticate properly in all environments
