import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getChatService } from '@/lib/services/chat.service';

// Define the request type for creating a session
interface CreateChatSessionRequest {
  title?: string;
  agentId?: string;
  context?: {
    bibleId: string;
    bookId: string;
    selectedText: string;
    reference: string;
  };
}

// GET /api/chat/sessions - Get user's chat sessions
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
    const bookId = searchParams.get('bookId');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const search = searchParams.get('search');

    // Get chat service instance for this user
    const chatService = getChatService(userId);
    
    // Get all sessions for the user
    const allSessions = await chatService.getSessions();
    
    // Apply filters manually since ChatService doesn't support them
    let filteredSessions = allSessions;
    
    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSessions = filteredSessions.filter(session => 
        session.title.toLowerCase().includes(searchLower) ||
        session.messages.some(msg => msg.content.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by bookId if provided
    // Note: bookId is not currently stored in metadata, so this filter won't work
    // unless we extend the ChatService to support it
    if (bookId) {
      // For now, we'll skip this filter since bookId isn't in the metadata
      console.warn('bookId filter requested but not supported by current ChatService');
    }
    
    // Filter by tags if provided
    if (tags && tags.length > 0) {
      filteredSessions = filteredSessions.filter(session => 
        session.metadata?.tags && 
        tags.some(tag => session.metadata?.tags?.includes(tag))
      );
    }
    
    // Apply pagination
    const paginatedSessions = filteredSessions.slice(skip, skip + limit);

    return NextResponse.json({ sessions: paginatedSessions });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}

// POST /api/chat/sessions - Create a new chat session
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
    const body: CreateChatSessionRequest = await request.json();

    // Validate required fields
    if (!body.context || !body.context.bibleId || !body.context.bookId || 
        !body.context.selectedText || !body.context.reference) {
      return NextResponse.json(
        { error: 'Missing required context fields' },
        { status: 400 }
      );
    }

    // Get chat service instance for this user
    const chatService = getChatService(userId);
    
    // Create session with title and optional agentId
    const session = await chatService.createSession(
      body.title || 'New Chat',
      body.agentId
    );
    
    // If we have initial context, we should add it as the first message
    if (body.context) {
      // Add a system message with the context
      const contextMessage = `Context: Reading from ${body.context.reference}\n\nSelected text: "${body.context.selectedText}"`;
      await chatService.addMessage(session.id, {
        role: 'system',
        content: contextMessage,
      });
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    );
  }
}
