'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Download,
  Edit3,
  Share2,
  Presentation as PresentationIcon,
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Slide, SlideLayout } from '@/types/presentation';
import { ChatMessage } from '@/types/chat';

interface PresentationNodeProps {
  message: ChatMessage;
  slides: Slide[];
  title?: string;
  onOpenInEditor?: (message: ChatMessage) => void;
  className?: string;
}

export function PresentationNode({
  message,
  slides,
  title = 'Presentation',
  onOpenInEditor,
  className,
}: PresentationNodeProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const currentSlide = slides[currentSlideIndex];
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Navigation handlers
  const goToPrevious = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlideIndex(index);
  }, []);

  // Auto-scroll to active slide
  useEffect(() => {
    const activeSlideRef = slideRefs.current[currentSlideIndex];
    if (activeSlideRef && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const slideRect = activeSlideRef.getBoundingClientRect();
        
        // Calculate the scroll position to center the active slide
        const scrollLeft = activeSlideRef.offsetLeft - (containerRect.width / 2) + (slideRect.width / 2);
        
        // Smooth scroll to the active slide
        scrollContainer.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [currentSlideIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key >= '1' && e.key <= '9') {
        const slideIndex = parseInt(e.key) - 1;
        if (slideIndex < slides.length) {
          goToSlide(slideIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext, goToSlide, slides.length, isFullscreen]);

  // Handle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle export (placeholder)
  const handleExport = () => {
    console.log('Export presentation');
    // TODO: Implement export functionality
  };

  // Handle share (placeholder)
  const handleShare = () => {
    console.log('Share presentation');
    // TODO: Implement share functionality
  };

  // Render slide content based on layout
  const renderSlideContent = (slide: Slide) => {
    const { content, layout } = slide;

    switch (layout) {
      case 'title':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {content.title && (
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{content.title}</h1>
            )}
            {content.subtitle && (
              <h2 className="text-lg md:text-xl text-muted-foreground">{content.subtitle}</h2>
            )}
          </div>
        );

      case 'two-column':
        return (
          <div className="h-full">
            {content.title && (
              <h2 className="text-xl md:text-2xl font-bold mb-4">{content.title}</h2>
            )}
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {content.columns?.map((col, index) => (
                <div key={index} className="prose prose-sm dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: col.content }} />
                </div>
              ))}
            </div>
          </div>
        );

      case 'quote':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <blockquote className="text-xl md:text-2xl italic text-center max-w-3xl">
              "{content.body || ''}"
            </blockquote>
            {content.subtitle && (
              <p className="mt-4 text-base md:text-lg text-muted-foreground">
                — {content.subtitle}
              </p>
            )}
          </div>
        );

      case 'full-image':
        return (
          <div className="h-full">
            {content.title && (
              <h2 className="text-xl md:text-2xl font-bold mb-4">{content.title}</h2>
            )}
            {content.images && content.images.length > 0 && (
              <div className="flex items-center justify-center h-full">
                <img
                  src={content.images[0].url}
                  alt={content.images[0].alt || content.title || 'Slide image'}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            {content.body && (
              <p className="mt-4 text-center text-base">{content.body}</p>
            )}
          </div>
        );

      case 'content':
        return (
          <div className="h-full overflow-y-auto">
            {content.title && (
              <h2 className="text-xl md:text-2xl font-bold mb-4">{content.title}</h2>
            )}
            {content.body && (
              <div className="prose prose-base dark:prose-invert max-w-none mb-4" 
                   dangerouslySetInnerHTML={{ __html: content.body }} />
            )}
            {content.bulletPoints && content.bulletPoints.length > 0 && (
              <ul className="list-disc list-inside space-y-2">
                {content.bulletPoints.map((point, index) => (
                  <li key={index} className="text-base">
                    <span dangerouslySetInnerHTML={{ 
                      __html: point
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em>$1</em>')
                        .replace(/`(.+?)`/g, '<code>$1</code>')
                    }} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      default:
        // Standard content layout
        return (
          <div className="h-full overflow-y-auto">
            {content.title && (
              <h2 className="text-xl md:text-2xl font-bold mb-4">{content.title}</h2>
            )}
            {content.body && (
              <p className="text-base mb-4 whitespace-pre-wrap">{content.body}</p>
            )}
            {content.bulletPoints && content.bulletPoints.length > 0 && (
              <ul className="list-disc list-inside space-y-2">
                {content.bulletPoints.map((point, index) => (
                  <li key={index} className="text-base">
                    <span dangerouslySetInnerHTML={{ 
                      __html: point
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em>$1</em>')
                        .replace(/`(.+?)`/g, '<code>$1</code>')
                    }} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
    }
  };

  // Get slide title for dropdown
  const getSlideTitle = (slide: Slide, index: number) => {
    if (slide.content.title) {
      return slide.content.title;
    }
    switch (slide.layout) {
      case 'title':
        return 'Title Slide';
      case 'quote':
        return 'Quote';
      default:
        return `Slide ${index + 1}`;
    }
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Fullscreen header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(false)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Fullscreen content */}
        <div className="flex-1 p-8 overflow-hidden">
          <div className="h-full max-w-6xl mx-auto">
            {renderSlideContent(currentSlide)}
          </div>
        </div>

        {/* Fullscreen navigation */}
        <div className="flex items-center justify-center gap-4 p-4 border-t">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            disabled={currentSlideIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[120px]">
                {currentSlideIndex + 1} / {slides.length}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[400px] overflow-y-auto">
              {slides.map((slide, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    'cursor-pointer',
                    currentSlideIndex === index && 'bg-accent'
                  )}
                >
                  <span className="mr-2 text-muted-foreground">
                    {index + 1}.
                  </span>
                  {getSlideTitle(slide, index)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            disabled={currentSlideIndex === slides.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden border-2 border-dotted border-red-500', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="absolute top-0 left-0 bg-red-500 text-white text-xs px-1 rounded-br z-10">
          PresentationNode
        </div>
        <div className="flex items-center gap-2">
          <PresentationIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {onOpenInEditor && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onOpenInEditor(message)}
              title="Edit presentation"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleExport}
            title="Export presentation"
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleShare}
            title="Share presentation"
          >
            <Share2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleFullscreen}
            title="Fullscreen"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Slide viewer */}
      <CardContent className="p-0">
        {/* Slide content area */}
        <div className="relative bg-gradient-to-br from-muted/20 to-muted/10 aspect-[16/9] overflow-hidden border-b border-2 border-dotted border-blue-500">
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-bl z-10">
            Slide {currentSlideIndex + 1}
          </div>
          <div className="absolute inset-0 p-6 md:p-8 overflow-auto">
            {renderSlideContent(currentSlide)}
          </div>
        </div>

        {/* Visual slide navigation */}
        <div className="p-4 bg-background">
          <ScrollArea className="w-full whitespace-nowrap" ref={scrollAreaRef}>
            <div className="flex gap-2 pb-2 w-max">
              {slides.map((slide, index) => (
                <button
                  key={index}
                  ref={(el) => {
                    slideRefs.current[index] = el;
                  }}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    'relative flex-shrink-0 w-32 h-20 rounded-md overflow-hidden transition-all',
                    'border-2 hover:shadow-md',
                    currentSlideIndex === index
                      ? 'border-green-500 shadow-md'
                      : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                  )}
                >
                  {/* Mini slide preview */}
                  <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-muted/10 p-2 text-[8px] leading-tight overflow-hidden">
                    {slide.layout === 'title' && (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        {slide.content.title && (
                          <div className="font-semibold line-clamp-2">{slide.content.title}</div>
                        )}
                        {slide.content.subtitle && (
                          <div className="text-muted-foreground line-clamp-1 mt-0.5">
                            {slide.content.subtitle}
                          </div>
                        )}
                      </div>
                    )}
                    {slide.layout === 'quote' && (
                      <div className="flex items-center justify-center h-full text-center italic">
                        <div className="line-clamp-3">"{slide.content.body}"</div>
                      </div>
                    )}
                    {slide.layout !== 'title' && slide.layout !== 'quote' && (
                      <div>
                        {slide.content.title && (
                          <div className="font-semibold line-clamp-1 mb-1">{slide.content.title}</div>
                        )}
                        {slide.content.bulletPoints && slide.content.bulletPoints.length > 0 ? (
                          <div className="space-y-0.5">
                            {slide.content.bulletPoints.slice(0, 3).map((point, i) => (
                              <div key={i} className="line-clamp-1">• {point}</div>
                            ))}
                          </div>
                        ) : slide.content.body ? (
                          <div className="line-clamp-3">{slide.content.body}</div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  {/* Slide number */}
                  <div className="absolute bottom-1 right-1 bg-background/80 rounded px-1 text-[10px] font-medium">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          
          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              disabled={currentSlideIndex === 0}
              className="h-8"
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              Previous
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {currentSlideIndex + 1} / {slides.length}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={currentSlideIndex === slides.length - 1}
              className="h-8"
            >
              Next
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
