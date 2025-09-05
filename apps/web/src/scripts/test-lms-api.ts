import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Firebase
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

// Test configuration
const API_BASE_URL = 'http://localhost:3000/api';
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function getAuthToken(): Promise<string> {
  try {
    console.log(`${colors.cyan}Authenticating user...${colors.reset}`);
    const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    const token = await userCredential.user.getIdToken();
    console.log(`${colors.green}✓ Authentication successful${colors.reset}`);
    return token;
  } catch (error) {
    console.error(`${colors.red}✗ Authentication failed:${colors.reset}`, error);
    throw error;
  }
}

async function testGetCourses(token: string) {
  console.log(`\n${colors.blue}Testing GET /api/lms/courses${colors.reset}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/lms/courses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`${colors.green}✓ Get courses successful${colors.reset}`);
      console.log(`  Found ${data.courses?.length || 0} courses`);
      
      // Display first course as sample
      if (data.courses?.length > 0) {
        const firstCourse = data.courses[0];
        console.log(`\n  Sample course:`);
        console.log(`    ID: ${firstCourse.id}`);
        console.log(`    Title: ${firstCourse.title}`);
        console.log(`    Difficulty: ${firstCourse.difficulty}`);
        console.log(`    Modules: ${firstCourse.modules?.length || 0}`);
      }
    } else {
      console.error(`${colors.red}✗ Get courses failed:${colors.reset}`, data.error);
    }
    
    return data;
  } catch (error) {
    console.error(`${colors.red}✗ Get courses error:${colors.reset}`, error);
    throw error;
  }
}

async function testGetEnrollments(token: string) {
  console.log(`\n${colors.blue}Testing GET /api/lms/courses?type=enrollments${colors.reset}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/lms/courses?type=enrollments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`${colors.green}✓ Get enrollments successful${colors.reset}`);
      console.log(`  Found ${data.enrollments?.length || 0} enrollments`);
      
      if (data.enrollments?.length > 0) {
        data.enrollments.forEach((enrollment: any, index: number) => {
          console.log(`\n  Enrollment ${index + 1}:`);
          console.log(`    Course ID: ${enrollment.courseId}`);
          console.log(`    Progress: ${enrollment.overallProgress}%`);
          console.log(`    Completed Steps: ${enrollment.completedSteps?.length || 0}`);
        });
      }
    } else {
      console.error(`${colors.red}✗ Get enrollments failed:${colors.reset}`, data.error);
    }
    
    return data;
  } catch (error) {
    console.error(`${colors.red}✗ Get enrollments error:${colors.reset}`, error);
    throw error;
  }
}

async function testEnrollInCourse(token: string, courseId: string) {
  console.log(`\n${colors.blue}Testing POST /api/lms/courses (Enroll)${colors.reset}`);
  console.log(`  Course ID: ${courseId}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/lms/courses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courseId }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`${colors.green}✓ Enrollment successful${colors.reset}`);
      console.log(`  Progress ID: ${data.progress?.id}`);
      console.log(`  Current Step: ${data.progress?.currentStepId}`);
      console.log(`  Overall Progress: ${data.progress?.overallProgress}%`);
    } else {
      console.error(`${colors.red}✗ Enrollment failed:${colors.reset}`, data.error);
    }
    
    return data;
  } catch (error) {
    console.error(`${colors.red}✗ Enrollment error:${colors.reset}`, error);
    throw error;
  }
}

async function testFilteredCourses(token: string) {
  console.log(`\n${colors.blue}Testing filtered course queries${colors.reset}`);
  
  // Test difficulty filter
  console.log(`\n${colors.cyan}Testing difficulty filter (beginner)${colors.reset}`);
  try {
    const response = await fetch(`${API_BASE_URL}/lms/courses?difficulty=beginner`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    console.log(`  Found ${data.courses?.length || 0} beginner courses`);
  } catch (error) {
    console.error(`${colors.red}✗ Difficulty filter error:${colors.reset}`, error);
  }

  // Test category filter
  console.log(`\n${colors.cyan}Testing category filter (biblical-studies)${colors.reset}`);
  try {
    const response = await fetch(`${API_BASE_URL}/lms/courses?category=biblical-studies`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    console.log(`  Found ${data.courses?.length || 0} biblical studies courses`);
  } catch (error) {
    console.error(`${colors.red}✗ Category filter error:${colors.reset}`, error);
  }

  // Test search
  console.log(`\n${colors.cyan}Testing search (hermeneutics)${colors.reset}`);
  try {
    const response = await fetch(`${API_BASE_URL}/lms/courses?search=hermeneutics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    console.log(`  Found ${data.courses?.length || 0} courses matching "hermeneutics"`);
  } catch (error) {
    console.error(`${colors.red}✗ Search error:${colors.reset}`, error);
  }
}

async function runTests() {
  console.log(`${colors.yellow}=== LMS API Test Suite ===${colors.reset}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Test User: ${TEST_EMAIL}\n`);

  try {
    // Get authentication token
    const token = await getAuthToken();

    // Test getting all courses
    const coursesData = await testGetCourses(token);

    // Test getting user enrollments
    await testGetEnrollments(token);

    // Test enrolling in a course (if courses exist)
    if (coursesData.courses?.length > 0) {
      const firstCourse = coursesData.courses[0];
      await testEnrollInCourse(token, firstCourse.id);
      
      // Check enrollments again after enrollment
      console.log(`\n${colors.cyan}Checking enrollments after enrollment...${colors.reset}`);
      await testGetEnrollments(token);
    }

    // Test filtered queries
    await testFilteredCourses(token);

    console.log(`\n${colors.green}=== All tests completed ===${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}=== Test suite failed ===${colors.reset}`, error);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
