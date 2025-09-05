import { getDatabase } from '../lib/mongodb';
import { sampleCourses } from '../lib/data/sample-courses';
import { LMSCourse } from '../types/lms';

async function seedLMSCourses() {
  console.log('🌱 Starting LMS course seeding...');
  
  try {
    // Connect to database
    const db = await getDatabase();
    const coursesCollection = db.collection<LMSCourse>('lmsCourses');
    
    // Check existing courses
    const existingCount = await coursesCollection.countDocuments();
    console.log(`📊 Found ${existingCount} existing courses`);
    
    if (existingCount > 0) {
      console.log('⚠️  Courses already exist. Use --force to overwrite.');
      
      if (process.argv.includes('--force')) {
        console.log('🗑️  Removing existing courses...');
        await coursesCollection.deleteMany({});
      } else {
        console.log('ℹ️  Skipping seeding. Courses already exist.');
        process.exit(0);
      }
    }
    
    // Validate course structure
    console.log('✅ Validating course structure...');
    for (const course of sampleCourses) {
      validateCourse(course);
    }
    
    // Insert courses with timestamps
    const coursesWithMetadata = sampleCourses.map(course => ({
      ...course,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isActive: true,
      enrollmentCount: 0,
    }));
    
    console.log(`📝 Inserting ${coursesWithMetadata.length} courses...`);
    const result = await coursesCollection.insertMany(coursesWithMetadata);
    
    console.log(`✅ Successfully inserted ${result.insertedCount} courses`);
    
    // Verify insertion
    const insertedCourses = await coursesCollection.find({}).toArray();
    console.log('\n📚 Inserted courses:');
    insertedCourses.forEach(course => {
      console.log(`  - ${course.title} (${course.id})`);
      console.log(`    Modules: ${course.modules.length}`);
      console.log(`    Difficulty: ${course.difficulty}`);
      console.log(`    Category: ${course.category}`);
    });
    
    // Create indexes for better performance
    console.log('\n🔍 Creating indexes...');
    await coursesCollection.createIndex({ id: 1 }, { unique: true });
    await coursesCollection.createIndex({ category: 1 });
    await coursesCollection.createIndex({ difficulty: 1 });
    await coursesCollection.createIndex({ tags: 1 });
    await coursesCollection.createIndex({ isActive: 1 });
    
    console.log('✅ Indexes created successfully');
    console.log('\n🎉 Course seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding courses:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

function validateCourse(course: LMSCourse) {
  const requiredFields = ['id', 'title', 'description', 'difficulty', 'modules'];
  
  for (const field of requiredFields) {
    if (!course[field as keyof LMSCourse]) {
      throw new Error(`Course ${course.id || 'unknown'} is missing required field: ${field}`);
    }
  }
  
  // Validate modules
  if (!Array.isArray(course.modules) || course.modules.length === 0) {
    throw new Error(`Course ${course.id} must have at least one module`);
  }
  
  // Validate each module
  course.modules.forEach((module, moduleIndex) => {
    if (!module.steps || module.steps.length === 0) {
      throw new Error(`Module ${moduleIndex} in course ${course.id} must have at least one step`);
    }
    
    // Validate steps
    module.steps.forEach((step, stepIndex) => {
      if (!step.type || !step.agentId || !step.content) {
        throw new Error(`Step ${stepIndex} in module ${moduleIndex} of course ${course.id} is missing required fields`);
      }
    });
  });
}

// Run the seeding
seedLMSCourses();
