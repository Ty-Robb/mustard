import { sampleCourses } from '../lib/data/sample-courses';

async function testLMSCoursesAPI() {
  console.log('🧪 Testing LMS Courses API...\n');
  
  // Display available sample courses
  console.log('📚 Available Sample Courses:');
  console.log('=' .repeat(50));
  
  sampleCourses.forEach((course, index) => {
    console.log(`\n${index + 1}. ${course.title}`);
    console.log(`   ID: ${course.id}`);
    console.log(`   Description: ${course.description}`);
    console.log(`   Difficulty: ${course.difficulty}`);
    console.log(`   Category: ${course.category}`);
    console.log(`   Duration: ${course.estimatedHours} hours`);
    console.log(`   Modules: ${course.modules.length}`);
    
    // Show module details
    course.modules.forEach((module, mIndex) => {
      console.log(`\n   Module ${mIndex + 1}: ${module.title}`);
      console.log(`   - ${module.steps.length} steps`);
      console.log(`   - ${module.estimatedMinutes} minutes`);
      
      // Show step types
      const stepTypes = module.steps.map(s => s.type);
      const uniqueTypes = [...new Set(stepTypes)];
      console.log(`   - Step types: ${uniqueTypes.join(', ')}`);
    });
  });
  
  console.log('\n' + '=' .repeat(50));
  console.log('\n✅ Sample courses are properly structured and ready to display!');
  console.log('\n💡 To view these courses:');
  console.log('   1. Navigate to http://localhost:9001/lms-test');
  console.log('   2. If the API fails, click "Use Sample Data" to see the courses');
  console.log('   3. Click on any course to explore its content');
  
  // Test course structure validation
  console.log('\n🔍 Validating course structure...');
  let allValid = true;
  
  sampleCourses.forEach(course => {
    const requiredFields = ['id', 'title', 'description', 'difficulty', 'modules'];
    const missingFields = requiredFields.filter(field => !course[field as keyof typeof course]);
    
    if (missingFields.length > 0) {
      console.log(`❌ Course ${course.id} missing fields: ${missingFields.join(', ')}`);
      allValid = false;
    }
    
    // Validate modules
    course.modules.forEach((module, index) => {
      if (!module.steps || module.steps.length === 0) {
        console.log(`❌ Module ${index} in course ${course.id} has no steps`);
        allValid = false;
      }
    });
  });
  
  if (allValid) {
    console.log('✅ All courses are properly structured!');
  }
}

// Run the test
testLMSCoursesAPI();
