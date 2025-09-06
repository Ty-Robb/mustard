import { NextRequest, NextResponse } from 'next/server';
import { getLMSService } from '@/lib/services/lms.service';
import { adminAuth } from '@/lib/firebase-admin';
import { sampleCourses } from '@/lib/data/sample-courses';
import { getDatabase } from '@/lib/mongodb';

// Enhanced logging utility
function logAPI(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [LMS API] [${level.toUpperCase()}] ${message}`;
  
  if (data) {
    console[level](logMessage, data);
  } else {
    console[level](logMessage);
  }
}

// GET: Get all courses or user's enrollments
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      logAPI('warn', 'Unauthorized request - missing or invalid auth header');
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Please provide a valid authentication token' 
      }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let userId: string;
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
      logAPI('info', `Authenticated user: ${userId}`);
    } catch (authError) {
      logAPI('error', 'Token verification failed', authError);
      return NextResponse.json({ 
        error: 'Invalid token',
        message: 'Your authentication token is invalid or expired' 
      }, { status: 401 });
    }

    // Initialize LMS service
    const lmsService = getLMSService(userId);
    
    // Database connection with retry logic
    let db;
    let retries = 3;
    while (retries > 0) {
      try {
        db = await getDatabase();
        break;
      } catch (dbError) {
        retries--;
        logAPI('warn', `Database connection failed, retries left: ${retries}`, dbError);
        if (retries === 0) {
          throw new Error('Failed to connect to database after multiple attempts');
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      }
    }
    
    if (!db) {
      throw new Error('Database connection unavailable');
    }
    
    const coursesCollection = db.collection('lmsCourses');
    
    // Check and seed courses if needed
    try {
      const courseCount = await coursesCollection.countDocuments();
      logAPI('info', `Found ${courseCount} courses in database`);
      
      if (courseCount === 0) {
        logAPI('info', 'No courses found, seeding sample courses...');
        
        // Add metadata to sample courses
        const coursesWithMetadata = sampleCourses.map(course => ({
          ...course,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          isActive: true,
          enrollmentCount: course.enrollmentCount || 0,
        }));
        
        const result = await coursesCollection.insertMany(coursesWithMetadata as any);
        logAPI('info', `Successfully seeded ${result.insertedCount} courses`);
        
        // Create indexes for better performance
        await coursesCollection.createIndex({ id: 1 }, { unique: true });
        await coursesCollection.createIndex({ category: 1 });
        await coursesCollection.createIndex({ difficulty: 1 });
        await coursesCollection.createIndex({ isActive: 1 });
      }
    } catch (seedError) {
      logAPI('error', 'Failed to seed courses', seedError);
      // Continue without seeding - don't fail the entire request
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isAdmin = searchParams.get('admin') === 'true';
    
    logAPI('info', `Request type: ${type || 'all courses'}`, { 
      filters: Object.fromEntries(searchParams.entries()) 
    });

    let responseData;
    
    if (type === 'enrollments') {
      // Get user's enrollments
      const enrollments = await lmsService.getUserEnrollments();
      logAPI('info', `Found ${enrollments.length} enrollments for user ${userId}`);
      responseData = { enrollments };
    } else if (type === 'recommended') {
      // Get recommended courses
      const recommended = await lmsService.getRecommendedCourses();
      logAPI('info', `Found ${recommended.length} recommended courses`);
      responseData = { courses: recommended };
    } else if (type === 'my-courses') {
      // Get courses created by the user
      const myCourses = await coursesCollection.find({ 
        createdBy: userId,
        isActive: { $ne: false }
      }).toArray();
      
      logAPI('info', `Found ${myCourses.length} courses created by user ${userId}`);
      
      // Clean up MongoDB _id fields
      const cleanedCourses = myCourses.map((course: any) => {
        const { _id, ...courseWithoutId } = course;
        return courseWithoutId;
      });
      
      responseData = { 
        courses: cleanedCourses,
        meta: {
          total: cleanedCourses.length,
          type: 'my-courses',
          timestamp: new Date().toISOString()
        }
      };
    } else {
      // Get all courses with optional filters
      const filters = {
        difficulty: searchParams.get('difficulty') as any,
        category: searchParams.get('category') || undefined,
        tags: searchParams.get('tags')?.split(',').filter(Boolean),
        searchQuery: searchParams.get('search') || undefined,
      };

      const courses = await lmsService.getCourses(filters);
      logAPI('info', `Found ${courses.length} courses matching filters`, filters);
      
      // Ensure we strip out MongoDB _id fields to prevent confusion
      const cleanedCourses = courses.map((course: any) => {
        if (course._id) {
          const { _id, ...courseWithoutId } = course;
          return courseWithoutId;
        }
        return course;
      });
      
      // Add response metadata
      responseData = { 
        courses: cleanedCourses,
        meta: {
          total: cleanedCourses.length,
          filters: filters,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    const duration = Date.now() - startTime;
    logAPI('info', `Request completed in ${duration}ms`);
    
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logAPI('error', `Request failed after ${duration}ms`, {
      error: error.message,
      stack: error.stack,
    });
    
    // Determine appropriate error response
    let statusCode = 500;
    let errorMessage = 'An unexpected error occurred';
    
    if (error.message?.includes('database')) {
      statusCode = 503;
      errorMessage = 'Database service temporarily unavailable';
    } else if (error.message?.includes('auth')) {
      statusCode = 401;
      errorMessage = 'Authentication failed';
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        message: errorMessage,
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substring(7) // Simple request ID for tracking
      },
      { status: statusCode }
    );
  }
}

// POST: Create a new course (admin) or enroll in a course (user)
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    
    // Check if this is a course creation request (has title) or enrollment request (has courseId)
    if (body.title) {
      // Course creation (admin only)
      logAPI('info', `Creating new course by user: ${userId}`);
      
      // TODO: Add admin check here
      // For now, we'll allow any authenticated user to create courses
      
      const db = await getDatabase();
      const coursesCollection = db.collection('lmsCourses');
      
      // Generate course ID
      const courseId = `course-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Prepare course data
      const courseData = {
        ...body,
        id: courseId,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        enrollmentCount: 0,
        isPublished: body.isPublished || false,
        rating: 0,
        ratingCount: 0,
      };
      
      // Insert course
      await coursesCollection.insertOne(courseData);
      
      logAPI('info', `Course created successfully: ${courseId}`);
      
      return NextResponse.json({ 
        courseId,
        message: 'Course created successfully' 
      });
      
    } else if (body.courseId) {
      // Course enrollment
      const { courseId } = body;
      logAPI('info', `User ${userId} enrolling in course: ${courseId}`);
      
      const lmsService = getLMSService(userId);
      const progress = await lmsService.enrollInCourse(courseId);

      return NextResponse.json({ progress });
    } else {
      return NextResponse.json({ 
        error: 'Invalid request',
        message: 'Please provide either course data for creation or courseId for enrollment' 
      }, { status: 400 });
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logAPI('error', `POST request failed after ${duration}ms`, error);
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
