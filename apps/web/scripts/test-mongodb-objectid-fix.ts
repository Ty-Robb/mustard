import { config } from 'dotenv';
import path from 'path';
import { getDatabase } from '../lib/mongodb';
import { sampleCourses } from '../lib/data/sample-courses';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

async function testObjectIdFix() {
  console.log('Testing MongoDB ObjectId Fix...\n');
  
  try {
    const db = await getDatabase();
    const coursesCollection = db.collection('lmsCourses');
    
    // 1. Check what's in the database
    console.log('1. Checking courses in database:');
    const courses = await coursesCollection.find({}).limit(3).toArray();
    
    courses.forEach(course => {
      console.log(`\nCourse in DB:`);
      console.log(`  _id (ObjectId): ${course._id}`);
      console.log(`  id (string): ${course.id}`);
      console.log(`  title: ${course.title}`);
    });
    
    if (courses.length === 0) {
      console.log('\nNo courses found. Seeding sample courses...');
      
      // Add sample courses with proper id field
      const coursesWithMetadata = sampleCourses.map(course => ({
        ...course,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        isActive: true,
        enrollmentCount: course.enrollmentCount || 0,
      }));
      
      await coursesCollection.insertMany(coursesWithMetadata);
      console.log(`Seeded ${coursesWithMetadata.length} courses`);
    }
    
    // 2. Test finding by regular ID
    console.log('\n2. Testing find by regular ID:');
    const testId = 'intro-to-bible-study';
    const courseById = await coursesCollection.findOne({ id: testId });
    
    if (courseById) {
      console.log(`✅ Found course by id="${testId}"`);
      console.log(`   Title: ${courseById.title}`);
    } else {
      console.log(`❌ Could not find course by id="${testId}"`);
    }
    
    // 3. Test finding by ObjectId
    if (courses.length > 0) {
      console.log('\n3. Testing find by ObjectId:');
      const objectIdString = courses[0]._id.toString();
      const { ObjectId } = await import('mongodb');
      const courseByObjectId = await coursesCollection.findOne({ _id: new ObjectId(objectIdString) });
      
      if (courseByObjectId) {
        console.log(`✅ Found course by ObjectId="${objectIdString}"`);
        console.log(`   Actual id: ${courseByObjectId.id}`);
        console.log(`   Title: ${courseByObjectId.title}`);
      }
    }
    
    // 4. Test API response format
    console.log('\n4. Testing API response format (simulated):');
    const apiCourses = courses.map(course => {
      const { _id, ...courseWithoutId } = course;
      return courseWithoutId;
    });
    
    console.log('API would return courses without _id field:');
    apiCourses.slice(0, 1).forEach(course => {
      console.log(`  id: ${course.id}`);
      console.log(`  title: ${course.title}`);
      console.log(`  Has _id field: ${'_id' in course}`);
    });
    
    console.log('\n✅ MongoDB ObjectId fix test completed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testObjectIdFix();
