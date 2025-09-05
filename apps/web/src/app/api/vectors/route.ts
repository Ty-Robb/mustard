import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { getUsersCollection } from '@/lib/mongodb';
import { vectorService } from '@/lib/services/vector.service';
import { UserVector } from '@/types/vectors';

// Store a new vector for the authenticated user
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the ID token
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);

    // Get the user from database
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get request body
    const body = await request.json();
    const { content, contentType, metadata } = body;

    // Validate required fields
    if (!content || !contentType) {
      return NextResponse.json(
        { error: 'Content and contentType are required' },
        { status: 400 }
      );
    }

    // Validate content type
    const validContentTypes = ['bible_note', 'prayer', 'study_note', 'reflection'];
    if (!validContentTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Store the vector
    const storedVector = await vectorService.storeUserVector(
      user._id.toString(),
      content,
      contentType as UserVector['contentType'],
      metadata
    );

    return NextResponse.json({
      success: true,
      data: {
        _id: storedVector._id,
        content: storedVector.content,
        contentType: storedVector.contentType,
        metadata: storedVector.metadata,
      }
    });
  } catch (error) {
    console.error('Error storing vector:', error);
    return NextResponse.json(
      { error: 'Failed to store vector' },
      { status: 500 }
    );
  }
}

// Get user's vectors
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the ID token
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);

    // Get the user from database
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const contentType = searchParams.get('contentType') as UserVector['contentType'] | null;

    // Get user's vectors
    const vectors = await vectorService.getUserVectors(user._id.toString(), {
      limit,
      skip,
      contentType: contentType || undefined,
    });

    return NextResponse.json({
      success: true,
      data: vectors.map((v: UserVector) => ({
        _id: v._id,
        content: v.content,
        contentType: v.contentType,
        metadata: v.metadata,
      })),
      pagination: {
        limit,
        skip,
        total: vectors.length,
      }
    });
  } catch (error) {
    console.error('Error fetching vectors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vectors' },
      { status: 500 }
    );
  }
}
