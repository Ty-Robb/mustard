import { NextRequest, NextResponse } from 'next/server';
import { getChatService } from '@/lib/services/chat.service';
import { adminAuth } from '@/lib/firebase-admin';

// GET: Get all available agents
export async function GET(request: NextRequest) {
  try {
    console.log('[Agents API] Request received');
    
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[Agents API] No authorization header');
      return NextResponse.json({ error: 'Unauthorized - No authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('[Agents API] Verifying token...');
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError) {
      console.error('[Agents API] Token verification failed:', authError);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }
    
    const userId = decodedToken.uid;
    console.log('[Agents API] User authenticated:', userId);

    const chatService = getChatService(userId);
    const agents = await chatService.getAllAgents();
    
    console.log('[Agents API] Agents loaded:', agents.length);

    return NextResponse.json({ agents });
  } catch (error: any) {
    console.error('[Agents API] Error:', error);
    console.error('[Agents API] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Provide more specific error messages
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error.message?.includes('Firebase ID token has expired')) {
      errorMessage = 'Authentication token expired. Please sign in again.';
      statusCode = 401;
    } else if (error.message?.includes('Decoding Firebase ID token failed')) {
      errorMessage = 'Invalid authentication token. Please sign in again.';
      statusCode = 401;
    } else if (error.message?.includes('Firebase Admin SDK')) {
      errorMessage = 'Server authentication error. Please contact support.';
      statusCode = 500;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
