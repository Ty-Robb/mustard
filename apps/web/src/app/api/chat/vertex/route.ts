import { NextRequest, NextResponse } from 'next/server';
import { getVertexAIService } from '@/lib/services/vertex-ai.service';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Parse request body
    const { agentId, messages, stream = false } = await request.json();

    if (!agentId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: agentId and messages are required' },
        { status: 400 }
      );
    }

    const vertexAI = getVertexAIService();

    // Validate agent exists
    const agent = vertexAI.getAgent(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: `Agent ${agentId} not found` },
        { status: 404 }
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
            await vertexAI.generateResponse(
              agentId,
              messages,
              (chunk) => {
                const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            );

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
      const response = await vertexAI.generateResponse(agentId, messages);
      
      return NextResponse.json({
        agentId,
        content: response,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Vertex AI API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get available agents
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(token);

    const vertexAI = getVertexAIService();
    const agents = vertexAI.getAllAgents();

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Get agents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
