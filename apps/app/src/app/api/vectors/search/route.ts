import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { getUsersCollection } from '@/lib/mongodb';
import { vectorService } from '@/lib/services/vector.service';
import { UserVector, VectorSearchResult } from '@/types/vectors';

// Search user's vectors using semantic similarity
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
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    const contentType = searchParams.get('contentType') as UserVector['contentType'] | null;
    const minScore = parseFloat(searchParams.get('minScore') || '0.7');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Search vectors
    const results = await vectorService.searchUserVectors(
      user._id.toString(),
      query,
      {
        limit,
        contentType: contentType || undefined,
        minScore,
      }
    );

    return NextResponse.json({
      success: true,
      query,
      results: results.map((r: VectorSearchResult) => ({
        _id: r._id,
        content: r.content,
        contentType: r.contentType,
        metadata: r.metadata,
        score: r.score,
      })),
      count: results.length,
    });
  } catch (error) {
    console.error('Error searching vectors:', error);
    return NextResponse.json(
      { error: 'Failed to search vectors' },
      { status: 500 }
    );
  }
}
