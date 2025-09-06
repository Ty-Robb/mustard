'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Sparkles,
  X,
  Bold,
  Italic,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  Quote,
  RefreshCw,
  Lightbulb,
  Maximize,
  Minimize,
  Edit,
  ChevronDown,
  Undo,
  Redo,
  BarChart3,
  Table,
  LineChart,
  PieChart,
  TrendingUp,
  Image
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface EditorSelectionToolbarProps {
  selectedText: string;
  onAIAction: (action: AIAction, text: string) => void;
  onVisualizationAction?: (action: VisualizationAction, text: string) => void;
  onImageGenerate?: (text: string) => void;
  onClose: () => void;
  editor?: any; // TipTap editor instance
}

export type AIAction = 
  | 'enhance'
  | 'expand'
  | 'summarize'
  | 'rephrase'
  | 'ideas';

export type VisualizationAction = 
  | 'auto'
  | 'chart'
  | 'table'
  | 'timeline'
  | 'comparison';

const AI_ACTIONS = [
  { 
    action: 'enhance' as AIAction, 
    icon: Sparkles, 
    label: 'Enhance',
    description: 'Improve clarity & grammar'
  },
  { 
    action: 'expand' as AIAction, 
    icon: Maximize, 
    label: 'Expand',
    description: 'Add more detail'
  },
  { 
    action: 'summarize' as AIAction, 
    icon: Minimize, 
    label: 'Summarize',
    description: 'Make it concise'
  },
  { 
    action: 'rephrase' as AIAction, 
    icon: RefreshCw, 
    label: 'Rephrase',
    description: 'Different tone/style'
  },
  { 
    action: 'ideas' as AIAction, 
    icon: Lightbulb, 
    label: 'Ideas',
    description: 'Suggest continuations'
  },
];

const VISUALIZATION_ACTIONS = [
  { 
    action: 'auto' as VisualizationAction, 
    icon: Sparkles, 
    label: 'Auto-detect',
    description: 'AI chooses best visualization'
  },
  { 
    action: 'chart' as VisualizationAction, 
    icon: LineChart, 
    label: 'Chart',
    description: 'Line, bar, or pie chart'
  },
  { 
    action: 'table' as VisualizationAction, 
    icon: Table, 
    label: 'Table',
    description: 'Structured data table'
  },
  { 
    action: 'timeline' as VisualizationAction, 
    icon: TrendingUp, 
    label: 'Timeline',
    description: 'Historical events'
  },
  { 
    action: 'comparison' as VisualizationAction, 
    icon: BarChart3, 
    label: 'Comparison',
    description: 'Compare multiple items'
  },
];

export function EditorSelectionToolbar({ 
  selectedText, 
  onAIAction,
  onVisualizationAction,
  onImageGenerate,
  onClose,
  editor
}: EditorSelectionToolbarProps) {
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
        {/* Edit dropdown for formatting */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <Edit className="h-4 w-4" />
              <span className="text-xs">Edit</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {/* Text formatting */}
            <DropdownMenuItem
              onClick={() => editor?.chain().focus().toggleBold().run()}
              disabled={!editor}
              className="gap-2"
            >
              <Bold className="h-4 w-4" />
              <span>Bold</span>
              <span className="ml-auto text-xs text-muted-foreground">⌘B</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              disabled={!editor}
              className="gap-2"
            >
              <Italic className="h-4 w-4" />
              <span>Italic</span>
              <span className="ml-auto text-xs text-muted-foreground">⌘I</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor?.chain().focus().toggleHighlight().run()}
              disabled={!editor}
              className="gap-2"
            >
              <Highlighter className="h-4 w-4" />
              <span>Highlight</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Headings */}
            <DropdownMenuItem
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              disabled={!editor}
              className="gap-2"
            >
              <Heading1 className="h-4 w-4" />
              <span>Heading 1</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              disabled={!editor}
              className="gap-2"
            >
              <Heading2 className="h-4 w-4" />
              <span>Heading 2</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              disabled={!editor}
              className="gap-2"
            >
              <Heading3 className="h-4 w-4" />
              <span>Heading 3</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor?.chain().focus().setParagraph().run()}
              disabled={!editor}
              className="gap-2"
            >
              <Type className="h-4 w-4" />
              <span>Paragraph</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Lists */}
            <DropdownMenuItem
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              disabled={!editor}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              <span>Bullet List</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              disabled={!editor}
              className="gap-2"
            >
              <ListOrdered className="h-4 w-4" />
              <span>Numbered List</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              disabled={!editor}
              className="gap-2"
            >
              <Quote className="h-4 w-4" />
              <span>Quote</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* History */}
            <DropdownMenuItem
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              className="gap-2"
            >
              <Undo className="h-4 w-4" />
              <span>Undo</span>
              <span className="ml-auto text-xs text-muted-foreground">⌘Z</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
              className="gap-2"
            >
              <Redo className="h-4 w-4" />
              <span>Redo</span>
              <span className="ml-auto text-xs text-muted-foreground">⌘⇧Z</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Enhance dropdown for AI actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs">Enhance</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {AI_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <DropdownMenuItem
                  key={action.action}
                  onClick={() => onAIAction(action.action, selectedText)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Visualizations dropdown */}
        {onVisualizationAction && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs">Visualize</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {VISUALIZATION_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <DropdownMenuItem
                      key={action.action}
                      onClick={() => onVisualizationAction(action.action, selectedText)}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{action.label}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {/* Image generation button */}
        {onImageGenerate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onImageGenerate(selectedText)}
            className="gap-1"
          >
            <Image className="h-4 w-4" />
            <span className="text-xs">Generate Image</span>
          </Button>
        )}
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
