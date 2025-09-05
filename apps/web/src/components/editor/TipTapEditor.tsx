'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapHighlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Placeholder } from '@tiptap/extension-placeholder';
import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Highlighter,
  Save,
  FileText,
  Download,
  Copy,
  BarChart3,
  Table
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ChartNode } from './extensions/ChartNode';
import { DataTableNode } from './extensions/DataTableNode';
import { ImageNode } from './extensions/ImageNode';

export interface TipTapEditorProps {
  content?: string;
  onSave?: (content: string) => void;
  onContentChange?: (content: string) => void;
  showToolbar?: boolean;
  editable?: boolean;
  documentTitle?: string;
  fontSize?: number;
  lineSpacing?: number;
  theme?: 'light' | 'dark' | 'sepia';
  placeholder?: string;
  className?: string;
  extensions?: any[];
  onEditorReady?: (editor: any) => void;
  minHeight?: string;
}

export function TipTapEditor({ 
  content = '',
  onSave,
  onContentChange,
  showToolbar = true,
  editable = true,
  documentTitle,
  fontSize = 18, 
  lineSpacing = 1.75, 
  theme = 'light',
  placeholder = 'Start writing...',
  className,
  extensions = [],
  onEditorReady,
  minHeight = '400px'
}: TipTapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      TiptapHighlight.configure({ multicolor: true }),
      Placeholder.configure({
        placeholder,
      }),
      ChartNode,
      DataTableNode,
      ImageNode,
      ...extensions
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      if (onContentChange) {
        onContentChange(editor.getHTML());
      }
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleSave = useCallback(() => {
    if (editor && onSave) {
      onSave(editor.getHTML());
    }
  }, [editor, onSave]);

  const handleExport = useCallback((format: 'html' | 'markdown' | 'text') => {
    if (!editor) return;
    
    let content = '';
    let filename = documentTitle || 'document';
    let mimeType = 'text/plain';
    
    switch (format) {
      case 'html':
        content = editor.getHTML();
        filename += '.html';
        mimeType = 'text/html';
        break;
      case 'markdown':
        // Simple markdown conversion - could be enhanced
        content = editor.getText();
        filename += '.md';
        mimeType = 'text/markdown';
        break;
      case 'text':
        content = editor.getText();
        filename += '.txt';
        mimeType = 'text/plain';
        break;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [editor, documentTitle]);

  const handleCopy = useCallback(() => {
    if (editor) {
      navigator.clipboard.writeText(editor.getHTML());
    }
  }, [editor]);

  // Apply theme styles
  useEffect(() => {
    if (editor) {
      const style = document.createElement('style');
      style.textContent = `
        .ProseMirror {
          font-size: ${fontSize}px;
          line-height: ${lineSpacing};
        }
        
        /* Theme-specific styles */
        .tiptap-editor-light {
          background-color: white;
          color: #1a1a1a;
        }
        
        .tiptap-editor-dark {
          background-color: #1a1a1a;
          color: #e5e5e5;
        }
        
        .tiptap-editor-sepia {
          background-color: #f4f1ea;
          color: #5c4b37;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [editor, fontSize, lineSpacing]);

  return (
    <div className={cn(`tiptap-editor-${theme} rounded-lg transition-colors duration-200`, className)}>
      {/* Document Header */}
      {documentTitle && (
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{documentTitle}</h2>
          </div>
          <div className="flex items-center gap-2">
            {onSave && (
              <Button
                onClick={handleSave}
                size="sm"
                variant="default"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
            <Button
              onClick={handleCopy}
              size="sm"
              variant="outline"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleExport('html')}
              size="sm"
              variant="outline"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center gap-1 p-3 border-b flex-wrap">
          <Button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            disabled={!editor?.can().chain().focus().toggleBold().run()}
            variant={editor?.isActive('bold') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            disabled={!editor?.can().chain().focus().toggleItalic().run()}
            variant={editor?.isActive('italic') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          <Button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            variant={editor?.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            variant={editor?.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            variant={editor?.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor?.chain().focus().setParagraph().run()}
            variant={editor?.isActive('paragraph') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Type className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          <Button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            variant={editor?.isActive('bulletList') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            variant={editor?.isActive('orderedList') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            variant={editor?.isActive('blockquote') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Quote className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          <Button
            onClick={() => editor?.chain().focus().toggleHighlight().run()}
            variant={editor?.isActive('highlight') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          <Button
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().chain().focus().undo().run()}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().chain().focus().redo().run()}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editor */}
      <div className="p-4">
        <EditorContent 
          editor={editor} 
          className={cn("min-h-[400px]", `min-h-[${minHeight}]`)}
        />
      </div>
    </div>
  );
}
