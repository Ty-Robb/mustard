'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Copy, Check, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AIAction } from './EditorSelectionToolbar';

export interface AIEditSuggestion {
  action: AIAction;
  original: string;
  suggestions: string[];
  explanation?: string;
}

interface EditorAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: AIEditSuggestion | null;
  onAccept: (text: string) => void;
  onReject: () => void;
  loading?: boolean;
  error?: string | null;
}

export function EditorAIModal({
  isOpen,
  onClose,
  suggestion,
  onAccept,
  onReject,
  loading = false,
  error = null,
}: EditorAIModalProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [showComparison, setShowComparison] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (suggestion) {
      setSelectedSuggestion(0);
    }
  }, [suggestion]);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getActionTitle = (action: AIAction) => {
    const titles: Record<AIAction, string> = {
      enhance: 'Enhanced Version',
      expand: 'Expanded Content',
      summarize: 'Summarized Version',
      rephrase: 'Rephrased Content',
      ideas: 'Content Ideas',
    };
    return titles[action] || 'AI Suggestions';
  };

  const getActionDescription = (action: AIAction) => {
    const descriptions: Record<AIAction, string> = {
      enhance: 'Improved clarity, style, and fixed grammar',
      expand: 'Added more detail and context',
      summarize: 'Condensed to key points',
      rephrase: 'Alternative phrasing and tone',
      ideas: 'Suggestions for continuing or expanding',
    };
    return descriptions[action] || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">
              {suggestion ? getActionTitle(suggestion.action) : 'AI Editor Assistant'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Generating suggestions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={onClose}>Close</Button>
            </div>
          ) : suggestion ? (
            <div className="space-y-6">
              {/* Action Description */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {getActionDescription(suggestion.action)}
                </p>
              </div>

              {/* Comparison Toggle */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Review Changes</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                >
                  {showComparison ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Original
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Original
                    </>
                  )}
                </Button>
              </div>

              {/* Content Display */}
              {showComparison ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* Original */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Original</h4>
                      <Badge variant="secondary">Before</Badge>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{suggestion.original}</p>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Suggested</h4>
                      <Badge variant="default">After</Badge>
                    </div>
                    {suggestion.suggestions.length > 1 ? (
                      <Tabs value={selectedSuggestion.toString()} onValueChange={(v) => setSelectedSuggestion(parseInt(v))}>
                        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${suggestion.suggestions.length}, 1fr)` }}>
                          {suggestion.suggestions.map((_, index) => (
                            <TabsTrigger key={index} value={index.toString()}>
                              Option {index + 1}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {suggestion.suggestions.map((text, index) => (
                          <TabsContent key={index} value={index.toString()}>
                            <div className="bg-primary/10 p-4 rounded-lg relative">
                              <p className="text-sm whitespace-pre-wrap">{text}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(text, index)}
                                className="absolute top-2 right-2"
                              >
                                {copiedIndex === index ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    ) : (
                      <div className="bg-primary/10 p-4 rounded-lg relative">
                        <p className="text-sm whitespace-pre-wrap">{suggestion.suggestions[0]}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(suggestion.suggestions[0], 0)}
                          className="absolute top-2 right-2"
                        >
                          {copiedIndex === 0 ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestion.suggestions.length > 1 ? (
                    <Tabs value={selectedSuggestion.toString()} onValueChange={(v) => setSelectedSuggestion(parseInt(v))}>
                      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${suggestion.suggestions.length}, 1fr)` }}>
                        {suggestion.suggestions.map((_, index) => (
                          <TabsTrigger key={index} value={index.toString()}>
                            Option {index + 1}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {suggestion.suggestions.map((text, index) => (
                        <TabsContent key={index} value={index.toString()}>
                          <div className="bg-primary/10 p-6 rounded-lg relative">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(text, index)}
                              className="absolute top-2 right-2"
                            >
                              {copiedIndex === index ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : (
                    <div className="bg-primary/10 p-6 rounded-lg relative">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{suggestion.suggestions[0]}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(suggestion.suggestions[0], 0)}
                        className="absolute top-2 right-2"
                      >
                        {copiedIndex === 0 ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              {suggestion.explanation && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Why these changes?</h4>
                  <p className="text-sm text-muted-foreground">{suggestion.explanation}</p>
                </div>
              )}
            </div>
          ) : null}
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Press <kbd className="px-2 py-1 text-xs border rounded">Esc</kbd> to close
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onReject();
                  onClose();
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => {
                  if (suggestion) {
                    onAccept(suggestion.suggestions[selectedSuggestion]);
                    onClose();
                  }
                }}
                disabled={!suggestion}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
