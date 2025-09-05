'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { ChevronLeft, ChevronRight, Plus, Trash2, Copy } from 'lucide-react';
import { Slide, SlideLayout } from '@/types/presentation';
import { ParsedPresentation } from '@/lib/utils/presentation-parser';

interface PresentationEditorViewProps {
  presentation: ParsedPresentation;
  onChange: (updatedPresentation: ParsedPresentation) => void;
  onSave: () => void;
  isStreaming?: boolean;
}

interface EditableAreaProps {
  content: string;
  onChange: (newContent: string) => void;
  placeholder?: string;
  className?: string;
  type?: 'title' | 'subtitle' | 'body' | 'bullet';
}

// Mini TipTap editor for individual editable areas
function EditableArea({ content, onChange, placeholder, className, type = 'body' }: EditableAreaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const [isHovered, setIsHovered] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Handle click outside to save and close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && editorRef.current && !editorRef.current.contains(event.target as Node)) {
        handleSave(localContent);
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing, localContent]);

  const handleSave = (newContent: string) => {
    // Extract text content from HTML if it's HTML
    if (newContent.includes('<')) {
      const div = document.createElement('div');
      div.innerHTML = newContent;
      const textContent = div.textContent || div.innerText || '';
      setLocalContent(textContent);
      onChange(textContent);
    } else {
      setLocalContent(newContent);
      onChange(newContent);
    }
    setIsEditing(false);
  };

  const getFontSize = () => {
    switch (type) {
      case 'title': return 24;
      case 'subtitle': return 18;
      case 'body': return 16;
      case 'bullet': return 14;
      default: return 16;
    }
  };

  const getTextStyles = () => {
    switch (type) {
      case 'title': return 'text-3xl font-bold';
      case 'subtitle': return 'text-lg text-muted-foreground';
      case 'body': return 'text-base';
      case 'bullet': return 'text-sm';
      default: return 'text-base';
    }
  };

  if (isEditing) {
    return (
      <div ref={editorRef} className={cn("relative", className)}>
        <TipTapEditor
          content={`<p>${localContent}</p>`}
          onContentChange={() => {}}
          onSave={handleSave}
          showToolbar={false}
          editable={true}
          fontSize={getFontSize()}
          lineSpacing={1.5}
          theme="light"
          placeholder={placeholder}
          minHeight="auto"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "cursor-pointer transition-all relative",
        isHovered && "outline outline-1 outline-primary/20",
        getTextStyles(),
        className
      )}
      onClick={() => setIsEditing(true)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {content || (isHovered && placeholder ? <span className="text-muted-foreground/50 italic">{placeholder}</span> : '')}
    </div>
  );
}

export function PresentationEditorView({
  presentation,
  onChange,
  onSave,
  isStreaming = false,
}: PresentationEditorViewProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slides, setSlides] = useState(presentation.slides);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const currentSlide = slides[currentSlideIndex];

  // Update slides when presentation changes
  useEffect(() => {
    setSlides(presentation.slides);
  }, [presentation]);

  // Monitor scroll position for shadow indicators
  useEffect(() => {
    const scrollElement = scrollAreaRef.current;
    if (!scrollElement) return;

    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      setShowTopShadow(scrollTop > 10);
      setShowBottomShadow(scrollTop < scrollHeight - clientHeight - 10);
    };

    checkScroll(); // Initial check
    
    // Also check when slides change
    const observer = new ResizeObserver(checkScroll);
    observer.observe(scrollElement);

    return () => {
      observer.disconnect();
    };
  }, [slides.length]);

  // Auto-scroll to active slide thumbnail
  useEffect(() => {
    const activeSlideRef = slideRefs.current[currentSlideIndex];
    if (activeSlideRef && scrollAreaRef.current) {
      activeSlideRef.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentSlideIndex]);

  // Navigation
  const goToSlide = useCallback((index: number) => {
    setCurrentSlideIndex(index);
  }, []);

  // Update slide content
  const updateSlideContent = useCallback((field: string, value: string) => {
    const updatedSlides = [...slides];
    const slide = updatedSlides[currentSlideIndex];
    
    if (field === 'bulletPoints') {
      // Handle bullet points specially
      const bulletIndex = parseInt(field.split('-')[1]);
      if (!isNaN(bulletIndex) && slide.content.bulletPoints) {
        slide.content.bulletPoints[bulletIndex] = value;
      }
    } else {
      // Update other fields
      (slide.content as any)[field] = value;
    }
    
    setSlides(updatedSlides);
    onChange({
      ...presentation,
      slides: updatedSlides,
    });
  }, [currentSlideIndex, slides, presentation, onChange]);

  // Add new slide
  const addSlide = useCallback(() => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      order: slides.length,
      layout: 'content',
      content: {
        title: 'New Slide',
        bulletPoints: ['Point 1', 'Point 2', 'Point 3'],
      },
      speakerNotes: {
        script: '',
        deliveryCues: [],
        timing: '',
        transitions: { in: '', out: '' },
        engagement: [],
        emphasis: []
      },
      visualElements: []
    };
    
    const updatedSlides = [...slides, newSlide];
    setSlides(updatedSlides);
    onChange({
      ...presentation,
      slides: updatedSlides,
    });
    setCurrentSlideIndex(updatedSlides.length - 1);
  }, [slides, presentation, onChange]);

  // Delete current slide
  const deleteSlide = useCallback(() => {
    if (slides.length <= 1) return; // Don't delete the last slide
    
    const updatedSlides = slides.filter((_, index) => index !== currentSlideIndex);
    setSlides(updatedSlides);
    onChange({
      ...presentation,
      slides: updatedSlides,
    });
    
    // Adjust current slide index
    if (currentSlideIndex >= updatedSlides.length) {
      setCurrentSlideIndex(updatedSlides.length - 1);
    }
  }, [currentSlideIndex, slides, presentation, onChange]);

  // Duplicate current slide
  const duplicateSlide = useCallback(() => {
    const slideToClone = slides[currentSlideIndex];
    const newSlide: Slide = {
      ...slideToClone,
      id: `slide-${Date.now()}`,
      order: currentSlideIndex + 1,
      content: { ...slideToClone.content },
    };
    
    const updatedSlides = [
      ...slides.slice(0, currentSlideIndex + 1),
      newSlide,
      ...slides.slice(currentSlideIndex + 1),
    ];
    
    // Update order for all slides
    updatedSlides.forEach((slide, index) => {
      slide.order = index;
    });
    
    setSlides(updatedSlides);
    onChange({
      ...presentation,
      slides: updatedSlides,
    });
    setCurrentSlideIndex(currentSlideIndex + 1);
  }, [currentSlideIndex, slides, presentation, onChange]);

  // Render slide content based on layout
  const renderSlideContent = (slide: Slide) => {
    const { content, layout } = slide;

    switch (layout) {
      case 'title':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <EditableArea
              content={content.title || ''}
              onChange={(value) => updateSlideContent('title', value)}
              placeholder="Click to add title"
              type="title"
              className="text-3xl font-bold"
            />
            <EditableArea
              content={content.subtitle || ''}
              onChange={(value) => updateSlideContent('subtitle', value)}
              placeholder="Click to add subtitle"
              type="subtitle"
              className="text-lg text-muted-foreground"
            />
          </div>
        );

      case 'content':
        return (
          <div className="h-full space-y-4">
            <EditableArea
              content={content.title || ''}
              onChange={(value) => updateSlideContent('title', value)}
              placeholder="Click to add title"
              type="title"
              className="text-2xl font-bold"
            />
            {content.bulletPoints && content.bulletPoints.length > 0 && (
              <ul className="space-y-2">
                {content.bulletPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <EditableArea
                      content={point}
                      onChange={(value) => {
                        const updatedPoints = [...content.bulletPoints!];
                        updatedPoints[index] = value;
                        const updatedSlides = [...slides];
                        updatedSlides[currentSlideIndex].content.bulletPoints = updatedPoints;
                        setSlides(updatedSlides);
                        onChange({
                          ...presentation,
                          slides: updatedSlides,
                        });
                      }}
                      placeholder={`Point ${index + 1}`}
                      type="bullet"
                      className="flex-1"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      case 'quote':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <blockquote className="text-center max-w-3xl">
              <EditableArea
                content={content.body || ''}
                onChange={(value) => updateSlideContent('body', value)}
                placeholder="Click to add quote"
                type="body"
                className="text-xl italic"
              />
            </blockquote>
            {content.subtitle && (
              <EditableArea
                content={content.subtitle}
                onChange={(value) => updateSlideContent('subtitle', value)}
                placeholder="Attribution"
                type="subtitle"
                className="mt-4 text-muted-foreground"
              />
            )}
          </div>
        );

      default:
        return (
          <div className="h-full space-y-4">
            <EditableArea
              content={content.title || ''}
              onChange={(value) => updateSlideContent('title', value)}
              placeholder="Click to add title"
              type="title"
              className="text-2xl font-bold"
            />
            <EditableArea
              content={content.body || ''}
              onChange={(value) => updateSlideContent('body', value)}
              placeholder="Click to add content"
              type="body"
              className="text-base"
            />
          </div>
        );
    }
  };

  return (
    <div className="flex h-full max-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar with thumbnails */}
      <div className="w-64 border-r bg-muted/10 flex flex-col h-full overflow-hidden">
        {/* Fixed header */}
        <div className="p-4 border-b flex-shrink-0 bg-muted/10">
          <h3 className="font-semibold text-sm">Slides</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {slides.length} slides
          </p>
        </div>
        
        {/* Scrollable slides list - constrained height */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {/* Top shadow indicator when scrolled */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-muted/20 to-transparent z-10 pointer-events-none transition-opacity duration-200",
            showTopShadow ? "opacity-100" : "opacity-0"
          )} />
          
          {/* Native scrollable container */}
          <div 
            className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40"
            ref={scrollAreaRef}
            onScroll={(e) => {
              const element = e.currentTarget;
              const { scrollTop, scrollHeight, clientHeight } = element;
              setShowTopShadow(scrollTop > 10);
              setShowBottomShadow(scrollTop < scrollHeight - clientHeight - 10);
            }}
          >
            <div className="p-4 space-y-2">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  ref={(el) => {
                    slideRefs.current[index] = el;
                  }}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "relative cursor-pointer rounded-lg overflow-hidden transition-all",
                    "border-2 hover:shadow-md",
                    currentSlideIndex === index
                      ? "border-primary shadow-md"
                      : "border-muted-foreground/20 hover:border-muted-foreground/40"
                  )}
                >
                  {/* Mini slide preview */}
                  <div className="aspect-[16/9] bg-background p-3 text-[10px]">
                    <div className="h-full overflow-hidden">
                      {slide.layout === 'title' && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="font-semibold line-clamp-2">{slide.content.title}</div>
                          {slide.content.subtitle && (
                            <div className="text-muted-foreground line-clamp-1 mt-1">
                              {slide.content.subtitle}
                            </div>
                          )}
                        </div>
                      )}
                      {slide.layout !== 'title' && (
                        <div>
                          <div className="font-semibold line-clamp-1 mb-1">{slide.content.title}</div>
                          {slide.content.bulletPoints && (
                            <div className="space-y-0.5">
                              {slide.content.bulletPoints.slice(0, 3).map((point, i) => (
                                <div key={i} className="line-clamp-1">• {point}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Slide number */}
                  <div className="absolute bottom-1 right-1 bg-background/80 rounded px-1 text-[10px] font-medium">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Bottom shadow indicator when more content below */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-muted/20 to-transparent z-10 pointer-events-none transition-opacity duration-200",
            showBottomShadow ? "opacity-100" : "opacity-0"
          )} />
        </div>
        
        {/* Fixed slide actions at bottom */}
        <div className="p-4 border-t space-y-2 flex-shrink-0 bg-muted/10">
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={addSlide}
            disabled={isStreaming}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Slide
          </Button>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={duplicateSlide}
              disabled={isStreaming}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={deleteSlide}
              disabled={isStreaming || slides.length <= 1}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main slide editor */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Scrollable slide content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-background rounded-lg shadow-lg border p-8 min-h-[500px]">
                {renderSlideContent(currentSlide)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Fixed navigation at bottom */}
        <div className="border-t p-4 bg-background flex-shrink-0">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToSlide(Math.max(0, currentSlideIndex - 1))}
              disabled={currentSlideIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {currentSlideIndex + 1} / {slides.length}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToSlide(Math.min(slides.length - 1, currentSlideIndex + 1))}
              disabled={currentSlideIndex === slides.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
