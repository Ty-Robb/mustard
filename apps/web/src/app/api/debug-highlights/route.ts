import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getUserDatabase } from '@/lib/utils/user-db';

// GET /api/debug-highlights - Debug endpoint to check highlights
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let userId: string;
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get direct database access
    const db = await getUserDatabase(userId);
    const highlights = db.collection('highlights');
    
    // Get all highlights
    const allHighlights = await highlights.find({}).toArray();
    
    // Get manual highlights
    const manualHighlights = await highlights.find({ type: 'manual' }).toArray();
    
    // Test Genesis 1 query
    const genesisQuery = {
      $or: [
        { reference: { $regex: '^GEN\\.1\\.', $options: 'i' } },
        { reference: { $regex: '^GENESIS\\.1\\.', $options: 'i' } },
        { reference: { $regex: '^Genesis\\s+1:', $options: 'i' } },
        { reference: { $regex: '^Genesis\\s+1\\.', $options: 'i' } },
        { reference: 'Genesis 1' }
      ]
    };
    const genesisHighlights = await highlights.find(genesisQuery).toArray();

    return NextResponse.json({
      userId,
      totalHighlights: allHighlights.length,
      manualHighlights: manualHighlights.length,
      genesisHighlights: genesisHighlights.length,
      allHighlightReferences: allHighlights.map(h => ({
        ref: h.reference,
        type: h.type,
        text: h.text.substring(0, 30) + '...'
      })),
      genesisQueryUsed: genesisQuery
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
