import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
function initAdmin() {
  if (getApps().length === 0) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    if (!projectId) {
      throw new Error('Firebase project ID is not set in environment variables');
    }

    // Check for base64-encoded service account (preferred for production)
    const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (base64ServiceAccount) {
      try {
        // Decode base64 service account
        const serviceAccountJson = Buffer.from(base64ServiceAccount, 'base64').toString('utf-8');
        const serviceAccount = JSON.parse(serviceAccountJson);
        
        initializeApp({
          credential: cert(serviceAccount),
          projectId,
        });
        
        console.log('[Firebase Admin] Initialized with service account credentials');
      } catch (error) {
        console.error('[Firebase Admin] Error parsing service account:', error);
        throw new Error('Invalid Firebase service account configuration');
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Fallback to file path (for local development)
      try {
        const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        
        initializeApp({
          credential: cert(serviceAccount),
          projectId,
        });
        
        console.log('[Firebase Admin] Initialized with service account file');
      } catch (error) {
        console.error('[Firebase Admin] Error loading service account file:', error);
        throw new Error('Invalid Firebase service account file');
      }
    } else {
      // No credentials provided - this will fail in production
      console.warn('[Firebase Admin] No service account credentials provided');
      throw new Error('Firebase Admin SDK requires service account credentials. Please set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS environment variable.');
    }
  }
}

// Initialize admin on module load
initAdmin();

// Export admin services
export const adminAuth = getAuth();
export const adminDb = getFirestore();

// Verify ID token from client
export async function verifyIdToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw error;
  }
}

// Create custom token for user
export async function createCustomToken(uid: string, claims?: object) {
  try {
    const token = await adminAuth.createCustomToken(uid, claims);
    return token;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw error;
  }
}

// Get user by email
export async function getUserByEmail(email: string) {
  try {
    const user = await adminAuth.getUserByEmail(email);
    return user;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

// Create user
export async function createUser(email: string, password: string, displayName?: string) {
  try {
    const user = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Set custom user claims
export async function setCustomUserClaims(uid: string, claims: object) {
  try {
    await adminAuth.setCustomUserClaims(uid, claims);
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw error;
  }
}
