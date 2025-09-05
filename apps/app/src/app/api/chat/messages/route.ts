import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getChatService } from '@/lib/services/chat.service';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Get messages for the session
    const chatService = getChatService(userId);
    const session = await chatService.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Apply pagination
    const messages = session.messages.slice(skip, skip + limit);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    
    if (error instanceof Error && error.message === 'Session not found') {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.sessionId || !body.role || !body.content) {
      return NextResponse.json(
        { error: 'sessionId, role, and content are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['user', 'assistant', 'system'].includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be user, assistant, or system' },
        { status: 400 }
      );
    }

    // Add the message
    const chatService = getChatService(userId);
    const message = await chatService.addMessage(body.sessionId, {
      role: body.role,
      content: body.content,
      metadata: body.metadata
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat message:', error);
    
    if (error instanceof Error && error.message === 'Session not found') {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create chat message' },
      { status: 500 }
    );
  }
}
