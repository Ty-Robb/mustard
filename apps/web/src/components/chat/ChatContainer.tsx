'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatSuggestions } from './ChatSuggestions';
import { ChatMessage as ChatMessageType, ChatAgent, ChatSession } from '@/types/chat';
import { cn } from '@/lib/utils';
import { PresentationParser } from '@/lib/utils/presentation-parser';

interface ChatContainerProps {
  session?: ChatSession;
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
  streamingMessage?: string;
  streamingSummary?: string | null;
  className?: string;
  onOpenInEditor?: (message: ChatMessageType) => void;
  activeEditorMessageId?: string;
}

export function ChatContainer({
  session,
  onSendMessage,
  isLoading = false,
  streamingMessage,
  streamingSummary,
  className,
  onOpenInEditor,
  activeEditorMessageId,
  pendingUserMessage,
}: ChatContainerProps & { pendingUserMessage?: string | null }) {
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, streamingMessage]);

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || input;
    if (!content.trim()) return;

    if (!messageContent) {
      setInput('');
    }
    
    try {
      await onSendMessage(content);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore input on error if it was from input field
      if (!messageContent) {
        setInput(content);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const messages = session?.messages || [];
  const displayMessages = [...messages];
  
  // Check if any message in the conversation contains a presentation
  const conversationHasPresentation = React.useMemo(() => {
    return messages.some(msg => {
      if (msg.role === 'assistant' && msg.content) {
        return PresentationParser.isPresentationContent(msg.content);
      }
      return false;
    });
  }, [messages]);
  
  // Add pending user message if present
  if (pendingUserMessage) {
    displayMessages.push({
      id: 'pending-user',
      role: 'user',
      content: pendingUserMessage,
      timestamp: new Date(),
    });
  }
  
  // Add streaming message if present
  if (streamingMessage || (pendingUserMessage && !streamingMessage)) {
    displayMessages.push({
      id: 'streaming',
      role: 'assistant',
      content: streamingMessage || '',
      timestamp: new Date(),
    });
  }

  return (
    <Card className={cn('flex flex-col h-full border-none bg-transparent', className)}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar" ref={scrollAreaRef}>
        <div className="flex flex-col">
          {displayMessages.length === 0 ? (
            <ChatSuggestions 
              onSuggestionClick={handleSuggestionClick}
              variant="starter"
            />
          ) : (
            <>
              {displayMessages.map((message, index) => (
                <React.Fragment key={message.id}>
                  <ChatMessage
                    message={message}
                    isStreaming={message.id === 'streaming'}
                    streamingSummary={message.id === 'streaming' ? streamingSummary : undefined}
                    previousMessage={index > 0 ? displayMessages[index - 1] : undefined}
                    onOpenInEditor={onOpenInEditor}
                    isEditorOpen={activeEditorMessageId === message.id}
                    showAsSummary={false}
                    onSuggestionClick={handleSuggestionClick}
                    onSendMessage={handleSendMessage}
                    conversationHasPresentation={conversationHasPresentation}
                  />
                  {index < displayMessages.length - 1 && (
                    <Separator className="my-0" />
                  )}
                </React.Fragment>
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t">
        <div className="flex justify-center">
          <div className="w-full max-w-3xl">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSendMessage}
              isLoading={isLoading}
              placeholder={isLoading ? "Loading..." : "Type a message..."}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

// Import Bot icon that was missing
import { Bot } from 'lucide-react';
