'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface ChatSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  variant?: 'starter' | 'followup';
  suggestions?: string[];
}

const starterSuggestions = [
  'How can I strengthen my prayer life?',
  'What does the Bible say about anxiety?',
  'Help me understand forgiveness',
  'How do I raise godly children?'
];

export function ChatSuggestions({ onSuggestionClick, variant = 'starter', suggestions }: ChatSuggestionsProps) {
  if (variant === 'followup' && suggestions) {
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSuggestionClick(suggestion)}
            className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    );
  }

  // Starter suggestions for empty chat - simplified design
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">Welcome to Mustard Chat</h2>
        <p className="text-muted-foreground">
          💭 What would you like to explore today?
        </p>
      </div>

      {/* Simple 2x2 grid of suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
        {starterSuggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="ghost"
            onClick={() => onSuggestionClick(suggestion)}
            className="h-auto p-4 text-sm text-left justify-start hover:bg-accent/50 border border-border/50"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}
