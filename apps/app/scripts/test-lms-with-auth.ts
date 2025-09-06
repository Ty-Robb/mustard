import { config } from 'dotenv';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function testLMSWithAuth() {
  console.log('Testing LMS with Authentication...\n');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    // Sign in with test credentials
    console.log('1. Signing in with test credentials...');
    const userCredential = await signInWithEmailAndPassword(
      auth,
      'test@example.com',
      'password123'
    );
    
    console.log('Signed in successfully!');
    console.log('User ID:', userCredential.user.uid);
    
    // Get auth token
    const token = await userCredential.user.getIdToken();
    console.log('Got auth token:', token.substring(0, 20) + '...');
    
    // Test API with auth
    console.log('\n2. Testing API with authentication:');
    const courseId = 'intro-to-bible-study';
    const url = `http://localhost:9001/api/lms/courses/${courseId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\nCourse Data:');
      console.log('- ID:', data.course?.id);
      console.log('- Title:', data.course?.title);
      console.log('- Description:', data.course?.description);
      console.log('- Modules:', data.course?.modules?.length);
      console.log('- Source:', data.meta?.source);
    } else {
      const text = await response.text();
      console.log('Error Response:', text);
    }
    
    // Sign out
    await auth.signOut();
    console.log('\n3. Signed out successfully');
    
  } catch (error: any) {
    console.error('Error:', error);
    if (error?.code === 'auth/invalid-credential') {
      console.log('\nNote: Test credentials are invalid. You need to create a test user or use valid credentials.');
    }
  }
}

testLMSWithAuth();
