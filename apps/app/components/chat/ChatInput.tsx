'use client';

import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading = false,
  placeholder = 'Type a message...',
  className,
  disabled = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (!isLoading && value.trim()) {
      onSubmit();
    }
  };

  return (
    <div className={cn('relative flex items-end gap-2 p-4', className)}>
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className="min-h-[60px] max-h-[200px] resize-none pr-12"
          rows={1}
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute bottom-2 right-2 h-8 w-8"
          disabled={disabled}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
      </div>

      {isLoading && onStop ? (
        <Button
          size="icon"
          variant="destructive"
          onClick={onStop}
          className="h-10 w-10"
        >
          <StopCircle className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={disabled || isLoading || !value.trim()}
          className="h-10 w-10"
        >
          <Send className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
