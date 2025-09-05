'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ChatMessage, ChatSession, ChatAgent } from '@/types/chat';

interface UseChatOptions {
  sessionId?: string;
  autoLoadAgents?: boolean;
}

export function useChat(options: UseChatOptions = {}) {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [agentsLoaded, setAgentsLoaded] = useState(false);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [streamingSummary, setStreamingSummary] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get auth token
  const getAuthToken = useCallback(async () => {
    if (!currentUser) throw new Error('User not authenticated');
    return currentUser.getIdToken();
  }, [currentUser]);

  // Fetch all agents
  const fetchAgents = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/chat/agents', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch agents');
      
      const data = await response.json();
      setAgents(data.agents);
      
      // Use the first available agent as default
      if (data.agents && data.agents.length > 0 && !selectedAgentId) {
        setSelectedAgentId(data.agents[0].id);
      }
      setAgentsLoaded(true);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    }
  }, [getAuthToken, selectedAgentId]);

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/chat', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch sessions');
      
      const data = await response.json();
      setSessions(data.sessions);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    }
  }, [getAuthToken]);

  // Load a specific session
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      const token = await getAuthToken();
      const response = await fetch(`/api/chat?sessionId=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load session');
      
      const data = await response.json();
      console.log('[useChat] Session loaded:', sessionId, 'Messages:', data.session?.messages?.length);
      
      // Log all messages to debug content
      if (data.session?.messages) {
        data.session.messages.forEach((msg: any, index: number) => {
          console.log(`[useChat] Message ${index}:`, {
            role: msg.role,
            contentLength: msg.content?.length || 0,
            contentPreview: msg.content?.substring(0, 100) || 'NO CONTENT',
            hasAttachments: !!msg.metadata?.attachments
          });
        });
      }
      
      // Log messages with attachments
      const messagesWithAttachments = data.session?.messages?.filter((m: any) => m.metadata?.attachments);
      if (messagesWithAttachments?.length > 0) {
        console.log('[useChat] Messages with attachments:', messagesWithAttachments.length);
      }
      
      setCurrentSession(data.session);
      
      // Use agent from session metadata or LMS context
      if (data.session.lmsContext?.agentId) {
        setSelectedAgentId(data.session.lmsContext.agentId);
      } else if (data.session.metadata?.agentId) {
        setSelectedAgentId(data.session.metadata.agentId);
      }
    } catch (err) {
      console.error('Error loading session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthToken]);

  // Create a new session
  const createSession = useCallback(async (title?: string, lmsContext?: ChatSession['lmsContext']) => {
    try {
      setIsLoading(true);
      const token = await getAuthToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createSession',
          title: title || 'New Chat',
          agentId: lmsContext?.agentId || selectedAgentId || undefined,
          lmsContext,
        }),
      });

      if (!response.ok) throw new Error('Failed to create session');
      
      const data = await response.json();
      setCurrentSession(data.session);
      
      // If LMS context provided, set the agent
      if (lmsContext?.agentId) {
        setSelectedAgentId(lmsContext.agentId);
      }
      
      await fetchSessions(); // Refresh sessions list
      return data.session;
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create session');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthToken, selectedAgentId, fetchSessions]);

  // Send a message
  const sendMessage = useCallback(async (content: string, agentId?: string) => {
    try {
      console.log('[useChat] sendMessage called with:', { 
        content: content.substring(0, 50) + '...', 
        agentId,
        currentUser: !!currentUser,
        selectedAgentId,
        agentsLoaded,
        currentSession: currentSession?.id
      });
      
      setIsLoading(true);
      setStreamingMessage('');
      setError(null);
      setPendingUserMessage(content); // Store the pending user message

      // Check authentication
      if (!currentUser) {
        throw new Error('User not authenticated. Please sign in to send messages.');
      }

      const token = await getAuthToken();
      console.log('[useChat] Auth token obtained');

      // If no agent is selected yet, wait for agents to load
      if (!selectedAgentId && !agentId) {
        console.log('[useChat] No agent selected, agents loaded:', agentsLoaded);
        setError('Waiting for agents to load...');
        return;
      }
      
      const currentAgentId = agentId || selectedAgentId;
      console.log('[useChat] Using agent:', currentAgentId);
      
      if (!currentAgentId) {
        throw new Error('No agent available. Please wait for agents to load.');
      }

      // Create session if none exists
      let sessionId = currentSession?.id;
      if (!sessionId) {
        console.log('[useChat] No current session, creating new one');
        const newSession = await createSession();
        if (!newSession) throw new Error('Failed to create session');
        sessionId = newSession.id;
        console.log('[useChat] New session created:', sessionId);
      }

      // Prepare messages for the API
      const messages = [
        ...(currentSession?.messages || []).map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user' as const, content },
      ];

      console.log('[useChat] Sending request with messages:', messages);

      // Create abort controller for streaming
      abortControllerRef.current = new AbortController();

      const requestBody = {
        action: 'generateCompletion',
        sessionId,
        messages,
        agentId: currentAgentId,
        options: {
          stream: true,
          temperature: 0.7,
        },
        stream: true,
      };

      console.log('[useChat] Sending request to /api/chat with body:', {
        ...requestBody,
        messages: requestBody.messages.map(m => ({ role: m.role, contentLength: m.content.length }))
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      console.log('[useChat] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useChat] API error response:', errorText);
        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }

      console.log('[useChat] Response received, starting streaming');

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let buffer = '';
      let fullResponse = '';

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
              console.log('[useChat] Streaming complete, reloading session');
              // Clear pending user message and streaming message when done
              setPendingUserMessage(null);
              setStreamingMessage('');
              setStreamingSummary(null);
              // Reload session to get the saved messages with attachments
              if (sessionId) {
                await loadSession(sessionId);
              }
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullResponse += parsed.content;
                setStreamingMessage(fullResponse);
                console.log('[useChat] Streaming chunk:', parsed.content);
              } else if (parsed.summary) {
                // Handle summary event
                setStreamingSummary(parsed.summary);
                console.log('[useChat] Summary received:', parsed.summary);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[useChat] Message streaming aborted');
      } else {
        console.error('[useChat] Error sending message:', err);
        console.error('[useChat] Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        
        // Provide more specific error messages
        let errorMessage = 'Failed to send message';
        if (err.message.includes('User not authenticated')) {
          errorMessage = 'Please sign in to send messages';
        } else if (err.message.includes('No agent available')) {
          errorMessage = 'Chat agents are still loading. Please wait a moment.';
        } else if (err.message.includes('Failed to create session')) {
          errorMessage = 'Unable to start a new chat session. Please try again.';
        } else if (err.message.includes('API request failed')) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      }
      setPendingUserMessage(null); // Clear pending message on error
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
      setStreamingSummary(null);
      abortControllerRef.current = null;
    }
  }, [getAuthToken, selectedAgentId, currentSession, createSession, loadSession]);

  // Create a session from LMS context
  const createLMSSession = useCallback(async (lmsContext: ChatSession['lmsContext']) => {
    if (!lmsContext) {
      setError('LMS context is required');
      return null;
    }

    const title = `${lmsContext.courseTitle}: ${lmsContext.stepTitle}`;
    const session = await createSession(title, lmsContext);
    
    // Auto-send initial prompt if provided
    if (session && lmsContext.initialPrompt) {
      await sendMessage(lmsContext.initialPrompt, lmsContext.agentId);
    }
    
    return session;
  }, [createSession, sendMessage]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Delete a session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/chat?sessionId=${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete session');
      
      // Clear current session if it was deleted
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }
      
      await fetchSessions(); // Refresh sessions list
    } catch (err) {
      console.error('Error deleting session:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  }, [getAuthToken, currentSession, fetchSessions]);

  // Initialize - fetch agents when user is authenticated
  useEffect(() => {
    if (currentUser && !agentsLoaded) {
      fetchAgents();
    }
  }, [currentUser, agentsLoaded, fetchAgents]);

  useEffect(() => {
    if (currentUser && options.sessionId) {
      loadSession(options.sessionId);
    }
  }, [currentUser, options.sessionId, loadSession]);

  return {
    // State
    sessions,
    currentSession,
    agents,
    selectedAgentId,
    isLoading,
    streamingMessage,
    streamingSummary,
    error,
    pendingUserMessage,
    
    // Actions
    fetchSessions,
    loadSession,
    createSession,
    createLMSSession,
    sendMessage,
    stopStreaming,
    deleteSession,
    setSelectedAgentId,
    
    // Utilities
    isStreaming: !!streamingMessage,
  };
}
