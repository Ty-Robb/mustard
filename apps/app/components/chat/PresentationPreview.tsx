'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Presentation, ChevronRight } from 'lucide-react';
import { ChatMessage } from '@/types/chat';
import { ParsedPresentation } from '@/lib/utils/presentation-parser';

interface PresentationPreviewProps {
  message: ChatMessage;
  presentation: ParsedPresentation;
  onClick: () => void;
  isActive?: boolean;
  className?: string;
}

export function PresentationPreview({
  message,
  presentation,
  onClick,
  isActive = false,
  className,
}: PresentationPreviewProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isActive && "ring-2 ring-primary",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
            <Presentation className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm truncate">
                {presentation.title || 'Presentation'}
              </h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {presentation.slides.length} slides • {presentation.metadata?.estimatedDuration || 0} min read
            </p>
            <div className="flex flex-wrap gap-1">
              {presentation.slides.slice(0, 3).map((slide, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                >
                  {slide.content.title || `Slide ${index + 1}`}
                </span>
              ))}
              {presentation.slides.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  +{presentation.slides.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
