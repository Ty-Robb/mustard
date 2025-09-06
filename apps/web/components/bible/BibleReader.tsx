'use client';

import { useEffect, useState, useCallback } from 'react';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { BibleHighlightExtension } from './extensions/BibleHighlightExtension';
import { AIInsightsExtension } from './extensions/AIInsightsExtension';
import { BibleContextMenu } from './BibleContextMenu';
import { SelectionToolbar } from './SelectionToolbar';
import { BibleVerseParser } from './modules/BibleVerseParser';
import { useAuth } from '@/hooks/useAuth';
import { usePanel } from '@/contexts/PanelContext';
import type { BibleChapter } from '@/types/bible';
import type { Highlight } from '@/types/highlights';

interface BibleReaderProps {
  chapter: BibleChapter;
  bookName: string;
  highlights?: Highlight[];
  onHighlight: (verseId: string, color: string, selectedText: string) => void;
  onAIInsights?: (text: string, context?: string, reference?: string, actionType?: string) => void;
  fontSize?: number;
  lineSpacing?: number;
  theme?: 'light' | 'dark' | 'sepia';
  focusMode?: boolean;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#fef3c7', label: 'General' },
  { name: 'Blue', value: '#dbeafe', label: 'Promises' },
  { name: 'Green', value: '#d1fae5', label: 'Commands' },
  { name: 'Red', value: '#fee2e2', label: 'Warnings' },
  { name: 'Purple', value: '#e9d5ff', label: 'Prophecy' },
  { name: 'Orange', value: '#fed7aa', label: 'Personal' },
];

export function BibleReader({ 
  chapter, 
  bookName, 
  highlights = [], 
  onHighlight, 
  onAIInsights, 
  fontSize = 18, 
  lineSpacing = 1.75, 
  theme = 'light', 
  focusMode = false,
}: BibleReaderProps) {
  const { currentUser } = useAuth();
  const { showBothPanels } = usePanel();
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; selection: any } | null>(null);
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [editor, setEditor] = useState<any>(null);
  const [formattedContent, setFormattedContent] = useState('');

  // Format chapter content using BibleVerseParser
  useEffect(() => {
    if (chapter) {
      const content = BibleVerseParser.parseChapterContent(chapter, focusMode);
      setFormattedContent(content);
    }
  }, [chapter, focusMode]);

  // Apply highlights after editor is ready and content is set
  useEffect(() => {
    if (editor && highlights.length > 0 && formattedContent) {
      // Wait for content to be rendered
      setTimeout(() => {
        applyHighlights();
      }, 200);
    }
  }, [editor, highlights, formattedContent]);

  const applyHighlights = () => {
    if (!editor) return;

    highlights.forEach((highlight) => {
      const searchText = BibleVerseParser.normalizeText(highlight.text);
      const color = highlight.color || '#fef3c7';
      
      // Get the current document content
      const doc = editor.state.doc;
      const tr = editor.state.tr;
      let found = false;
      
      // Search for the text in the document
      doc.descendants((node: any, pos: number) => {
        if (node.isText && !found) {
          const nodeText = BibleVerseParser.normalizeText(node.text);
          const index = nodeText.toLowerCase().indexOf(searchText.toLowerCase());
          
          if (index !== -1) {
            const from = pos + index;
            const to = from + highlight.text.length;
            tr.addMark(from, to, editor.schema.marks.highlight.create({ color }));
            found = true;
          }
        }
      });
      
      if (found) {
        editor.view.dispatch(tr);
      }
    });
  };

  const handleHighlight = (color?: string) => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    if (from === to) return; // No selection
    
    const highlightColor = color || selectedColor;
    const selectedText = editor.state.doc.textBetween(from, to);
    
    // Apply highlight
    editor.chain()
      .focus()
      .toggleHighlight({ color: highlightColor })
      .run();
    
    // Get verse ID
    const domAtPos = editor.view.domAtPos(from);
    let verseId = null;
    
    if (domAtPos && domAtPos.node) {
      const element = domAtPos.node.nodeType === Node.TEXT_NODE 
        ? domAtPos.node.parentElement 
        : domAtPos.node as HTMLElement;
      
      verseId = BibleVerseParser.extractVerseId(element);
    }
    
    if (!verseId) {
      // Fallback: calculate verse from position
      const beforeText = editor.state.doc.textBetween(0, from);
      const verseMatches = [...beforeText.matchAll(/(\d+)\s/g)];
      
      if (verseMatches.length > 0) {
        const lastVerseNum = verseMatches[verseMatches.length - 1][1];
        verseId = `${chapter.bookId}.${chapter.number}.${lastVerseNum}`;
      } else {
        verseId = `${chapter.bookId}.${chapter.number}.1`;
      }
    }
    
    onHighlight(verseId, highlightColor, selectedText);
  };

  const handleContextMenuHighlight = (color: string) => {
    if (!editor || !contextMenu) return;
    
    const { from, to, verseId } = contextMenu.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    
    editor.chain()
      .focus()
      .setTextSelection({ from, to })
      .toggleHighlight({ color })
      .run();
    
    onHighlight(verseId, color, selectedText);
  };

  const handleContextMenuAIInsights = () => {
    if (!contextMenu || !onAIInsights) return;
    
    const { text, element } = contextMenu.selection;
    onAIInsights(text, element.textContent || undefined);
    showBothPanels();
  };

  const handleClearHighlight = () => {
    if (!editor || !contextMenu) return;
    
    const { from, to } = contextMenu.selection;
    editor.chain()
      .focus()
      .setTextSelection({ from, to })
      .unsetHighlight()
      .run();
  };

  const handleEditorReady = (editorInstance: any) => {
    setEditor(editorInstance);
    
    // Set up selection handler
    editorInstance.on('selectionUpdate', ({ editor }: any) => {
      const { from, to } = editor.state.selection;
      const isEmpty = from === to;
      
      if (!isEmpty) {
        const text = editor.state.doc.textBetween(from, to);
        setSelectedText(text);
        setShowSelectionToolbar(true);
      } else {
        setShowSelectionToolbar(false);
        setSelectedText('');
      }
    });
  };

  // Bible-specific extensions
  const bibleExtensions = [
    BibleHighlightExtension.configure({
      onHighlight: (verseId: string, color: string) => {
        onHighlight(verseId, color, '');
      },
      onContextMenu: (event: MouseEvent, selection: any) => {
        setContextMenu({ x: event.clientX, y: event.clientY, selection });
      },
    }),
    AIInsightsExtension.configure({
      onTrigger: (text: string, context?: string) => {
        if (onAIInsights) {
          onAIInsights(text, context);
          showBothPanels();
        }
      },
    }),
  ];

  return (
    <div className="relative">
      {/* Selection Toolbar */}
      {showSelectionToolbar && selectedText && (
        <SelectionToolbar
          selectedText={selectedText}
          onHighlight={(color) => {
            handleHighlight(color);
            setShowSelectionToolbar(false);
          }}
          onGenerateInsights={() => {
            if (onAIInsights) {
              const { from } = editor.state.selection;
              const domNode = editor.view.domAtPos(from).node as HTMLElement;
              const verseElement = domNode.closest ? domNode.closest('[data-verse-id]') : 
                                domNode.parentElement?.closest('[data-verse-id]');
              const verseId = verseElement?.getAttribute('data-verse-id') || '';
              const reference = `${bookName} ${chapter.number}:${verseId.split('.').pop()}`;
              const verseContext = verseElement?.textContent || undefined;
              
              onAIInsights(selectedText, verseContext, reference, '');
              showBothPanels();
              setShowSelectionToolbar(false);
            }
          }}
          onClose={() => setShowSelectionToolbar(false)}
        />
      )}

      {/* Help text */}
      <div className="mb-4 text-sm text-muted-foreground text-center">
        Select text to highlight • Right-click for more options • <kbd className="px-1 py-0.5 text-xs border rounded">Cmd+U</kbd> for AI insights
      </div>

      {/* TipTap Editor */}
      <TipTapEditor
        content={formattedContent}
        showToolbar={false}
        editable={false}
        fontSize={fontSize}
        lineSpacing={lineSpacing}
        theme={theme}
        extensions={bibleExtensions}
        onEditorReady={handleEditorReady}
        className="bible-reader"
      />

      {/* Context Menu */}
      {contextMenu && (
        <BibleContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onHighlight={handleContextMenuHighlight}
          onAIInsights={handleContextMenuAIInsights}
          onClearHighlight={contextMenu.selection.hasHighlight ? handleClearHighlight : undefined}
          hasHighlight={contextMenu.selection.hasHighlight}
        />
      )}

      {/* Bible-specific styles */}
      <style jsx global>{`
        .bible-reader .ProseMirror .bible-content p {
          margin-bottom: 0.75rem !important;
          line-height: ${lineSpacing} !important;
          display: block !important;
        }
        
        .bible-reader .ProseMirror .bible-content sup {
          font-size: 0.75rem !important;
          font-weight: 500 !important;
          opacity: 0.6;
          margin-right: 0.75rem !important;
          vertical-align: super !important;
        }
        
        .bible-reader .ProseMirror p + p {
          margin-top: 0 !important;
        }
      `}</style>
    </div>
  );
}
