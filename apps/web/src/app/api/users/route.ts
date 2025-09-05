import { NextRequest, NextResponse } from 'next/server';
import { getUsersCollection } from '@/lib/mongodb';
import { verifyIdToken } from '@/lib/firebase-admin';
import { User } from '@/types';
import { createUserDatabase } from '@/lib/utils/user-db';

// Create a new user
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

    // Get user data from request body
    const body = await request.json();
    const { firebaseUid, email, displayName, photoURL } = body;

    // Validate that the token matches the user being created
    if (decodedToken.uid !== firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get users collection
    const usersCollection = await getUsersCollection();

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ firebaseUid });
    if (existingUser) {
      return NextResponse.json(existingUser);
    }

    // Generate a unique vector namespace for the user
    // Using a combination of timestamp and firebase UID for uniqueness
    const vectorNamespace = `user_${firebaseUid}_${Date.now()}`;

    // Create new user document
    const newUser: Omit<User, '_id'> = {
      firebaseUid,
      email,
      displayName,
      photoURL: photoURL || undefined,
      vectorNamespace,
      subscription: {
        tier: 'free',
      },
      preferences: {
        defaultTranslation: 'KJV',
        dailyGoal: 1,
        notifications: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert user into database
    const result = await usersCollection.insertOne(newUser);
    
    // Create user-specific database with collections
    try {
      await createUserDatabase(firebaseUid);
      console.log(`User database created for user ${firebaseUid}`);
    } catch (dbError) {
      console.error('Error creating user database:', dbError);
      // Don't fail user creation if database setup fails
    }
    
    // Return the created user
    const createdUser = {
      _id: result.insertedId.toString(),
      ...newUser,
    };

    return NextResponse.json(createdUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// Get all users (admin only - implement proper authorization)
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the ID token
    const token = authHeader.split('Bearer ')[1];
    await verifyIdToken(token);

    // TODO: Check if user is admin

    // Get users collection
    const usersCollection = await getUsersCollection();

    // Get all users
    const users = await usersCollection.find({}).toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
