import { 
  ChatMessage, 
  ChatSession, 
  ChatAgent, 
  ChatCompletionOptions,
  ChatError 
} from '@/types/chat';
import { getVertexAIService } from './vertex-ai.service';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { orchestratorService } from './orchestrator.service';
import { OrchestrationRequest, DeliverableType } from '@/types/orchestration';

export class ChatService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Get all available agents (only Vertex AI agents)
   */
  async getAllAgents(): Promise<ChatAgent[]> {
    try {
      const vertexAIService = getVertexAIService();
      
      // Only return Vertex AI agents
      if (vertexAIService.isAvailable()) {
        const vertexAgents = vertexAIService.getAllAgents().map(agent => ({
          ...agent,
          provider: 'vertex-ai' as const,
          capabilities: agent.id.includes('biblical') || agent.id.includes('theology') || agent.id.includes('devotional') 
            ? ['biblical-analysis', 'theology', 'spiritual-guidance']
            : agent.id === 'data-visualization'
            ? ['charts', 'tables', 'data-analysis', 'visualization']
            : ['general', 'writing', 'analysis'],
        }));
        return vertexAgents;
      }
    } catch (error) {
      console.warn('Vertex AI service not available:', error);
    }

    // Return empty array if Vertex AI is not available
    return [];
  }

  /**
   * Get a specific agent by ID
   */
  async getAgent(agentId: string): Promise<ChatAgent | null> {
    const agents = await this.getAllAgents();
    return agents.find(agent => agent.id === agentId) || null;
  }

  /**
   * Create a new chat session
   */
  async createSession(
    title: string, 
    agentId?: string,
    lmsContext?: ChatSession['lmsContext']
  ): Promise<ChatSession> {
    const db = await getDatabase();
    const collection = db.collection<ChatSession>('chatSessions');

    const session: ChatSession = {
      id: new ObjectId().toString(),
      userId: this.userId,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        agentId: lmsContext?.agentId || agentId,
      },
      ...(lmsContext && { lmsContext }),
    };

    await collection.insertOne({ ...session, _id: new ObjectId(session.id) } as any);
    return session;
  }

  /**
   * Create a chat session from LMS context
   */
  async createLMSSession(lmsContext: ChatSession['lmsContext']): Promise<ChatSession> {
    if (!lmsContext) {
      throw new Error('LMS context is required');
    }

    const title = `${lmsContext.courseTitle}: ${lmsContext.stepTitle}`;
    return this.createSession(title, lmsContext.agentId, lmsContext);
  }

  /**
   * Get all chat sessions for the current user
   */
  async getSessions(): Promise<ChatSession[]> {
    const db = await getDatabase();
    const collection = db.collection<any>('chatSessions');

    const sessions = await collection
      .find({ userId: this.userId })
      .sort({ updatedAt: -1 })
      .toArray();

    return sessions.map((session: any) => ({
      ...session,
      id: session._id?.toString() || session.id,
    }));
  }

  /**
   * Get a specific chat session
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    const db = await getDatabase();
    const collection = db.collection<ChatSession>('chatSessions');

    const session = await collection.findOne({
      _id: new ObjectId(sessionId),
      userId: this.userId,
    });

    if (!session) return null;

    return {
      ...session,
      id: session._id?.toString() || session.id,
    };
  }

  /**
   * Add a message to a session
   */
  async addMessage(
    sessionId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<ChatMessage> {
    const db = await getDatabase();
    const collection = db.collection<ChatSession>('chatSessions');

    const newMessage: ChatMessage = {
      ...message,
      id: new ObjectId().toString(),
      timestamp: new Date(),
    };

    await collection.updateOne(
      { _id: new ObjectId(sessionId), userId: this.userId },
      {
        $push: { messages: newMessage },
        $set: { updatedAt: new Date() },
      }
    );

    return newMessage;
  }

  /**
   * Detect if a request should use orchestration
   */
  private shouldUseOrchestration(content: string, agentId?: string): boolean {
    const lowerContent = content.toLowerCase();
    
    // Simple questions that should NOT use orchestration
    const simpleQuestionPatterns = [
      /^what does the bible say about/i,
      /^who (was|is)/i,
      /^what (is|are|was|were)/i,
      /^when (did|was|is)/i,
      /^where (is|was|did)/i,
      /^how (do|does|did|can|should)/i,
      /^why (do|does|did|is|are)/i,
      /^explain/i,
      /^tell me about/i,
      /^can you help me understand/i,
      /^help me understand/i
    ];
    
    // Check if it's a simple question
    if (simpleQuestionPatterns.some(pattern => pattern.test(content.trim()))) {
      return false;
    }
    
    // Keywords that indicate complex deliverables
    const orchestrationKeywords = [
      'presentation', 'slides', 'powerpoint',
      'essay', 'article', 'blog post', 'write a',
      'sermon', 'devotional', 'bible study',
      'course', 'curriculum', 'lesson plan',
      'create a', 'build a', 'design a',
      'comprehensive', 'detailed', 'complete'
    ];
    
    // Check for explicit deliverable requests
    if (orchestrationKeywords.some(keyword => lowerContent.includes(keyword))) {
      return true;
    }

    // Check if using a specialized agent that might benefit from orchestration
    if (agentId && ['presentation-agent', 'essay-writer', 'sermon-specialist'].includes(agentId)) {
      return true;
    }

    // Check for multi-part requests (indicated by multiple sentences or bullet points)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 2) {
      return true;
    }

    return false;
  }

  /**
   * Detect deliverable type from content
   */
  private detectDeliverableType(content: string): DeliverableType {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('presentation') || lowerContent.includes('slides') || lowerContent.includes('powerpoint')) {
      return 'presentation';
    }
    if (lowerContent.includes('essay') || lowerContent.includes('write about')) {
      return 'essay';
    }
    if (lowerContent.includes('article') || lowerContent.includes('blog')) {
      return 'article';
    }
    if (lowerContent.includes('sermon') || lowerContent.includes('devotional')) {
      return 'sermon';
    }
    if (lowerContent.includes('course') || lowerContent.includes('curriculum')) {
      return 'course';
    }

    return 'general';
  }

  /**
   * Generate a chat completion
   */
  async generateCompletion(
    messages: ChatMessage[],
    agentId: string,
    options?: ChatCompletionOptions,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    // Get the last user message
    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      throw new Error('No user message found');
    }

    // Check if we should use orchestration
    if (this.shouldUseOrchestration(lastUserMessage.content, agentId)) {
      return this.generateOrchestrationCompletion(
        lastUserMessage.content,
        messages,
        options,
        onStream
      );
    }

    // Otherwise, use single agent
    const agent = await this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // All agents now use Vertex AI
    return this.generateVertexAICompletion(messages, agent, onStream);
  }

  /**
   * Generate completion using orchestration
   */
  private async generateOrchestrationCompletion(
    task: string,
    messages: ChatMessage[],
    options?: ChatCompletionOptions,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    try {
      // Build context from previous messages
      const context = messages.slice(0, -1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Create orchestration request
      const request: OrchestrationRequest = {
        userId: this.userId,
        task,
        deliverableType: this.detectDeliverableType(task),
        context: context.length > 0 ? { previousMessages: context } : undefined,
        preferences: {
          qualityLevel: options?.temperature && options.temperature > 0.7 ? 'premium' : 'standard',
          speedPriority: options?.stream ? 'high' : 'medium',
          costSensitivity: 'medium',
          targetAudience: 'general'
        }
      };

      // Stream orchestration updates
      if (onStream) {
        onStream('\n🤖 **Orchestrating multiple agents to create your deliverable...**\n\n');
      }

      // Execute orchestration
      const result = await orchestratorService.orchestrate(request);

      if (!result.success) {
        throw new Error('Orchestration failed');
      }

      // Format the response based on deliverable type
      let formattedResponse = '';

      if (result.deliverableType === 'presentation' && result.deliverable) {
        // The orchestrator now returns the formatted presentation as content
        if (result.deliverable.content) {
          formattedResponse = result.deliverable.content;
        } else if (result.deliverable.slides) {
          // Fallback for old format
          formattedResponse = this.formatPresentationResponse(result.deliverable);
        } else {
          formattedResponse = '✅ Presentation created successfully!';
        }
      } else if (['essay', 'article', 'sermon'].includes(result.deliverableType) && result.deliverable) {
        formattedResponse = this.formatDocumentResponse(result.deliverable);
      } else if (result.deliverable?.results) {
        formattedResponse = this.formatGeneralResponse(result.deliverable);
      } else {
        formattedResponse = '✅ Task completed successfully!';
      }

      // Add execution summary
      if (onStream) {
        onStream('\n\n---\n');
        onStream(`📊 **Execution Summary:**\n`);
        onStream(`- Agents used: ${result.agentTrace.length}\n`);
        onStream(`- Total time: ${(result.duration / 1000).toFixed(1)}s\n`);
        onStream(`- Estimated cost: $${result.cost.total.toFixed(4)}\n`);
      }

      return formattedResponse;
    } catch (error) {
      console.error('Orchestration error:', error);
      // Fallback to single agent
      if (onStream) {
        onStream('\n⚠️ Falling back to single agent...\n\n');
      }
      const agent = await this.getAgent('general-assistant');
      if (!agent) {
        throw new Error('No fallback agent available');
      }
      return this.generateVertexAICompletion(messages, agent, onStream);
    }
  }

  /**
   * Format presentation response
   */
  private formatPresentationResponse(deliverable: any): string {
    const slides = deliverable.slides || [];
    const title = deliverable.metadata?.title || 'Presentation';

    let response = `# ${title}\n\n`;
    
    slides.forEach((slide: any, index: number) => {
      response += `## Slide ${index + 1}\n\n`;
      response += `${slide.content}\n\n`;
    });

    return response;
  }

  /**
   * Format document response
   */
  private formatDocumentResponse(deliverable: any): string {
    const title = deliverable.title || 'Document';
    const content = deliverable.content || '';

    return `# ${title}\n\n${content}`;
  }

  /**
   * Format general response
   */
  private formatGeneralResponse(deliverable: any): string {
    const results = deliverable.results || [];
    
    let response = '## Results\n\n';
    results.forEach((result: any) => {
      response += `### ${result.agent}\n\n`;
      response += `${result.output}\n\n`;
    });

    return response;
  }

  /**
   * Generate a summary for a user question
   */
  async generateSummary(userQuestion: string): Promise<string> {
    const vertexAIService = getVertexAIService();
    
    if (!vertexAIService.isAvailable()) {
      throw new Error('Vertex AI service is not available');
    }

    try {
      return await vertexAIService.generateResponse(
        'summary-generator',
        [{ role: 'user', content: userQuestion }]
      );
    } catch (error) {
      console.error('Error generating summary:', error);
      // Return empty string on error so the main response can still work
      return '';
    }
  }

  /**
   * Generate completion with summary (parallel processing)
   */
  async generateCompletionWithSummary(
    messages: ChatMessage[],
    agentId: string,
    options?: ChatCompletionOptions,
    onStream?: (chunk: string) => void,
    onSummary?: (summary: string) => void
  ): Promise<{ content: string; summary: string }> {
    // Get the last user message for summary generation
    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      throw new Error('No user message found');
    }

    // Check if we should use orchestration
    if (this.shouldUseOrchestration(lastUserMessage.content, agentId)) {
      // For orchestration, we'll generate a summary of the task
      const summaryPromise = this.generateSummary(lastUserMessage.content);
      const contentPromise = this.generateOrchestrationCompletion(
        lastUserMessage.content,
        messages,
        options,
        onStream
      );

      // Handle summary when it arrives
      summaryPromise.then(summary => {
        if (onSummary && summary) {
          onSummary(summary);
        }
      }).catch(error => {
        console.error('Summary generation failed:', error);
      });

      // Wait for both to complete
      const [content, summary] = await Promise.all([
        contentPromise,
        summaryPromise.catch(() => '') // Don't fail if summary fails
      ]);

      return { content, summary };
    }

    // Otherwise, use single agent with summary
    const agent = await this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Start both requests in parallel
    const summaryPromise = this.generateSummary(lastUserMessage.content);
    const contentPromise = this.generateVertexAICompletion(messages, agent, onStream);

    // Handle summary when it arrives (usually faster)
    summaryPromise.then(summary => {
      if (onSummary && summary) {
        onSummary(summary);
      }
    }).catch(error => {
      console.error('Summary generation failed:', error);
    });

    // Wait for both to complete
    const [content, summary] = await Promise.all([
      contentPromise,
      summaryPromise.catch(() => '') // Don't fail if summary fails
    ]);

    return { content, summary };
  }

  /**
   * Generate completion using Vertex AI
   */
  private async generateVertexAICompletion(
    messages: ChatMessage[],
    agent: ChatAgent,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    const vertexAIService = getVertexAIService();
    
    // Check if Vertex AI is available
    if (!vertexAIService.isAvailable()) {
      throw new Error('Vertex AI service is not available. Please check your Google Cloud configuration.');
    }
    
    // Convert messages to Vertex AI format
    const vertexMessages = messages.map(msg => ({
      role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      content: msg.content,
    }));

    return vertexAIService.generateResponse(
      agent.id,
      vertexMessages,
      onStream
    );
  }

  /**
   * Delete a chat session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const db = await getDatabase();
    const collection = db.collection<ChatSession>('chatSessions');

    const result = await collection.deleteOne({
      _id: new ObjectId(sessionId),
      userId: this.userId,
    });

    return result.deletedCount > 0;
  }

  /**
   * Update session title
   */
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    const db = await getDatabase();
    const collection = db.collection<ChatSession>('chatSessions');

    const result = await collection.updateOne(
      { _id: new ObjectId(sessionId), userId: this.userId },
      {
        $set: { title, updatedAt: new Date() },
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Generate a title for a session based on its messages
   */
  async generateSessionTitle(sessionId: string): Promise<string> {
    const session = await this.getSession(sessionId);
    if (!session || session.messages.length === 0) {
      return 'New Chat';
    }

    // Get the first user message (the main question/topic)
    const firstUserMessage = session.messages.find(msg => msg.role === 'user');
    if (!firstUserMessage) {
      return 'New Chat';
    }

    // Create a more focused prompt for title generation
    const prompt = `Generate a concise, descriptive title (max 40 characters) for a chat that starts with this question:

"${firstUserMessage.content}"

The title should:
- Capture the main topic or question
- Be clear and specific
- Not include quotes or special characters
- Be suitable as a chat session title

Respond with ONLY the title, nothing else.`;

    try {
      // Use Vertex AI to generate title
      const vertexAIService = getVertexAIService();
      if (!vertexAIService.isAvailable()) {
        // Fallback: Extract key words from the first message
        const words = firstUserMessage.content.split(/\s+/).slice(0, 6);
        return words.join(' ').substring(0, 40) + '...';
      }

      const title = await vertexAIService.generateResponse(
        'general-assistant', // Use a general assistant for title generation
        [{ role: 'user', content: prompt }]
      );

      // Clean the title - remove quotes, trim, and ensure length
      let cleanTitle = title
        .trim()
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/\.$/, '') // Remove trailing period
        .substring(0, 40);

      // If the AI returned something too long or with extra text, try to extract just the title
      if (cleanTitle.includes('\n')) {
        cleanTitle = cleanTitle.split('\n')[0].substring(0, 40);
      }

      // Ensure we have a valid title
      if (!cleanTitle || cleanTitle.length < 3) {
        const words = firstUserMessage.content.split(/\s+/).slice(0, 6);
        cleanTitle = words.join(' ').substring(0, 40);
      }

      await this.updateSessionTitle(sessionId, cleanTitle);
      return cleanTitle;
    } catch (error) {
      console.error('Error generating title:', error);
      // Fallback: Use first few words of the question
      const words = firstUserMessage.content.split(/\s+/).slice(0, 6);
      return words.join(' ').substring(0, 40) + '...';
    }
  }
}

// Helper function to create a ChatService instance
export function getChatService(userId: string): ChatService {
  return new ChatService(userId);
}
