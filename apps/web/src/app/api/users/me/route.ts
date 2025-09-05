import { NextRequest, NextResponse } from 'next/server';
import { getUsersCollection } from '@/lib/mongodb';
import { verifyIdToken } from '@/lib/firebase-admin';

// Get current user data
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

    // Get users collection
    const usersCollection = await getUsersCollection();

    // Find user by Firebase UID
    const user = await usersCollection.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// Update current user data
export async function PATCH(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the ID token
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);

    // Get update data from request body
    const updates = await request.json();

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.firebaseUid;
    delete updates.email;
    delete updates.createdAt;

    // Add updated timestamp
    updates.updatedAt = new Date();

    // Get users collection
    const usersCollection = await getUsersCollection();

    // Update user
    const result = await usersCollection.findOneAndUpdate(
      { firebaseUid: decodedToken.uid },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Delete current user
export async function DELETE(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the ID token
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);

    // Get users collection
    const usersCollection = await getUsersCollection();

    // Delete user
    const result = await usersCollection.deleteOne({ firebaseUid: decodedToken.uid });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // TODO: Also delete user's data from other collections (reading plans, quiz results, etc.)

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
