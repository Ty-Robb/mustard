import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { highlightsService } from '@/lib/services/highlights.service';
import { CreateHighlightInput } from '@/types/highlights';

// GET /api/highlights - Get user's highlights
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const type = searchParams.get('type') as any;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const search = searchParams.get('search');
    const sessionId = searchParams.get('sessionId');

    // If reference provided, get highlights for that reference
    if (reference) {
      console.log('API: Getting highlights for reference:', reference, 'userId:', userId);
      const highlights = await highlightsService.getHighlightsByReference(userId, reference);
      console.log('API: Found highlights:', highlights.length);
      console.log('API: Highlight details:', highlights.map(h => ({ 
        type: h.type, 
        reference: h.reference,
        text: h.text.substring(0, 50) + '...'
      })));
      return NextResponse.json({ highlights });
    }

    // If sessionId provided, get AI highlights for that session
    if (sessionId) {
      const highlights = await highlightsService.getHighlightsBySession(userId, sessionId);
      return NextResponse.json({ highlights });
    }

    // If search term provided, use search function
    if (search) {
      const highlights = await highlightsService.searchHighlights(userId, search, limit);
      return NextResponse.json({ highlights });
    }

    // Otherwise get highlights with filters
    const highlights = await highlightsService.getUserHighlights(userId, {
      type,
      tags,
      limit,
      skip,
    });

    return NextResponse.json({ highlights });
  } catch (error) {
    console.error('Error fetching highlights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch highlights' },
      { status: 500 }
    );
  }
}

// POST /api/highlights - Create a new highlight
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body: CreateHighlightInput = await request.json();

    // Validate required fields
    if (!body.reference || !body.text || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: reference, text, type' },
        { status: 400 }
      );
    }

    // Create highlight
    const highlight = await highlightsService.createHighlight(userId, body);

    return NextResponse.json({ highlight }, { status: 201 });
  } catch (error) {
    console.error('Error creating highlight:', error);
    return NextResponse.json(
      { error: 'Failed to create highlight' },
      { status: 500 }
    );
  }
}

// DELETE /api/highlights/:id - Delete a highlight
export async function DELETE(request: NextRequest) {
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

    // Get highlight ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const highlightId = pathParts[pathParts.length - 1];

    if (!highlightId || highlightId === 'highlights') {
      return NextResponse.json(
        { error: 'Highlight ID required' },
        { status: 400 }
      );
    }

    // Delete highlight
    const success = await highlightsService.deleteHighlight(userId, highlightId);

    if (!success) {
      return NextResponse.json(
        { error: 'Highlight not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting highlight:', error);
    return NextResponse.json(
      { error: 'Failed to delete highlight' },
      { status: 500 }
    );
  }
}
