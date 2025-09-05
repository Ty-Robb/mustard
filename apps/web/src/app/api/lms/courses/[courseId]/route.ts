import { NextRequest, NextResponse } from 'next/server';
import { getLMSService } from '@/lib/services/lms.service';
import { adminAuth } from '@/lib/firebase-admin';
import { getDatabase } from '@/lib/mongodb';
import { sampleCourses } from '@/lib/data/sample-courses';
import { ObjectId } from 'mongodb';

// Enhanced logging utility
function logAPI(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [LMS Course API] [${level.toUpperCase()}] ${message}`;
  
  if (data) {
    console[level](logMessage, data);
  } else {
    console[level](logMessage);
  }
}

// GET: Get a single course by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const startTime = Date.now();
  const { courseId } = await params;
  
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
      logAPI('info', `Authenticated user: ${userId} requesting course: ${courseId}`);
    } catch (authError) {
      logAPI('error', 'Token verification failed', authError);
      return NextResponse.json({ 
        error: 'Invalid token',
        message: 'Your authentication token is invalid or expired' 
      }, { status: 401 });
    }

    // Initialize LMS service
    const lmsService = getLMSService(userId);
    
    // Try to get course from database first
    let course = null;
    let isFromDatabase = true;
    
    try {
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
      
      if (db) {
        const coursesCollection = db.collection('lmsCourses');
        
        // First try to find by regular id field
        course = await coursesCollection.findOne({ id: courseId });
        
        // If not found and courseId looks like an ObjectId, try searching by _id
        if (!course && /^[0-9a-fA-F]{24}$/.test(courseId)) {
          logAPI('info', `Trying to find course by ObjectId: ${courseId}`);
          try {
            course = await coursesCollection.findOne({ _id: new ObjectId(courseId) });
            if (course) {
              logAPI('info', `Found course by ObjectId, actual id: ${course.id}`);
            }
          } catch (objectIdError) {
            logAPI('warn', `Invalid ObjectId format: ${courseId}`, objectIdError);
          }
        }
        
        if (course) {
          logAPI('info', `Found course ${course.id || courseId} in database`);
          // Remove MongoDB _id field to prevent confusion
          const { _id, ...courseWithoutId } = course;
          course = courseWithoutId;
        } else {
          logAPI('info', `Course ${courseId} not found in database`);
        }
      }
    } catch (dbError) {
      logAPI('warn', 'Database error, falling back to sample data', dbError);
      isFromDatabase = false;
    }
    
    // If not found in database, try sample courses
    if (!course) {
      course = sampleCourses.find(c => c.id === courseId);
      isFromDatabase = false;
      
      if (course) {
        logAPI('info', `Found course ${courseId} in sample data`);
        // Add metadata to match database format
        course = {
          ...course,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          isActive: true,
          enrollmentCount: course.enrollmentCount || 0,
        };
      }
    }
    
    // If still not found, return 404
    if (!course) {
      logAPI('warn', `Course ${courseId} not found in database or sample data`);
      return NextResponse.json({ 
        error: 'Course not found',
        message: `No course found with ID: ${courseId}` 
      }, { status: 404 });
    }
    
    // Get user's progress for this course (if enrolled)
    let userProgress = null;
    try {
      const enrollments = await lmsService.getUserEnrollments();
      userProgress = enrollments.find(e => e.courseId === courseId);
    } catch (progressError) {
      logAPI('warn', 'Failed to fetch user progress', progressError);
      // Continue without progress data
    }
    
    const duration = Date.now() - startTime;
    logAPI('info', `Request completed in ${duration}ms`);
    
    return NextResponse.json({
      course,
      userProgress,
      meta: {
        source: isFromDatabase ? 'database' : 'sample',
        timestamp: new Date().toISOString(),
        duration
      }
    });
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logAPI('error', `Request failed after ${duration}ms`, {
      error: error.message,
      stack: error.stack,
      courseId
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
        requestId: Math.random().toString(36).substring(7)
      },
      { status: statusCode }
    );
  }
}

// PUT: Update a course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const startTime = Date.now();
  const { courseId } = await params;
  
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    logAPI('info', `User ${userId} updating course: ${courseId}`);
    
    const body = await request.json();
    const db = await getDatabase();
    const coursesCollection = db.collection('lmsCourses');
    
    // First, check if the course exists and if the user owns it
    const existingCourse = await coursesCollection.findOne({ id: courseId });
    
    if (!existingCourse) {
      return NextResponse.json({ 
        error: 'Course not found',
        message: `No course found with ID: ${courseId}` 
      }, { status: 404 });
    }
    
    // Check ownership
    if (existingCourse.createdBy !== userId) {
      logAPI('warn', `User ${userId} attempted to update course ${courseId} owned by ${existingCourse.createdBy}`);
      return NextResponse.json({ 
        error: 'Forbidden',
        message: 'You do not have permission to update this course' 
      }, { status: 403 });
    }
    
    // Update course data
    const updateData = {
      ...body,
      updatedAt: new Date(),
    };
    
    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;
    
    // Update the course
    const result = await coursesCollection.updateOne(
      { id: courseId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        error: 'Course not found',
        message: `No course found with ID: ${courseId}` 
      }, { status: 404 });
    }
    
    logAPI('info', `Course ${courseId} updated successfully`);
    
    return NextResponse.json({ 
      message: 'Course updated successfully',
      courseId 
    });
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logAPI('error', `PUT request failed after ${duration}ms`, error);
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const startTime = Date.now();
  const { courseId } = await params;
  
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    logAPI('info', `User ${userId} deleting course: ${courseId}`);
    
    const db = await getDatabase();
    const coursesCollection = db.collection('lmsCourses');
    
    // First, check if the course exists and if the user owns it
    const existingCourse = await coursesCollection.findOne({ id: courseId });
    
    if (!existingCourse) {
      return NextResponse.json({ 
        error: 'Course not found',
        message: `No course found with ID: ${courseId}` 
      }, { status: 404 });
    }
    
    // Check ownership
    if (existingCourse.createdBy !== userId) {
      logAPI('warn', `User ${userId} attempted to delete course ${courseId} owned by ${existingCourse.createdBy}`);
      return NextResponse.json({ 
        error: 'Forbidden',
        message: 'You do not have permission to delete this course' 
      }, { status: 403 });
    }
    
    // Delete the course
    const result = await coursesCollection.deleteOne({ id: courseId });
    
    // TODO: Also delete related progress records
    
    logAPI('info', `Course ${courseId} deleted successfully`);
    
    return NextResponse.json({ 
      message: 'Course deleted successfully',
      courseId 
    });
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logAPI('error', `DELETE request failed after ${duration}ms`, error);
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
