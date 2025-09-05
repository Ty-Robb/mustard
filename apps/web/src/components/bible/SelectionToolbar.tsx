'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Sparkles,
  X
} from 'lucide-react';

interface SelectionToolbarProps {
  selectedText: string;
  onHighlight: (color: string) => void;
  onGenerateInsights: () => void;
  onClose: () => void;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#fef3c7', label: 'General' },
  { name: 'Blue', value: '#dbeafe', label: 'Promises' },
  { name: 'Green', value: '#d1fae5', label: 'Commands' },
  { name: 'Red', value: '#fee2e2', label: 'Warnings' },
  { name: 'Purple', value: '#e9d5ff', label: 'Prophecy' },
  { name: 'Orange', value: '#fed7aa', label: 'Personal' },
];

export function SelectionToolbar({ 
  selectedText, 
  onHighlight,
  onGenerateInsights,
  onClose 
}: SelectionToolbarProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedText) {
      positionToolbar();
    }
  }, [selectedText]);

  const positionToolbar = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Position toolbar above the selection
    setPosition({
      x: rect.left + (rect.width / 2),
      y: rect.top - 10,
    });
  };

  useEffect(() => {
    // Adjust position to keep toolbar in viewport
    if (toolbarRef.current) {
      const toolbarRect = toolbarRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x - (toolbarRect.width / 2);
      let adjustedY = position.y - toolbarRect.height;

      // Keep within horizontal bounds
      if (adjustedX < 10) adjustedX = 10;
      if (adjustedX + toolbarRect.width > viewportWidth - 10) {
        adjustedX = viewportWidth - toolbarRect.width - 10;
      }

      // If toolbar would go above viewport, show below selection instead
      if (adjustedY < 10) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          adjustedY = rect.bottom + 10;
        }
      }

      toolbarRef.current.style.left = `${adjustedX}px`;
      toolbarRef.current.style.top = `${adjustedY}px`;
    }
  }, [position]);

  if (!selectedText) return null;

  return (
    <Card
      ref={toolbarRef}
      className="fixed z-50 p-2 shadow-lg border bg-background/95 backdrop-blur-sm"
      style={{ position: 'fixed' }}
    >
      <div className="flex items-center gap-1">
        {/* Highlight color options */}
        {HIGHLIGHT_COLORS.map((color) => (
          <Button
            key={color.value}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              onHighlight(color.value);
              onClose();
            }}
            title={color.label}
          >
            <div
              className="w-5 h-5 rounded"
              style={{ backgroundColor: color.value }}
            />
          </Button>
        ))}
        
        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Generate Insights button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onGenerateInsights}
          className="gap-2"
          title="Generate AI Insights"
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-xs">Insights</span>
        </Button>
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 ml-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
