'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Send, Sparkles, User, Bot, BookOpen, Calendar, Link, MapPin, RefreshCw, History, Highlighter } from 'lucide-react';
import { usePanel } from '@/contexts/PanelContext';
import { useAuth } from '@/hooks/useAuth';
import { ChatHistoryTab } from './ChatHistoryTab';
import { HighlightsTab } from './HighlightsTab';
import type { AIInsight } from '@/app/api/insights/route';
import type { ChatSession as DBChatSession, ChatMessage } from '@/types/chat';
import type { Highlight } from '@/types/highlights';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  selectedText?: string;
  reference?: string;
}

interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  lastUpdated: Date;
  selectedText: string;
  reference?: string;
}

interface AIInsightsPanelProps {
  selectedText: string;
  verseContext?: string;
  reference?: string;
  actionType?: string;
  actionPrompt?: string;
  onGenerate: (text: string, context?: string, ref?: string, actionType?: string) => Promise<AIInsight>;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

interface ContextAction {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

export function AIInsightsPanel({
  selectedText,
  verseContext,
  reference,
  actionType,
  actionPrompt,
  onGenerate,
  activeTab: externalActiveTab,
  onTabChange,
}: AIInsightsPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextActions, setContextActions] = useState<ContextAction[]>([]);
  const [chatSessionId, setChatSessionId] = useState<string>('');
  const [lastFailedAction, setLastFailedAction] = useState<ContextAction | null>(null);
  const [internalActiveTab, setInternalActiveTab] = useState<string>('chat');
  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = (tab: string) => {
    setInternalActiveTab(tab);
    onTabChange?.(tab);
  };
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toggleLeftPanel } = usePanel();
  const { currentUser } = useAuth();

  // Create a new chat session when component mounts or when new text is selected
  useEffect(() => {
    if (selectedText && selectedText.trim() && currentUser) {
      createChatSession();
    }
  }, [selectedText, reference]);

  const createChatSession = async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      
      // Parse reference to get book ID and chapter
      const bookId = reference?.split(' ')[0] || '';
      const chapterMatch = reference?.match(/(\d+)/);
      const chapter = chapterMatch ? parseInt(chapterMatch[1]) : undefined;
      
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `${reference || 'Bible Study'}: ${selectedText.substring(0, 50)}...`,
          context: {
            selectedText,
            reference: reference || '',
            bibleId: 'de4e12af7f28f599-01', // KJV Bible ID - you may want to make this dynamic
            bookId,
            chapter,
            verseIds: [], // Could be populated if we have specific verse IDs
          },
          tags: ['bible-study', 'ai-insights'],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Session response:', data);
        const sessionId = data.session._id || data.session.id || data._id;
        setChatSessionId(sessionId);
        console.log('Created chat session:', sessionId);
      } else {
        const error = await response.json();
        console.error('Failed to create chat session:', response.status, error);
      }
    } catch (error) {
      console.error('Failed to create chat session:', error);
    }
  };

  const saveMessage = async (message: Message) => {
    if (!currentUser || !chatSessionId) return;

    try {
      const token = await currentUser.getIdToken();
      
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: chatSessionId,
          role: message.role,
          content: message.content,
          metadata: {
            selectedText: message.selectedText,
            reference: message.reference,
            timestamp: message.timestamp,
          },
        }),
      });
      
      console.log('Saved message to database');
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  // When new text is selected, analyze it for context actions
  useEffect(() => {
    if (selectedText && selectedText.trim() && !actionType) {
      analyzeText();
    } else if (selectedText && selectedText.trim() && actionType) {
      handleGenerateInsights();
    }
  }, [selectedText, actionType]);

  const analyzeText = async () => {
    if (!currentUser) return;

    setIsAnalyzing(true);
    setContextActions([]);
    
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: selectedText }),
      });

      if (response.ok) {
        const data = await response.json();
        // Take only the first 4 actions for the UI
        setContextActions(data.actions.slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to analyze text:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createAIHighlight = async (actionId: string, messageId: string) => {
    if (!currentUser || !chatSessionId || !reference) return;

    try {
      const token = await currentUser.getIdToken();
      
      // Create a brief summary for the highlight note
      const actionLabels: Record<string, string> = {
        'biography': 'Biography insight',
        'timeline': 'Timeline of events',
        'word-study': 'Word study',
        'location': 'Location significance',
        'practical-application': 'Practical application',
        'cross-references': 'Cross references',
        'commentary': 'Commentary',
        'theology': 'Theological significance',
        'number-significance': 'Number significance',
        'related-verses': 'Related verses',
        'summarize': 'Passage summary',
      };

      // Convert reference format from "1 John 1" to a more flexible format
      // This will be matched by the highlight loading logic
      const normalizedReference = reference;

      const response = await fetch('/api/highlights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reference: normalizedReference,
          text: selectedText,
          type: 'ai',
          color: '#dbeafe', // Light blue color for AI highlights
          note: actionLabels[actionId] || 'AI insight',
          aiContext: {
            sessionId: chatSessionId,
            messageId: messageId,
            action: actionId,
          },
          tags: ['ai-insight', actionId],
        }),
      });

      if (response.ok) {
        console.log('Created AI highlight');
      }
    } catch (error) {
      console.error('Failed to create AI highlight:', error);
    }
  };

  const handleActionSelect = async (action: ContextAction) => {
    console.log('handleActionSelect called with action:', action);
    
    const actionPrompts: Record<string, string> = {
      'biography': `Tell me about ${selectedText} - their life, character, and significance in the Bible.`,
      'timeline': `Create a timeline of events related to ${selectedText}.`,
      'word-study': `Perform a detailed word study on "${selectedText}".`,
      'location': `Tell me about the location ${selectedText} - its geography and Biblical significance.`,
      'practical-application': `How can I apply "${selectedText}" to my life today?`,
      'cross-references': `Find cross-references for "${selectedText}".`,
      'commentary': `Provide commentary on "${selectedText}".`,
      'theology': `Explain the theological significance of "${selectedText}".`,
      'number-significance': `What is the Biblical significance of ${selectedText}?`,
      'related-verses': `Find verses related to ${selectedText}.`,
      'summarize': `Summarize the key points of this passage: "${selectedText}".`,
    };

    const prompt = actionPrompts[action.id] || `Provide insights on: "${selectedText}"`;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
      selectedText,
      reference,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setContextActions([]); // Clear actions after selection

    try {
      console.log('Calling onGenerate with:', { selectedText, verseContext, reference, actionId: action.id });
      const insight = await onGenerate(selectedText, verseContext, reference, action.id);
      console.log('Received insight from API:', insight);
      
      const formattedContent = formatInsightResponse(insight);
      console.log('Formatted content:', formattedContent);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formattedContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setLastFailedAction(null);
      
      // Save both messages to database
      await saveMessage(userMessage);
      await saveMessage(assistantMessage);
      
      // Create AI highlight
      await createAIHighlight(action.id, assistantMessage.id);
    } catch (err) {
      console.error('Error in handleActionSelect:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
      setLastFailedAction(action);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '**Error**: Unable to generate insights at this time. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (lastFailedAction) {
      handleActionSelect(lastFailedAction);
    }
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleGenerateInsights = async () => {
    if (!selectedText || !selectedText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: actionPrompt || `Generate insights for: "${selectedText}"`,
      timestamp: new Date(),
      selectedText,
      reference,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const insight = await onGenerate(selectedText, verseContext, reference, actionType);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formatInsightResponse(insight),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Save both messages to database
      await saveMessage(userMessage);
      await saveMessage(assistantMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '**Error**: Unable to generate insights at this time. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Save error message too
      await saveMessage(userMessage);
      await saveMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatInsightResponse = (insight: AIInsight): string => {
    console.log('formatInsightResponse received insight:', insight);
    
    let response = '';
    
    if (insight.theologicalInsights) {
      response += `**Theological Insights**\n${insight.theologicalInsights}\n\n`;
    }
    
    if (insight.keyThemes && insight.keyThemes.length > 0) {
      response += `**Key Themes**\n`;
      insight.keyThemes.forEach(theme => {
        response += `• ${theme}\n`;
      });
      response += '\n';
    }
    
    if (insight.historicalContext) {
      response += `**Historical Context**\n${insight.historicalContext}\n\n`;
    }
    
    if (insight.originalLanguage && insight.originalLanguage.insights) {
      response += `**Original Language Insights**\n${insight.originalLanguage.insights}\n`;
      if (insight.originalLanguage.hebrew) {
        response += `Hebrew: ${insight.originalLanguage.hebrew}\n`;
      }
      if (insight.originalLanguage.greek) {
        response += `Greek: ${insight.originalLanguage.greek}\n`;
      }
      response += '\n';
    }
    
    if (insight.practicalApplication) {
      response += `**Practical Application**\n${insight.practicalApplication}\n\n`;
    }
    
    if (insight.crossReferences && insight.crossReferences.length > 0) {
      response += `**Cross References**\n`;
      insight.crossReferences.forEach(ref => {
        response += `• ${ref}\n`;
      });
    }
    
    console.log('formatInsightResponse returning:', response);
    return response.trim();
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // For follow-up questions, we'll use the input as the selected text
      const insight = await onGenerate(input, verseContext, reference, actionType);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formatInsightResponse(insight),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Save both messages to database
      await saveMessage(userMessage);
      await saveMessage(assistantMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate response');
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '**Error**: Unable to generate response at this time. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Save error message too
      await saveMessage(userMessage);
      await saveMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Welcome screen quick actions
  const quickActions = [
    {
      id: 'chapter-summary',
      label: 'Summarize Chapter',
      icon: BookOpen,
      description: 'Get an overview of the current chapter',
      prompt: `Please provide a comprehensive summary of ${reference || 'this chapter'}, including key themes, important events, and main teachings.`,
    },
    {
      id: 'key-verses',
      label: 'Key Verses',
      icon: Sparkles,
      description: 'Find the most important verses',
      prompt: `What are the key verses in ${reference || 'this chapter'} and why are they significant?`,
    },
    {
      id: 'study-questions',
      label: 'Study Questions',
      icon: User,
      description: 'Get questions for deeper study',
      prompt: `Generate thoughtful study questions for ${reference || 'this chapter'} that would help someone understand and apply its teachings.`,
    },
    {
      id: 'historical-context',
      label: 'Historical Context',
      icon: Calendar,
      description: 'Understand the background',
      prompt: `Provide the historical and cultural context for ${reference || 'this chapter'}, including when it was written, who wrote it, and the circumstances.`,
    },
  ];

  const handleQuickAction = async (action: typeof quickActions[0]) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: action.prompt,
      timestamp: new Date(),
      reference,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setActiveTab('chat'); // Switch to chat tab

    try {
      const insight = await onGenerate(action.prompt, verseContext, reference, action.id);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formatInsightResponse(insight),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Save both messages to database
      await saveMessage(userMessage);
      await saveMessage(assistantMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '**Error**: Unable to generate insights at this time. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">AI Insights</h2>
          {chatSessionId && (
            <span className="text-xs text-muted-foreground">#{chatSessionId.slice(-6)}</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLeftPanel}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="highlights" className="flex items-center gap-2">
            <Highlighter className="h-4 w-4" />
            Highlights
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="p-6 space-y-6" style={{ fontSize: '1.125rem', lineHeight: '1.75' }}>
              {messages.length === 0 && !isAnalyzing && contextActions.length === 0 && (
                <div className="space-y-6">
                  {/* Welcome message */}
                  <div className="text-center py-4">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/20" />
                    <h3 className="text-lg font-semibold mb-2">Welcome to AI Insights</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Select text for specific insights or choose a quick action below
                    </p>
                  </div>

                  {/* Quick actions */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Quick Actions for {reference || 'Current Chapter'}:</p>
                    <div className="grid gap-3">
                      {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <Card
                            key={action.id}
                            className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => handleQuickAction(action)}
                          >
                            <div className="flex items-start gap-3">
                              <Icon className="h-5 w-5 text-primary mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm mb-1">{action.label}</h4>
                                <p className="text-xs text-muted-foreground">{action.description}</p>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tip */}
                  <div className="text-center pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: Select any text in the Bible and press <kbd className="px-1 py-0.5 text-xs border rounded">Cmd+U</kbd> for instant insights
                    </p>
                  </div>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center py-8">
                  <Skeleton className="h-4 w-48 mx-auto mb-2" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
              )}

              {messages.map((message, index) => (
                <div key={message.id} className="mb-6">
                  {/* User messages */}
                  {message.role === 'user' && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">You</span>
                      </div>
                      <div className="pl-6">
                        {message.selectedText && message.reference && (
                          <div className="text-sm text-muted-foreground mb-2">
                            {message.reference}
                          </div>
                        )}
                        <p className="text-foreground">{message.content}</p>
                      </div>
                    </div>
                  )}

                  {/* Assistant messages */}
                  {message.role === 'assistant' && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">AI Assistant</span>
                      </div>
                      <div className="pl-6 space-y-3">
                        {message.content.split('\n\n').map((paragraph, pIndex) => {
                          // Handle headers
                          if (paragraph.startsWith('**') && paragraph.includes('**')) {
                            const headerMatch = paragraph.match(/\*\*(.*?)\*\*/);
                            if (headerMatch) {
                              const headerText = headerMatch[1];
                              const remainingText = paragraph.replace(/\*\*.*?\*\*\s*/, '');
                              return (
                                <div key={pIndex}>
                                  <h3 className="font-semibold text-lg mb-2">{headerText}</h3>
                                  {remainingText && <p>{remainingText}</p>}
                                </div>
                              );
                            }
                          }
                          
                          // Handle lists
                          if (paragraph.includes('\n•')) {
                            const lines = paragraph.split('\n');
                            return (
                              <div key={pIndex}>
                                {lines[0] && !lines[0].startsWith('•') && (
                                  <p className="mb-2">{lines[0]}</p>
                                )}
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                  {lines.filter(line => line.startsWith('•')).map((item, iIndex) => (
                                    <li key={iIndex}>{item.substring(2)}</li>
                                  ))}
                                </ul>
                              </div>
                            );
                          }
                          
                          // Regular paragraphs
                          return paragraph.trim() ? (
                            <p key={pIndex}>{paragraph}</p>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Divider between messages */}
                  {index < messages.length - 1 && (
                    <div className="border-b border-border/50 mt-6" />
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-sm font-medium text-primary">AI Assistant</span>
                  </div>
                  <div className="pl-6 space-y-3">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              )}

              {error && messages.length > 0 && messages[messages.length - 1].content.includes('Error') && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    className="gap-2"
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Regenerate
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Bottom section with actions and input */}
          <div className="border-t">
            {/* Show context actions when available */}
            {contextActions.length > 0 && messages.length === 0 && (
              <div className="p-4 border-b bg-muted/30">
                <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Selected text:</p>
                    <p className="font-medium text-sm mb-2">"{selectedText}"</p>
                    <p className="text-xs text-muted-foreground">Choose an insight type:</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {contextActions.map((action) => {
                      const iconMap: Record<string, any> = {
                        'biography': User,
                        'timeline': Calendar,
                        'related-verses': Link,
                        'location': MapPin,
                        'word-study': BookOpen,
                        'cross-references': Link,
                        'commentary': BookOpen,
                        'theology': BookOpen,
                        'practical-application': BookOpen,
                        'number-significance': BookOpen,
                        'summarize': BookOpen,
                      };
                      const Icon = iconMap[action.id] || BookOpen;
                      
                      return (
                        <Button
                          key={action.id}
                          variant="outline"
                          size="sm"
                          className="justify-start gap-2 h-auto py-2 px-3"
                          onClick={() => handleActionSelect(action)}
                        >
                          <Icon className="h-3 w-3 flex-shrink-0" />
                          <span className="text-xs text-left">{action.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Input field */}
            <div className="p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2 max-w-3xl mx-auto"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={contextActions.length > 0 && messages.length === 0 ? "Or ask your own question..." : "Ask a follow-up question..."}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="flex-1 mt-0">
          <ChatHistoryTab 
            onSessionSelect={(sessionId) => {
              // TODO: Load the selected session
              console.log('Load session:', sessionId);
              setActiveTab('chat');
            }}
          />
        </TabsContent>

        {/* Highlights Tab */}
        <TabsContent value="highlights" className="flex-1 mt-0">
          <HighlightsTab 
            currentReference={reference}
            onHighlightClick={(highlight) => {
              // If it's an AI highlight with a session, load that session
              if (highlight.type === 'ai' && highlight.aiContext?.sessionId) {
                // TODO: Load the session
                console.log('Load session from highlight:', highlight.aiContext.sessionId);
                setActiveTab('chat');
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
