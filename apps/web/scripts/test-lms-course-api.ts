import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testLMSCourseAPI() {
  console.log('Testing LMS Course API\n');

  // Test course IDs
  const testCourseIds = [
    'biblical-hermeneutics-101',
    'foundations-christian-theology',
    'youth-ministry-essentials',
    'invalid-course-id' // Test 404 case
  ];

  // Get a test token (you'll need to replace this with a valid token)
  const token = process.env.TEST_AUTH_TOKEN || 'your-test-token-here';

  if (!token || token === 'your-test-token-here') {
    console.error('Please set TEST_AUTH_TOKEN in your .env.local file');
    console.log('\nTo get a token, you can:');
    console.log('1. Log into the app in your browser');
    console.log('2. Open DevTools and run: firebase.auth().currentUser.getIdToken().then(console.log)');
    console.log('3. Copy the token and add to .env.local as TEST_AUTH_TOKEN=<token>');
    return;
  }

  for (const courseId of testCourseIds) {
    console.log(`\nTesting course: ${courseId}`);
    console.log('-'.repeat(50));

    try {
      const response = await fetch(`http://localhost:9001/api/lms/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log(`Status: ${response.status} ${response.statusText}`);

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Course found: ${data.course.title}`);
        console.log(`   Modules: ${data.course.modules.length}`);
        console.log(`   Total Steps: ${data.course.modules.reduce((acc: number, m: any) => acc + m.steps.length, 0)}`);
        console.log(`   Source: ${data.meta.source}`);
        console.log(`   Response time: ${data.meta.duration}ms`);
        
        if (data.userProgress) {
          console.log(`   User Progress: ${data.userProgress.overallProgress}%`);
        } else {
          console.log(`   User Progress: Not enrolled`);
        }
      } else {
        console.log(`❌ Error: ${data.error}`);
        console.log(`   Message: ${data.message}`);
      }
    } catch (error) {
      console.error(`❌ Request failed:`, error);
    }
  }

  console.log('\n✅ API test complete!');
}

// Run the test
testLMSCourseAPI().catch(console.error);
