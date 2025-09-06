import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

async function testCourseFetch() {
  const courseId = 'intro-to-bible-study';
  const baseUrl = 'http://localhost:9001';
  
  console.log('Testing LMS Course Fetch...');
  console.log('Course ID:', courseId);
  console.log('Base URL:', baseUrl);
  
  try {
    // Test 1: Direct API call without auth
    console.log('\n1. Testing direct API call without auth:');
    const url1 = `${baseUrl}/api/lms/courses/${courseId}`;
    console.log('URL:', url1);
    
    const response1 = await fetch(url1);
    console.log('Status:', response1.status);
    console.log('Status Text:', response1.statusText);
    
    if (!response1.ok) {
      const text = await response1.text();
      console.log('Response:', text);
    }
    
    // Test 2: Test route
    console.log('\n2. Testing test route:');
    const url2 = `${baseUrl}/api/lms/courses/${courseId}/test`;
    console.log('URL:', url2);
    
    const response2 = await fetch(url2);
    console.log('Status:', response2.status);
    if (response2.ok) {
      const data = await response2.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
    // Test 3: List all courses
    console.log('\n3. Testing list all courses:');
    const url3 = `${baseUrl}/api/lms/courses`;
    console.log('URL:', url3);
    
    const response3 = await fetch(url3);
    console.log('Status:', response3.status);
    if (!response3.ok) {
      const text = await response3.text();
      console.log('Response:', text);
    }
    
    // Test 4: Check if route file exists
    console.log('\n4. Checking route file:');
    const fs = await import('fs/promises');
    const routePath = path.join(process.cwd(), 'src/app/api/lms/courses/[courseId]/route.ts');
    try {
      const stats = await fs.stat(routePath);
      console.log('Route file exists:', stats.isFile());
      console.log('File size:', stats.size, 'bytes');
      console.log('Last modified:', stats.mtime);
    } catch (err) {
      console.log('Route file not found:', err instanceof Error ? err.message : String(err));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCourseFetch();
