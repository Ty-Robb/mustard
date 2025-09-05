import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Initialize Firebase (you'll need to have valid credentials)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testVisualizationAPI() {
  console.log('🧪 Testing Visualization API\n');

  try {
    // First, we need to authenticate
    console.log('Authenticating...');
    const userCredential = await signInWithEmailAndPassword(
      auth,
      process.env.TEST_USER_EMAIL || 'test@example.com',
      process.env.TEST_USER_PASSWORD || 'testpassword'
    );
    
    const token = await userCredential.user.getIdToken();
    console.log('✅ Got auth token');

    // Test cases
    const testCases = [
      {
        name: 'Chart Generation',
        text: 'Our quarterly sales: Q1 $1.2M, Q2 $1.5M, Q3 $1.8M, Q4 $2.1M',
        type: 'chart'
      },
      {
        name: 'Table Generation',
        text: 'Compare products: iPhone 15 Pro ($999, 4.8 rating), Galaxy S24 ($899, 4.6 rating)',
        type: 'table'
      },
      {
        name: 'Auto Detection',
        text: 'Monthly attendance grew from 100 in January to 500 in June',
        type: 'auto'
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📊 Testing: ${testCase.name}`);
      console.log(`   Text: "${testCase.text}"`);
      console.log(`   Type: ${testCase.type}`);

      try {
        const response = await fetch('http://localhost:3000/api/visualizations/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            text: testCase.text,
            type: testCase.type
          })
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);

        const data = await response.json();
        
        if (!response.ok) {
          console.error('   ❌ Error:', data);
        } else {
          console.log('   ✅ Success!');
          console.log('   Response:', JSON.stringify(data, null, 2));
        }
      } catch (error) {
        console.error('   ❌ Request failed:', error);
      }
    }
  } catch (error) {
    console.error('Authentication failed:', error);
  }
}

// Run the test
testVisualizationAPI().catch(console.error);
