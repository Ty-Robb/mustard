'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatContainer } from '@/components/chat/ChatContainer';
// import { ChatFAB } from '@/components/chat/ChatFAB'; // Removed to fix infinite loop error
import { Editor } from '@/components/chat/Editor';
import { useChat } from '@/hooks/useChat';
import { PanelProvider, usePanel } from '@/contexts/PanelContext';
import { SplitScreenLayout } from '@/components/SplitScreenLayout';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { ResponseAnalyzer } from '@/lib/utils/response-analyzer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const sessionIdFromUrl = searchParams.get('sessionId');
  const [isLoadingLmsContext, setIsLoadingLmsContext] = useState(false);
  
  const {
    currentSession,
    selectedAgentId,
    isLoading,
    streamingMessage,
    streamingSummary,
    error,
    pendingUserMessage,
    createSession,
    sendMessage,
    loadSession,
  } = useChat({ sessionId: sessionIdFromUrl || undefined });

  const [showHistory, setShowHistory] = useState(false);
  const [activeEssayMessage, setActiveEssayMessage] = useState<ChatMessageType | null>(null);
  const [lastUserPrompt, setLastUserPrompt] = useState<string>('');
  const [hasAutoOpenedEditor, setHasAutoOpenedEditor] = useState(false);

  const { setRightPanelCollapsed } = usePanel();

  // Track if we're loading an LMS session
  useEffect(() => {
    if (sessionIdFromUrl && !currentSession) {
      setIsLoadingLmsContext(true);
    } else if (currentSession) {
      setIsLoadingLmsContext(false);
    }
  }, [sessionIdFromUrl, currentSession]);

  // Initialize with a session once we have an agent selected
  useEffect(() => {
    const initializeChat = async () => {
      if (!currentSession && selectedAgentId && !sessionIdFromUrl) {
        const session = await createSession('New Chat');
        if (session) {
          await loadSession(session.id);
        }
      }
    };
    initializeChat();
  }, [currentSession, selectedAgentId, createSession, loadSession, sessionIdFromUrl]);

  // Auto-send initial prompt when loading an LMS session
  useEffect(() => {
    const sendInitialPrompt = async () => {
      // Check if we have a session with LMS context and an initial prompt
      if (currentSession?.lmsContext?.initialPrompt && 
          currentSession.messages.length === 0 && // Only send if no messages yet
          !isLoading && 
          !streamingMessage) {
        
        console.log('[ChatPage] Sending LMS initial prompt:', currentSession.lmsContext.initialPrompt);
        await sendMessage(
          currentSession.lmsContext.initialPrompt, 
          currentSession.lmsContext.agentId
        );
      }
    };

    sendInitialPrompt();
  }, [currentSession, isLoading, streamingMessage, sendMessage]);

  const handleNewChat = async () => {
    const session = await createSession('New Chat');
    if (session) {
      await loadSession(session.id);
    }
  };

  const handleViewHistory = () => {
    // TODO: Implement history modal/drawer
    setShowHistory(true);
  };

  const handleSendMessage = async (content: string, agentId?: string) => {
    // Store the user prompt for analysis
    setLastUserPrompt(content);
    setHasAutoOpenedEditor(false);
    
    // Use the specified agent or auto-selected agent
    await sendMessage(content, agentId);
  };

  // Detect essay or presentation content during streaming and auto-open appropriate editor
  useEffect(() => {
    if (streamingMessage && lastUserPrompt && !hasAutoOpenedEditor) {
      const analysis = ResponseAnalyzer.analyzeStreamingContent(lastUserPrompt, streamingMessage);
      
      if (analysis.shouldOpenEditor && (analysis.contentType === 'essay' || analysis.contentType === 'presentation')) {
        // Create a temporary message for the editor
        const tempMessage: ChatMessageType = {
          id: 'streaming-essay',
          role: 'assistant',
          content: '', // Start with empty content, will be updated via streaming
          timestamp: new Date(),
        };
        
        setActiveEssayMessage(tempMessage);
        setRightPanelCollapsed(false);
        setHasAutoOpenedEditor(true);
      }
    }
  }, [streamingMessage, lastUserPrompt, hasAutoOpenedEditor, setRightPanelCollapsed]);

  // Update the active message when streaming completes
  useEffect(() => {
    if (!streamingMessage && currentSession?.messages.length) {
      const lastMessage = currentSession.messages[currentSession.messages.length - 1];
      if (lastMessage.role === 'assistant') {
        if (activeEssayMessage?.id === 'streaming-essay') {
          setActiveEssayMessage(lastMessage);
        }
      }
    }
  }, [streamingMessage, activeEssayMessage, currentSession]);

  // Auto-open editor when a new response is complete
  useEffect(() => {
    if (!streamingMessage && currentSession?.messages.length && lastUserPrompt) {
      const lastMessage = currentSession.messages[currentSession.messages.length - 1];
      if (lastMessage.role === 'assistant' && !activeEssayMessage) {
        const analysis = ResponseAnalyzer.analyzeStreamingContent(lastUserPrompt, lastMessage.content);
        if (analysis.shouldOpenEditor) {
          setActiveEssayMessage(lastMessage);
          setRightPanelCollapsed(false);
        }
      }
    }
  }, [streamingMessage, currentSession, lastUserPrompt, activeEssayMessage, setRightPanelCollapsed]);

  const handleOpenInEditor = (message: ChatMessageType) => {
    setActiveEssayMessage(message);
    setRightPanelCollapsed(false);
  };

  const handleCloseEditor = () => {
    setActiveEssayMessage(null);
    setRightPanelCollapsed(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with LMS context if present */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">AI Assistant</h1>
          {isLoadingLmsContext && sessionIdFromUrl ? (
            // Show skeleton loaders while loading LMS context
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>
          ) : currentSession?.lmsContext ? (
            // Show actual LMS context when loaded
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {currentSession.lmsContext.courseTitle}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {currentSession.lmsContext.stepTitle}
              </Badge>
            </div>
          ) : null}
        </div>
        {isLoadingLmsContext && sessionIdFromUrl ? (
          // Show skeleton for return button while loading
          <Skeleton className="h-9 w-32" />
        ) : currentSession?.lmsContext?.returnUrl ? (
          // Show actual return button when loaded
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = currentSession.lmsContext!.returnUrl!}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Course
          </Button>
        ) : null}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 text-sm">
          {error}
        </div>
      )}
      
      <SplitScreenLayout
        leftPanel={
          <>
            <ChatContainer
              session={currentSession || undefined}
              onSendMessage={handleSendMessage}
              isLoading={isLoading || !selectedAgentId}
              streamingMessage={streamingMessage}
              streamingSummary={streamingSummary}
              pendingUserMessage={pendingUserMessage}
              onOpenInEditor={handleOpenInEditor}
              activeEditorMessageId={activeEssayMessage?.id}
              className="h-full"
            />
            {/* ChatFAB removed to fix infinite loop error */}
          </>
        }
        rightPanel={
          activeEssayMessage ? (
            <Editor
              message={activeEssayMessage}
              streamingContent={activeEssayMessage.id === 'streaming-essay' ? streamingMessage : undefined}
              isStreaming={activeEssayMessage.id === 'streaming-essay' && !!streamingMessage}
              onClose={handleCloseEditor}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>Select a message to edit</p>
            </div>
          )
        }
        defaultState={activeEssayMessage ? 'both' : 'left'}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <PanelProvider>
      <ChatPageContent />
    </PanelProvider>
  );
}
