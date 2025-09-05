# Vertex AI Integration Guide

This guide covers the integration of Google Vertex AI into the Mustard AI chat system, enabling specialized AI agents for Bible study and theological research.

## Prerequisites

1. **Google Cloud Project**
   - Active GCP project with billing enabled
   - Vertex AI API enabled
   - Service account with appropriate permissions

2. **Required Permissions**
   - `aiplatform.endpoints.predict`
   - `aiplatform.models.predict`
   - `vertexai.generativeModels.generateContent`

3. **Environment Variables**
   ```env
   # Google Cloud Configuration
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_REGION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
   
   # Optional: For production deployments
   GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY=base64-encoded-service-account-json
   ```

## Installation

```bash
# Install required packages
pnpm add @google-cloud/aiplatform @google-cloud/vertexai
```

## Service Implementation

### 1. Vertex AI Service (`src/lib/services/vertex-ai.service.ts`)

```typescript
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';
import { GoogleAuth } from 'google-auth-library';

export interface VertexAIConfig {
  projectId: string;
  location: string;
  modelName?: string;
}

export interface VertexAIMessage {
  role: 'user' | 'model';
  content: string;
}

export interface VertexAIAgent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  modelName?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

// Predefined Vertex AI Agents
export const VERTEX_AI_AGENTS: VertexAIAgent[] = [
  {
    id: 'biblical-scholar',
    name: 'Biblical Scholar',
    description: 'Expert in biblical languages, historical context, and theological interpretation',
    systemPrompt: `You are a biblical scholar with expertise in:
- Original biblical languages (Hebrew, Aramaic, Greek)
- Historical and cultural context of biblical texts
- Various hermeneutical approaches
- Comparative analysis across different translations
- Archaeological and historical evidence

Provide scholarly, well-researched responses with appropriate citations.`,
    temperature: 0.3,
    maxOutputTokens: 2048
  },
  {
    id: 'theology-assistant',
    name: 'Theology Assistant',
    description: 'Helps with systematic theology, doctrine, and theological concepts',
    systemPrompt: `You are a theology assistant specializing in:
- Systematic theology across various traditions
- Historical development of Christian doctrine
- Comparative theology
- Practical application of theological concepts
- Contemporary theological discussions

Provide balanced, thoughtful responses that acknowledge different theological perspectives.`,
    temperature: 0.5,
    maxOutputTokens: 2048
  },
  {
    id: 'devotional-guide',
    name: 'Devotional Guide',
    description: 'Provides spiritual guidance and devotional insights',
    systemPrompt: `You are a compassionate devotional guide focused on:
- Personal spiritual growth and application
- Meditation and contemplative practices
- Prayer guidance and spiritual disciplines
- Practical life application of biblical principles
- Encouragement and pastoral care

Provide warm, encouraging responses that help deepen spiritual life.`,
    temperature: 0.7,
    maxOutputTokens: 1024
  },
  {
    id: 'bible-study-leader',
    name: 'Bible Study Leader',
    description: 'Facilitates group Bible study discussions and provides study materials',
    systemPrompt: `You are an experienced Bible study leader skilled in:
- Creating engaging discussion questions
- Developing study guides and curricula
- Facilitating group discussions
- Providing cultural and historical background
- Making biblical texts accessible and relevant

Create interactive, thought-provoking content for Bible study groups.`,
    temperature: 0.6,
    maxOutputTokens: 1536
  }
];

export class VertexAIService {
  private vertexAI: VertexAI;
  private auth: GoogleAuth;
  private config: VertexAIConfig;

  constructor(config?: Partial<VertexAIConfig>) {
    this.config = {
      projectId: config?.projectId || process.env.GOOGLE_CLOUD_PROJECT_ID!,
      location: config?.location || process.env.GOOGLE_CLOUD_REGION || 'us-central1',
      modelName: config?.modelName || 'gemini-1.5-pro'
    };

    // Initialize authentication
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    // Initialize Vertex AI
    this.vertexAI = new VertexAI({
      project: this.config.projectId,
      location: this.config.location,
    });
  }

  /**
   * Get a specific agent by ID
   */
  getAgent(agentId: string): VertexAIAgent | undefined {
    return VERTEX_AI_AGENTS.find(agent => agent.id === agentId);
  }

  /**
   * Get all available agents
   */
  getAllAgents(): VertexAIAgent[] {
    return VERTEX_AI_AGENTS;
  }

  /**
   * Create a generative model instance for an agent
   */
  private getGenerativeModel(agent: VertexAIAgent) {
    const modelName = agent.modelName || this.config.modelName || 'gemini-1.5-pro';
    
    return this.vertexAI.preview.getGenerativeModel({
      model: modelName,
      generationConfig: {
        maxOutputTokens: agent.maxOutputTokens || 2048,
        temperature: agent.temperature || 0.5,
        topP: 0.95,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }

  /**
   * Generate a response using a specific agent
   */
  async generateResponse(
    agentId: string,
    messages: VertexAIMessage[],
    streamCallback?: (chunk: string) => void
  ): Promise<string> {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const model = this.getGenerativeModel(agent);

    // Prepare chat history with system prompt
    const chatHistory = [
      {
        role: 'user',
        parts: [{ text: agent.systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: 'I understand. I will respond according to my role and expertise.' }],
      },
    ];

    // Add conversation history
    messages.forEach(msg => {
      chatHistory.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    });

    const chat = model.startChat({
      history: chatHistory.slice(0, -1), // Exclude the last message
    });

    const lastMessage = messages[messages.length - 1].content;

    if (streamCallback) {
      // Streaming response
      const result = await chat.sendMessageStream(lastMessage);
      let fullResponse = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        streamCallback(chunkText);
      }

      return fullResponse;
    } else {
      // Non-streaming response
      const result = await chat.sendMessage(lastMessage);
      const response = await result.response;
      return response.text();
    }
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const model = this.vertexAI.preview.getGenerativeModel({
      model: 'textembedding-gecko@003',
    });

    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  /**
   * Analyze biblical text with specific focus
   */
  async analyzeBiblicalText(
    text: string,
    analysisType: 'historical' | 'linguistic' | 'theological' | 'devotional'
  ): Promise<string> {
    const prompts = {
      historical: `Analyze this biblical text from a historical perspective, including cultural context, archaeological evidence, and historical background: "${text}"`,
      linguistic: `Provide a linguistic analysis of this biblical text, including original language insights, word studies, and translation considerations: "${text}"`,
      theological: `Analyze the theological themes and doctrinal implications of this biblical text: "${text}"`,
      devotional: `Provide devotional insights and practical applications for this biblical text: "${text}"`
    };

    const agentMap = {
      historical: 'biblical-scholar',
      linguistic: 'biblical-scholar',
      theological: 'theology-assistant',
      devotional: 'devotional-guide'
    };

    const agentId = agentMap[analysisType];
    const prompt = prompts[analysisType];

    return this.generateResponse(agentId, [
      { role: 'user', content: prompt }
    ]);
  }
}

// Singleton instance
let vertexAIService: VertexAIService | null = null;

export function getVertexAIService(): VertexAIService {
  if (!vertexAIService) {
    vertexAIService = new VertexAIService();
  }
  return vertexAIService;
}
```

### 2. API Route Handler (`src/app/api/chat/vertex/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getVertexAIService } from '@/lib/services/vertex-ai.service';
import { auth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
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
    await auth.verifyIdToken(token);

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
```

### 3. Client Hook (`src/hooks/useVertexAI.ts`)

```typescript
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface VertexAIAgent {
  id: string;
  name: string;
  description: string;
}

export interface VertexAIMessage {
  role: 'user' | 'model';
  content: string;
}

export function useVertexAI() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<VertexAIAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available agents
  const fetchAgents = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const token = await user.getIdToken();
      const response = await fetch('/api/chat/vertex', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }

      const data = await response.json();
      setAgents(data.agents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Send message to Vertex AI agent
  const sendMessage = useCallback(async (
    agentId: string,
    messages: VertexAIMessage[],
    options?: {
      stream?: boolean;
      onChunk?: (chunk: string) => void;
    }
  ) => {
    if (!user) throw new Error('User not authenticated');

    const token = await user.getIdToken();

    if (options?.stream && options.onChunk) {
      // Streaming request
      const response = await fetch('/api/chat/vertex', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                options.onChunk(parsed.content);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } else {
      // Non-streaming request
      const response = await fetch('/api/chat/vertex', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          messages,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return data.content;
    }
  }, [user]);

  // Analyze biblical text
  const analyzeBiblicalText = useCallback(async (
    text: string,
    analysisType: 'historical' | 'linguistic' | 'theological' | 'devotional'
  ) => {
    if (!user) throw new Error('User not authenticated');

    const agentMap = {
      historical: 'biblical-scholar',
      linguistic: 'biblical-scholar',
      theological: 'theology-assistant',
      devotional: 'devotional-guide'
    };

    const agentId = agentMap[analysisType];
    const prompt = `Please analyze this biblical text from a ${analysisType} perspective: "${text}"`;

    return sendMessage(agentId, [
      { role: 'user', content: prompt }
    ]);
  }, [user, sendMessage]);

  return {
    agents,
    loading,
    error,
    fetchAgents,
    sendMessage,
    analyzeBiblicalText,
  };
}
```

## Integration with Chat UI

### Update Agent Selector Component

In `src/components/chat/AgentSelector.tsx`, add Vertex AI agents:

```typescript
import { useVertexAI } from '@/hooks/useVertexAI';

// Inside the component
const { agents: vertexAgents, fetchAgents } = useVertexAI();

useEffect(() => {
  fetchAgents();
}, [fetchAgents]);

// Combine with other providers
const allAgents = [
  ...generalAgents,
  ...vertexAgents.map(agent => ({
    ...agent,
    provider: 'vertex-ai' as const,
  })),
];
```

### Update Chat Service

Modify the chat service to handle Vertex AI requests:

```typescript
// In sendMessage function
if (selectedAgent?.provider === 'vertex-ai') {
  const response = await fetch('/api/chat/vertex', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agentId: selectedAgent.id,
      messages: formattedMessages,
      stream: true,
    }),
  });
  // Handle streaming response...
}
```

## Environment Setup

### 1. Local Development

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash

# Initialize and authenticate
gcloud init
gcloud auth application-default login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

### 2. Service Account Setup

```bash
# Create service account
gcloud iam service-accounts create mustard-vertex-ai \
  --display-name="Mustard Vertex AI Service Account"

# Grant necessary roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:mustard-vertex-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Create and download key
gcloud iam service-accounts keys create vertex-ai-key.json \
  --iam-account=mustard-vertex-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 3. Production Deployment

For Vercel deployment:

1. Convert service account key to base64:
   ```bash
   base64 -i vertex-ai-key.json | tr -d '\n'
   ```

2. Add to Vercel environment variables:
   - `GOOGLE_CLOUD_PROJECT_ID`
   - `GOOGLE_CLOUD_REGION`
   - `GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY` (base64 encoded)

3. Update initialization to use base64 key in production:
   ```typescript
   // In vertex-ai.service.ts constructor
   if (process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY) {
     const credentials = JSON.parse(
       Buffer.from(process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY, 'base64').toString()
     );
     
     this.auth = new GoogleAuth({
       credentials,
       scopes: ['https://www.googleapis.com/auth/cloud-platform'],
     });
   }
   ```

## Testing

### 1. Test Script (`src/scripts/test-vertex-ai.ts`)

```typescript
import { getVertexAIService } from '@/lib/services/vertex-ai.service';

async function testVertexAI() {
  const service = getVertexAIService();

  // Test getting agents
  console.log('Available agents:');
  const agents = service.getAllAgents();
  agents.forEach(agent => {
    console.log(`- ${agent.name}: ${agent.description}`);
  });

  // Test biblical scholar
  console.log('\nTesting Biblical Scholar:');
  const scholarResponse = await service.generateResponse(
    'biblical-scholar',
    [
      {
        role: 'user',
        content: 'Explain the significance of the Greek word "agape" in 1 Corinthians 13'
      }
    ]
  );
  console.log(scholarResponse);

  // Test text analysis
  console.log('\nTesting Biblical Text Analysis:');
  const analysis = await service.analyzeBiblicalText(
    'For God so loved the world that he gave his one and only Son',
    'theological'
  );
  console.log(analysis);
}

testVertexAI().catch(console.error);
```

### 2. Run Tests

```bash
pnpm tsx src/scripts/test-vertex-ai.ts
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure service account has correct permissions
   - Check GOOGLE_APPLICATION_CREDENTIALS path
   - Verify project ID is correct

2. **API Not Enabled**
   ```bash
   gcloud services enable aiplatform.googleapis.com
   gcloud services enable vertexai.googleapis.com
   ```

3. **Quota Limits**
   - Check Vertex AI quotas in GCP Console
   - Implement rate limiting in production

4. **Model Availability**
   - Some models may not be available in all regions
   - Check model availability in your selected region

## Best Practices

1. **Error Handling**
   - Implement retry logic for transient errors
   - Provide fallback responses
   - Log errors for monitoring

2. **Performance**
   - Cache agent list to reduce API calls
   - Implement request debouncing
   - Use streaming for better UX

3. **Security**
   - Never expose service account keys in client code
   - Validate and sanitize all inputs
   - Implement rate limiting per user

4. **Cost Management**
   - Monitor API usage
   - Set up billing alerts
   - Consider caching frequent queries

## Next Steps

1. Implement the Vertex AI service and API routes
2. Update the chat UI to include Vertex AI agents
3. Add specialized Bible study features using the agents
4. Create agent-specific UI components (e.g., verse analysis panels)
5. Implement usage tracking and analytics
6. Add user preferences for default agents
