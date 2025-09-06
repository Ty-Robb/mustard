'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  ChevronRight,
  Wand2,
  FileText,
  Lightbulb,
  MessageSquare,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { AIAction } from './EditorSelectionToolbar';

export interface AIEditSuggestion {
  action: AIAction;
  original: string;
  suggestions: string[];
  explanation?: string;
}

interface SimplifiedAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: AIEditSuggestion | null;
  onAccept: (text: string) => void;
  onReject: () => void;
  loading?: boolean;
  error?: string | null;
  editor?: any;
  onAIAction?: (action: AIAction, text: string, customInstructions?: string) => void;
  selectedText?: string;
}

const ACTION_INFO = {
  enhance: {
    icon: Wand2,
    title: 'Enhance Writing',
    description: 'Improve clarity, fix grammar, and polish your text',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  expand: {
    icon: FileText,
    title: 'Expand Content',
    description: 'Add more detail and depth to your text',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  summarize: {
    icon: Zap,
    title: 'Summarize',
    description: 'Create a concise version of your text',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  rephrase: {
    icon: RefreshCw,
    title: 'Rephrase',
    description: 'Say it differently with a new tone or style',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  ideas: {
    icon: Lightbulb,
    title: 'Get Ideas',
    description: 'Suggestions for continuing or expanding your content',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  }
};

export function SimplifiedAIModal({
  isOpen,
  onClose,
  suggestion,
  onAccept,
  onReject,
  loading = false,
  error = null,
  editor,
  onAIAction,
  selectedText = '',
}: SimplifiedAIModalProps) {
  const [selectedOption, setSelectedOption] = useState(0);
  const [customRequest, setCustomRequest] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    if (suggestion) {
      setSelectedOption(0);
    }
  }, [suggestion]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowCustom(false);
      setCustomRequest('');
    }
  }, [isOpen]);

  const handleQuickAction = (action: AIAction) => {
    if (onAIAction && selectedText) {
      onAIAction(action, selectedText);
    }
  };

  const handleCustomRequest = () => {
    if (onAIAction && selectedText && customRequest.trim()) {
      onAIAction('enhance', selectedText, customRequest);
      setCustomRequest('');
      setShowCustom(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">AI Writing Assistant</h2>
              <p className="text-sm text-muted-foreground">
                {suggestion ? 'Review AI suggestions' : 'How can I help improve your text?'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <Sparkles className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                </div>
                <p className="mt-4 text-muted-foreground">Working on it...</p>
                <p className="text-sm text-muted-foreground mt-1">This usually takes a few seconds</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="p-3 bg-destructive/10 rounded-full w-fit mx-auto mb-4">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-destructive font-medium mb-2">Something went wrong</p>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button onClick={onClose} variant="outline">Try Again</Button>
              </div>
            ) : suggestion ? (
              <div className="space-y-6">
                {/* Action Badge */}
                <div className="flex items-center gap-3">
                  {(() => {
                    const actionInfo = ACTION_INFO[suggestion.action];
                    const Icon = actionInfo.icon;
                    return (
                      <>
                        <div className={cn("p-2 rounded-lg", actionInfo.bgColor)}>
                          <Icon className={cn("h-5 w-5", actionInfo.color)} />
                        </div>
                        <div>
                          <h3 className="font-medium">{actionInfo.title}</h3>
                          <p className="text-sm text-muted-foreground">{actionInfo.description}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Original Text */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Your original text:</h4>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{suggestion.original}</p>
                  </div>
                </div>

                {/* AI Suggestions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    AI suggestion{suggestion.suggestions.length > 1 ? 's' : ''}:
                  </h4>
                  {suggestion.suggestions.map((text, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all",
                        selectedOption === index
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/30 hover:border-muted-foreground/20"
                      )}
                      onClick={() => setSelectedOption(index)}
                    >
                      {suggestion.suggestions.length > 1 && (
                        <Badge variant="outline" className="mb-2">
                          Option {index + 1}
                        </Badge>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{text}</p>
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                {suggestion.explanation && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <span className="font-medium">Why this change?</span> {suggestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selected Text Preview */}
                {selectedText && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Selected text:</h4>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap line-clamp-3">{selectedText}</p>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Choose an action:</h4>
                  <div className="grid gap-3">
                    {Object.entries(ACTION_INFO).map(([action, info]) => {
                      const Icon = info.icon;
                      return (
                        <button
                          key={action}
                          onClick={() => handleQuickAction(action as AIAction)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-lg border text-left transition-all",
                            "hover:border-primary hover:bg-muted/50",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          )}
                        >
                          <div className={cn("p-2 rounded-lg shrink-0", info.bgColor)}>
                            <Icon className={cn("h-5 w-5", info.color)} />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium">{info.title}</h5>
                            <p className="text-sm text-muted-foreground">{info.description}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Request */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowCustom(!showCustom)}
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Or describe what you want
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      showCustom && "rotate-90"
                    )} />
                  </button>
                  
                  {showCustom && (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="E.g., 'Make this more formal' or 'Add biblical references'"
                        value={customRequest}
                        onChange={(e) => setCustomRequest(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <Button
                        onClick={handleCustomRequest}
                        disabled={!customRequest.trim()}
                        className="w-full"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Apply Custom Request
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {suggestion && !loading && !error && (
          <div className="p-6 border-t bg-muted/30">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  onReject();
                  onClose();
                }}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onAccept(suggestion.suggestions[selectedOption]);
                  onClose();
                }}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Use This Version
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
