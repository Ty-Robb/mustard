import { NextRequest, NextResponse } from 'next/server';
import { getChatService } from '@/lib/services/chat.service';
import { adminAuth } from '@/lib/firebase-admin';
import { VisualizationParser } from '@/lib/utils/visualization-parser';
import { chatEnhancementService } from '@/lib/services/chat-enhancement.service';

// GET: Get all chat sessions or a specific session
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const chatService = getChatService(userId);

    // Check if requesting a specific session
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      const session = await chatService.getSession(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      
      // Debug log to check if attachments are being loaded
      console.log('[Chat API GET] Session loaded:', sessionId);
      const messagesWithAttachments = session.messages.filter(m => m.metadata?.attachments);
      console.log('[Chat API GET] Messages with attachments:', messagesWithAttachments.length);
      messagesWithAttachments.forEach((msg, index) => {
        console.log(`[Chat API GET] Message ${index} attachments:`, msg.metadata?.attachments);
      });
      
      return NextResponse.json({ session });
    } else {
      // Get all sessions
      const sessions = await chatService.getSessions();
      return NextResponse.json({ sessions });
    }
  } catch (error) {
    console.error('Chat API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new chat session or send a message
export async function POST(request: NextRequest) {
  try {
    console.log('[Chat API POST] Request received');
    
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[Chat API POST] No authorization header');
      return NextResponse.json({ error: 'Unauthorized - No authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('[Chat API POST] Verifying token...');
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError) {
      console.error('[Chat API POST] Token verification failed:', authError);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }
    
    const userId = decodedToken.uid;
    console.log('[Chat API POST] User authenticated:', userId);

    const chatService = getChatService(userId);
    const body = await request.json();
    console.log('[Chat API POST] Request body action:', body.action);

    // Check if creating a new session
    if (body.action === 'createSession') {
      const { title, agentId, lmsContext } = body;
      const session = await chatService.createSession(title || 'New Chat', agentId, lmsContext);
      return NextResponse.json({ session });
    }

    // Check if adding a message
    if (body.action === 'addMessage') {
      const { sessionId, message } = body;
      
      if (!sessionId || !message) {
        return NextResponse.json(
          { error: 'sessionId and message are required' },
          { status: 400 }
        );
      }

      const newMessage = await chatService.addMessage(sessionId, message);
      return NextResponse.json({ message: newMessage });
    }

    // Check if generating completion
    if (body.action === 'generateCompletion') {
      const { sessionId, messages, agentId, options, stream = false } = body;

      console.log('[Chat API POST] generateCompletion request:', {
        sessionId,
        messagesCount: messages?.length,
        agentId,
        stream
      });

      if (!messages || !agentId) {
        console.error('[Chat API POST] Missing required fields:', { messages: !!messages, agentId: !!agentId });
        return NextResponse.json(
          { error: 'messages and agentId are required' },
          { status: 400 }
        );
      }

      if (stream) {
        // Set up SSE headers
        const headers = new Headers({
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              let fullResponse = '';
              let summary = '';
              
              // Use the new dual response method
              const result = await chatService.generateCompletionWithSummary(
                messages,
                agentId,
                { ...options, stream: true },
                (chunk) => {
                  fullResponse += chunk;
                  const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
                  controller.enqueue(encoder.encode(data));
                },
                (summaryText) => {
                  summary = summaryText;
                  // Send summary as a special event
                  const summaryData = `data: ${JSON.stringify({ summary: summaryText })}\n\n`;
                  controller.enqueue(encoder.encode(summaryData));
                }
              );
              
              fullResponse = result.content;
              summary = result.summary;

              // Save the complete message if sessionId provided
              if (sessionId) {
                // Add user message
                await chatService.addMessage(sessionId, {
                  role: 'user',
                  content: messages[messages.length - 1].content,
                  metadata: { agentId }
                });

                // Process visualization data
                console.log('[Chat API] Processing visualization data...');
                const { cleanContent, attachments } = VisualizationParser.processResponse(fullResponse);
                console.log('[Chat API] Found attachments:', attachments.length);
                if (attachments.length > 0) {
                  console.log('[Chat API] Attachments:', JSON.stringify(attachments, null, 2));
                }

                // Enhance response with biblical references and suggestions
                const userMessage = messages[messages.length - 1].content;
                const enhancement = await chatEnhancementService.enhanceResponse(
                  userMessage,
                  cleanContent,
                  agentId
                );

                // Add assistant response with attachments and enhancements
                await chatService.addMessage(sessionId, {
                  role: 'assistant',
                  content: enhancement.content,
                  metadata: { 
                    agentId, 
                    model: options?.model,
                    attachments: attachments.length > 0 ? attachments : undefined,
                    suggestions: enhancement.suggestions,
                    biblicalReferences: enhancement.biblicalReferences
                  }
                });

                // Generate title if this is the first exchange
                const session = await chatService.getSession(sessionId);
                if (session && session.messages.length === 2 && session.title === 'New Chat') {
                  await chatService.generateSessionTitle(sessionId);
                }
              }

              // Send completion signal
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            } catch (error) {
              console.error('Streaming error:', error);
              const errorData = `data: ${JSON.stringify({ error: 'Stream error' })}\n\n`;
              controller.enqueue(encoder.encode(errorData));
              controller.close();
            }
          },
        });

        return new Response(stream, { headers });
      } else {
        // Non-streaming response
        const response = await chatService.generateCompletion(
          messages,
          agentId,
          options
        );

        // Process visualization data
        const { cleanContent, attachments } = VisualizationParser.processResponse(response);

        // Enhance response with biblical references and suggestions
        const userMessage = messages[messages.length - 1].content;
        const enhancement = await chatEnhancementService.enhanceResponse(
          userMessage,
          cleanContent,
          agentId
        );

        // Save messages if sessionId provided
        if (sessionId) {
          // Add user message
          await chatService.addMessage(sessionId, {
            role: 'user',
            content: messages[messages.length - 1].content,
            metadata: { agentId }
          });

          // Add assistant response with attachments and enhancements
          await chatService.addMessage(sessionId, {
            role: 'assistant',
            content: enhancement.content,
            metadata: { 
              agentId, 
              model: options?.model,
              attachments: attachments.length > 0 ? attachments : undefined,
              suggestions: enhancement.suggestions,
              biblicalReferences: enhancement.biblicalReferences
            }
          });
        }

        return NextResponse.json({ 
          content: enhancement.content,
          attachments: attachments.length > 0 ? attachments : undefined,
          suggestions: enhancement.suggestions,
          biblicalReferences: enhancement.biblicalReferences
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Chat API POST] Error:', error);
    console.error('[Chat API POST] Error details:', {
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

// DELETE: Delete a chat session
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const chatService = getChatService(userId);
    const deleted = await chatService.deleteSession(sessionId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chat API DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update a chat session (e.g., title)
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { sessionId, title, generateTitle } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const chatService = getChatService(userId);

    if (generateTitle) {
      // Auto-generate title based on messages
      const newTitle = await chatService.generateSessionTitle(sessionId);
      return NextResponse.json({ title: newTitle });
    } else if (title) {
      // Update title manually
      const updated = await chatService.updateSessionTitle(sessionId, title);
      
      if (!updated) {
        return NextResponse.json(
          { error: 'Session not found or unauthorized' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'No update action specified' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Chat API PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
