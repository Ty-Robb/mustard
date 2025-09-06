'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, User, Bot, FileEdit, ChevronRight, Presentation } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ResponseAnalyzer } from '@/lib/utils/response-analyzer';
import { ResponseParser } from '@/lib/utils/response-parser';
import { EditorPreview } from './EditorPreview';
import { ChartRenderer } from './ChartRenderer';
import { TableRenderer } from './TableRenderer';
import { PresentationNode } from './PresentationNode';
import { PresentationPreview } from './PresentationPreview';
import { ShimmerCard } from '@/components/ui/shimmer';
import { List } from 'lucide-react';
import { PresentationParser } from '@/lib/utils/presentation-parser';
import { ChatSuggestions } from './ChatSuggestions';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  streamingSummary?: string | null;
  previousMessage?: ChatMessageType;
  onOpenInEditor?: (message: ChatMessageType) => void;
  isEditorOpen?: boolean;
  showAsSummary?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  onSendMessage?: (content: string) => void;
  conversationHasPresentation?: boolean;
}

export function ChatMessage({ 
  message, 
  isStreaming, 
  streamingSummary,
  previousMessage, 
  onOpenInEditor,
  isEditorOpen,
  showAsSummary,
  onSuggestionClick,
  onSendMessage,
  conversationHasPresentation = false
}: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);
  const [showPresentationFull, setShowPresentationFull] = React.useState(false);
  const isUser = message.role === 'user';
  
  // Track streaming progress
  const [streamingStartTime, setStreamingStartTime] = React.useState<number | null>(null);
  const contentLength = message.content?.length || 0;
  
  // Generate dynamic title based on user's question
  const generateDynamicTitle = (userQuestion: string) => {
    if (!userQuestion) return 'Summary';
    
    // Extract key topic from the question
    const question = userQuestion.toLowerCase();
    
    // Common question patterns
    if (question.includes('what is') || question.includes('what are')) {
      return 'Definition & Overview';
    } else if (question.includes('how to') || question.includes('how do')) {
      return 'Guide & Instructions';
    } else if (question.includes('why')) {
      return 'Explanation & Reasoning';
    } else if (question.includes('when')) {
      return 'Timeline & Context';
    } else if (question.includes('who')) {
      return 'People & Roles';
    } else if (question.includes('where')) {
      return 'Location & Setting';
    } else if (question.includes('difference') || question.includes('compare')) {
      return 'Comparison & Analysis';
    } else if (question.includes('explain')) {
      return 'Detailed Explanation';
    } else if (question.includes('list') || question.includes('examples')) {
      return 'Examples & List';
    } else if (question.includes('bible') || question.includes('scripture') || question.includes('verse')) {
      return 'Biblical Insight';
    } else if (question.includes('sermon') || question.includes('preach')) {
      return 'Sermon Summary';
    } else if (question.includes('pray') || question.includes('prayer')) {
      return 'Prayer & Reflection';
    } else if (question.includes('church') || question.includes('ministry')) {
      return 'Ministry Insight';
    } else {
      // Default: Use first few words of the question
      const words = userQuestion.split(' ').slice(0, 3);
      return words.join(' ') + '...';
    }
  };
  
  // Determine streaming status based on content length and time
  const getStreamingStatus = () => {
    if (!isStreaming || isUser) return '';
    
    // If no content yet, we're just starting
    if (contentLength === 0) {
      return 'Analyzing your question...';
    }
    
    // Based on content length thresholds
    if (contentLength < 100) {
      return 'Gathering information...';
    } else if (contentLength < 300) {
      return 'Organizing response...';
    } else {
      return 'Finalizing content...';
    }
  };
  
  // Set streaming start time when streaming begins
  React.useEffect(() => {
    if (isStreaming && !streamingStartTime) {
      setStreamingStartTime(Date.now());
    } else if (!isStreaming) {
      setStreamingStartTime(null);
    }
  }, [isStreaming, streamingStartTime]);

  // Store the initial parsed response to prevent changes during streaming
  const [stableParsedResponse, setStableParsedResponse] = React.useState<any>(null);
  
  // Parse the response to separate conversational from content
  const parsedResponse = React.useMemo(() => {
    if (isUser) return null;
    
    // If we're streaming and already have a stable response, return it
    if (isStreaming && stableParsedResponse) {
      return stableParsedResponse;
    }
    
    const userPrompt = previousMessage?.role === 'user' ? previousMessage.content : '';
    const analysis = ResponseAnalyzer.analyzeResponse(userPrompt, message.content);
    
    const parsed = ResponseParser.parseResponse(message.content, analysis);
    
    // Store the parsed response when streaming stops
    if (!isStreaming && parsed && !stableParsedResponse) {
      setStableParsedResponse(parsed);
    }
    
    return parsed;
  }, [isUser, isStreaming, previousMessage, message.content, stableParsedResponse]);
  
  // Reset stable response when message changes (new message)
  React.useEffect(() => {
    setStableParsedResponse(null);
  }, [message.id]);

  // Track content stability
  const [contentStableAt, setContentStableAt] = React.useState<number | null>(null);
  const [isContentStable, setIsContentStable] = React.useState(false);
  
  // Monitor content stability
  React.useEffect(() => {
    if (isStreaming || !message.content) {
      setContentStableAt(null);
      setIsContentStable(false);
      return;
    }
    
    // Set timestamp when content becomes stable
    if (!contentStableAt) {
      setContentStableAt(Date.now());
    }
    
    // Check if content has been stable for 500ms
    const stabilityTimer = setTimeout(() => {
      if (contentStableAt && Date.now() - contentStableAt >= 500) {
        setIsContentStable(true);
      }
    }, 500);
    
    return () => clearTimeout(stabilityTimer);
  }, [isStreaming, message.content, contentStableAt]);
  
  // Parse presentation content
  const parsedPresentation = React.useMemo(() => {
    // Absolutely prevent parsing during streaming
    if (isUser || isStreaming) {
      console.log('[PresentationDebug] Skipping parse - isUser:', isUser, 'isStreaming:', isStreaming);
      return null;
    }
    
    // Wait for content to be stable
    if (!isContentStable) {
      console.log('[PresentationDebug] Skipping parse - content not stable yet');
      return null;
    }
    
    // Additional check: ensure content is stable and not empty
    if (!message.content || message.content.length < 50) {
      console.log('[PresentationDebug] Skipping parse - content too short:', message.content?.length);
      return null;
    }
    
    // Use the cleaned content from parsedResponse if available, otherwise use raw content
    const contentToParse = parsedResponse?.content || message.content;
    
    // Debug logging
    console.log('[PresentationDebug] Parsing content for presentation:', {
      isStreaming,
      isContentStable,
      hasResponseParser: !!parsedResponse,
      contentLength: contentToParse.length,
      contentPreview: contentToParse.substring(0, 200),
      hasPresentationKeyword: contentToParse.toLowerCase().includes('presentation'),
      hasSlideKeyword: contentToParse.toLowerCase().includes('slide'),
    });
    
    const result = PresentationParser.parsePresentation(contentToParse);
    
    if (result) {
      console.log('[PresentationDebug] Presentation detected:', {
        title: result.title,
        slideCount: result.slides.length,
        firstSlide: result.slides[0],
      });
    } else {
      console.log('[PresentationDebug] No presentation detected');
    }
    
    return result;
  }, [isUser, isStreaming, message.content, parsedResponse, isContentStable]);
  
  // Extract summary from parsed response for display
  const extractedSummary = parsedResponse?.summary;

  // Early detection of editor-worthy content during streaming
  const [willShowEditor, setWillShowEditor] = React.useState(false);
  const [earlyContentType, setEarlyContentType] = React.useState<string>('general');
  
  // Detect early if this will be editor-worthy based on user prompt and initial content
  React.useEffect(() => {
    if (!isUser && previousMessage?.role === 'user' && message.content.length > 50) {
      const userPrompt = previousMessage.content;
      const analysis = ResponseAnalyzer.analyzeStreamingContent(userPrompt, message.content);
      
      if (analysis.shouldOpenEditor && !willShowEditor) {
        setWillShowEditor(true);
        setEarlyContentType(analysis.contentType);
      }
    }
  }, [isUser, previousMessage, message.content, willShowEditor]);
  
  // Check if this response should have an "Open in Editor" button
  const shouldShowEditorButton = React.useMemo(() => {
    if (isUser || !previousMessage || !onOpenInEditor) return false;
    
    // During streaming, use early detection
    if (isStreaming) {
      return willShowEditor;
    }
    
    // After streaming, use full analysis
    const userPrompt = previousMessage.role === 'user' ? previousMessage.content : '';
    return ResponseAnalyzer.shouldShowInEditor(userPrompt, message.content);
  }, [isUser, isStreaming, previousMessage, message.content, onOpenInEditor, willShowEditor]);

  // Determine if we should show as summary for essay-type content
  const shouldShowSummary = shouldShowEditorButton && !isUser && parsedResponse?.content && !parsedPresentation;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInEditor = () => {
    if (onOpenInEditor) {
      onOpenInEditor(message);
    }
  };

  const handleMakePresentation = () => {
    if (onSendMessage && previousMessage) {
      // Extract topic from the conversation
      const topic = extractTopicFromConversation(previousMessage.content, message.content);
      
      // Send a message to trigger the AI presentation workflow
      const presentationPrompt = `Create a transformational presentation about ${topic} that guides the audience from their current reality to a better future`;
      
      onSendMessage(presentationPrompt);
    }
  };

  // Helper function to extract topic from conversation
  const extractTopicFromConversation = (userMessage: string, assistantResponse: string): string => {
    // Try to extract topic from user's message first
    const userWords = userMessage.toLowerCase().split(' ');
    
    // Remove common question words
    const questionWords = ['what', 'is', 'are', 'how', 'to', 'do', 'does', 'why', 'when', 'where', 'who', 'which', 'can', 'could', 'would', 'should', 'tell', 'me', 'about', 'explain', 'describe'];
    const meaningfulWords = userWords.filter(word => !questionWords.includes(word) && word.length > 2);
    
    if (meaningfulWords.length > 0) {
      // Take the first 3-5 meaningful words as the topic
      return meaningfulWords.slice(0, Math.min(5, meaningfulWords.length)).join(' ');
    }
    
    // Fallback: try to extract from the assistant's response title or first header
    const headers = assistantResponse.match(/^#+\s+(.+)$/m);
    if (headers && headers[1]) {
      return headers[1].toLowerCase();
    }
    
    // Final fallback
    return 'the discussed topic';
  };

  // Helper function to create presentation content from regular content
  const createPresentationFromContent = (content: string, contentType: string): string => {
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines.filter(line => line.startsWith('#'));
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim() && !p.startsWith('#'));
    
    let slides: string[] = [];
    
    // Title slide
    const title = headers[0]?.replace(/^#+\s*/, '') || 'Presentation';
    slides.push(`# Slide 1: ${title}\n\n- Overview of key concepts\n- Main discussion points`);
    
    // Create slides based on content structure
    if (headers.length > 1) {
      // Create a slide for each major section
      headers.slice(1).forEach((header, index) => {
        const headerText = header.replace(/^#+\s*/, '');
        const slideNumber = index + 2;
        
        // Find content related to this header
        const headerIndex = lines.indexOf(header);
        let slideContent = `# Slide ${slideNumber}: ${headerText}\n\n`;
        
        // Add bullet points from the content following this header
        for (let i = headerIndex + 1; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith('#')) break; // Stop at next header
          
          if (line.trim()) {
            // Convert paragraphs to bullet points
            if (!line.startsWith('-') && !line.startsWith('*')) {
              slideContent += `- ${line.trim()}\n`;
            } else {
              slideContent += `${line}\n`;
            }
          }
        }
        
        slides.push(slideContent.trim());
      });
    } else {
      // Create slides from paragraphs if no headers
      paragraphs.slice(0, 5).forEach((para, index) => {
        const slideNumber = index + 2;
        const points = para.split('. ').filter(p => p.trim());
        
        slides.push(`# Slide ${slideNumber}: Key Point ${index + 1}\n\n${points.map(p => `- ${p.trim()}`).join('\n')}`);
      });
    }
    
    // Conclusion slide
    slides.push(`# Slide ${slides.length + 1}: Conclusion\n\n- Summary of main points\n- Key takeaways\n- Next steps`);
    
    return slides.join('\n\n---\n\n');
  };

  return (
    <div
      className={cn(
        'w-full',
        isUser ? 'bg-background' : 'bg-muted/50'
      )}
    >
      <div className="flex justify-center">
        <div className="flex gap-3 p-4 w-full max-w-3xl">
          <Avatar className="h-8 w-8 shrink-0">
            {isUser ? (
              <>
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </>
            ) : (
              <>
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </>
            )}
          </Avatar>

          <div className="flex-1 space-y-2 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isUser ? 'You' : 'Assistant'}
              </span>
              {message.metadata?.agentId && (
                <span className="text-xs text-muted-foreground">
                  • {message.metadata.agentId}
                </span>
              )}
              {message.id === 'pending-user' && (
                <span className="text-xs text-muted-foreground italic">
                  • Sending...
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {isStreaming && !isUser && shouldShowEditorButton ? (
              // Show final structure during streaming for editor-worthy content
              <>
                {/* Show executive summary with streaming indicator */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-base">
                    {streamingSummary || getStreamingStatus()}
                    {isStreaming && <span className="inline-block w-1 h-4 bg-foreground animate-pulse ml-1" />}
                  </p>
                </div>
                
                {/* Add visual separator before editor preview */}
                <div className="my-4 border-t border-border/50" />
                
                {/* Show editor preview card with streaming state */}
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md m-2",
                    "border-muted-foreground/10 opacity-60"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                        <FileEdit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm truncate">Document</h3>
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Generating content...
                        </p>
                        <ShimmerCard className="h-8" />
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Please wait while we prepare your response</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : isStreaming && !isUser ? (
              // Show loading animation for all streaming content
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {getStreamingStatus()}
                </p>
                <ShimmerCard className="h-20" />
              </div>
            ) : parsedPresentation && !isStreaming ? (
              <>
                {/* Show conversational part if present */}
                {parsedResponse?.conversational && (
                  <div className="prose prose-sm dark:prose-invert max-w-none mb-3">
                    <ReactMarkdown>{parsedResponse.conversational}</ReactMarkdown>
                  </div>
                )}
                
                {/* Add visual separator before presentation */}
                <div className="my-4 border-t border-border/50" />
                
                {/* Show presentation preview or full view based on state */}
                {showPresentationFull ? (
                  <PresentationNode
                    message={message}
                    slides={parsedPresentation.slides}
                    title={parsedPresentation.title}
                    onOpenInEditor={onOpenInEditor}
                    className="mt-4"
                  />
                ) : (
                  <PresentationPreview
                    message={message}
                    presentation={parsedPresentation}
                    onClick={() => setShowPresentationFull(true)}
                    className="mt-4"
                  />
                )}
              </>
            ) : shouldShowSummary ? (
              <>
                {/* Show conversational part if present */}
                {parsedResponse?.conversational && (
                  <div className="prose prose-sm dark:prose-invert max-w-none mb-3">
                    <ReactMarkdown>{parsedResponse.conversational}</ReactMarkdown>
                  </div>
                )}
                
                {/* Show executive summary as the main response */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-base">
                    {parsedResponse?.summary || ResponseParser.generateExecutiveSummary(
                      parsedResponse?.content || message.content,
                      parsedResponse?.contentType || 'general'
                    )}
                  </p>
                </div>
                
                {/* Add visual separator before editor preview */}
                <div className="my-4 border-t border-border/50" />
                
                {/* Show editor preview card for accessing full content */}
                <EditorPreview 
                  message={message}
                  onClick={handleOpenInEditor}
                  isActive={isEditorOpen}
                  previousMessage={previousMessage}
                />
              </>
            ) : extractedSummary && parsedResponse?.content ? (
              // Show split view with summary on left and content on right
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left side - Summary Card */}
                <Card className="border-muted-foreground/10">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                        <List className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-2">
                          {generateDynamicTitle(previousMessage?.content || '')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {extractedSummary}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Right side - Detailed Content */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="relative">
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute right-2 top-2"
                              onClick={() => {
                                navigator.clipboard.writeText(String(children));
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {parsedResponse.content}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <div className="relative">
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute right-2 top-2"
                                onClick={() => {
                                  navigator.clipboard.writeText(String(children));
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                  {isStreaming && !message.content && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                  {isStreaming && message.content && (
                    <span className="inline-block w-1 h-4 bg-foreground animate-pulse" />
                  )}
                </div>

                {/* Render attachments (charts and tables) integrated into the message */}
                {!isUser && message.metadata?.attachments?.map((attachment) => {
                  if (attachment.type === 'chart' && attachment.data && attachment.config) {
                    return (
                      <ChartRenderer
                        key={attachment.id}
                        data={attachment.data as any}
                        config={attachment.config as any}
                        className="mt-4"
                      />
                    );
                  } else if (attachment.type === 'table' && attachment.data && attachment.config) {
                    return (
                      <TableRenderer
                        key={attachment.id}
                        data={attachment.data as any}
                        config={attachment.config as any}
                        className="mt-4"
                      />
                    );
                  }
                  return null;
                })}
              </>
            )}

            {!isUser && !isStreaming && (
              <>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="h-7 px-2"
                  >
                    {copied ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span className="ml-1 text-xs">
                      {copied ? 'Copied' : 'Copy'}
                    </span>
                  </Button>
                  
                  {shouldShowEditorButton && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleOpenInEditor}
                        className="h-7 px-2"
                      >
                        <FileEdit className="h-3 w-3" />
                        <span className="ml-1 text-xs">
                          Open in Editor
                        </span>
                      </Button>
                      
                      {!conversationHasPresentation && !parsedPresentation && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleMakePresentation}
                          className="h-7 px-2"
                        >
                          <Presentation className="h-3 w-3" />
                          <span className="ml-1 text-xs">
                            Make Presentation
                          </span>
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {/* Follow-up suggestions */}
                {onSuggestionClick && message.metadata?.suggestions?.followUpQuestions && (
                  <ChatSuggestions
                    variant="followup"
                    suggestions={message.metadata.suggestions.followUpQuestions}
                    onSuggestionClick={onSuggestionClick}
                  />
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
