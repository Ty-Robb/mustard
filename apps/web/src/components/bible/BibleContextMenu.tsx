'use client';

import { useEffect, useState } from 'react';
import { Palette, Sparkles, X } from 'lucide-react';

interface BibleContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onHighlight: (color: string) => void;
  onAIInsights: () => void;
  onClearHighlight?: () => void;
  hasHighlight?: boolean;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#fef3c7', label: 'General' },
  { name: 'Blue', value: '#dbeafe', label: 'Promises' },
  { name: 'Green', value: '#d1fae5', label: 'Commands' },
  { name: 'Red', value: '#fee2e2', label: 'Warnings' },
  { name: 'Purple', value: '#e9d5ff', label: 'Prophecy' },
  { name: 'Orange', value: '#fed7aa', label: 'Personal' },
];

export function BibleContextMenu({
  x,
  y,
  onClose,
  onHighlight,
  onAIInsights,
  onClearHighlight,
  hasHighlight = false,
}: BibleContextMenuProps) {
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    // Adjust position to ensure menu stays within viewport
    const menuWidth = 200;
    const menuHeight = hasHighlight ? 320 : 280;
    const padding = 10;

    let adjustedX = x;
    let adjustedY = y;

    // Check right boundary
    if (x + menuWidth > window.innerWidth - padding) {
      adjustedX = window.innerWidth - menuWidth - padding;
    }

    // Check bottom boundary
    if (y + menuHeight > window.innerHeight - padding) {
      adjustedY = window.innerHeight - menuHeight - padding;
    }

    // Check left boundary
    if (adjustedX < padding) {
      adjustedX = padding;
    }

    // Check top boundary
    if (adjustedY < padding) {
      adjustedY = padding;
    }

    setPosition({ x: adjustedX, y: adjustedY });
  }, [x, y, hasHighlight]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.bible-context-menu')) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="bible-context-menu fixed z-50 bg-popover text-popover-foreground rounded-md shadow-lg border p-1 min-w-[200px]"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {/* Highlight Colors Section */}
      <div className="p-2">
        <div className="flex items-center gap-2 text-sm font-medium mb-2">
          <Palette className="h-4 w-4" />
          <span>Highlight</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => {
                onHighlight(color.value);
                onClose();
              }}
              className="group relative p-2 rounded hover:bg-accent transition-colors"
              title={color.label}
            >
              <div
                className="w-8 h-8 rounded border-2 border-border group-hover:border-foreground transition-colors"
                style={{ backgroundColor: color.value }}
              />
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-popover px-1 rounded">
                {color.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t my-1" />

      {/* AI Insights */}
      <button
        onClick={() => {
          onAIInsights();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        <span>Get AI Insights</span>
        <kbd className="ml-auto text-xs bg-muted px-1 py-0.5 rounded">⌘U</kbd>
      </button>

      {/* Clear Highlight (if applicable) */}
      {hasHighlight && onClearHighlight && (
        <>
          <div className="border-t my-1" />
          <button
            onClick={() => {
              onClearHighlight();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent transition-colors text-destructive"
          >
            <X className="h-4 w-4" />
            <span>Clear Highlight</span>
          </button>
        </>
      )}
    </div>
  );
}
