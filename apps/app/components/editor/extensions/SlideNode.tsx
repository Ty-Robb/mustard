import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewContent } from '@tiptap/react';
import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { SlideLayout } from '@/types/presentation';
import type { Editor } from '@tiptap/core';

// Define the slide node extension
export const SlideNode = Node.create({
  name: 'slide',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      layout: {
        default: 'titleAndContent' as SlideLayout,
      },
      background: {
        default: null,
      },
      transition: {
        default: 'none',
      },
      slideNumber: {
        default: 1,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-slide]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-slide': '' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SlideComponent);
  },

  addCommands() {
    return {
      insertSlide: (attributes?: Record<string, any>) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'Slide Title' }],
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Slide content goes here...' }],
            },
          ],
        });
      },
    } as any;
  },
});

// React component for rendering slides
function SlideComponent({ node, updateAttributes, deleteNode, selected }: any) {
  const { layout, background, slideNumber } = node.attrs;

  const getLayoutClass = () => {
    switch (layout) {
      case 'title':
        return 'flex flex-col items-center justify-center text-center';
      case 'two-column':
        return 'grid grid-cols-2 gap-8';
      case 'image':
        return 'flex flex-col items-center';
      case 'quote':
        return 'flex flex-col items-center justify-center';
      default:
        return 'flex flex-col';
    }
  };

  return (
    <NodeViewWrapper
      className={cn(
        'slide-node relative mb-8 rounded-lg border-2 bg-background p-8',
        'min-h-[500px] shadow-lg',
        'border-dotted border-orange-500',
        selected && 'border-primary ring-2 ring-primary/20',
        !selected && 'border-orange-500'
      )}
      style={{
        background: background || undefined,
      }}
    >
      {/* Component label */}
      <div className="absolute top-0 left-0 bg-orange-500 text-white text-xs px-1 rounded-br z-10">
        SlideNode (TipTap)
      </div>
      {/* Slide number indicator */}
      <div className="absolute top-2 right-2 text-sm text-muted-foreground">
        Slide {slideNumber}
      </div>

      {/* Slide controls */}
      <div className="absolute top-2 left-2 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
        <select
          value={layout}
          onChange={(e) => updateAttributes({ layout: e.target.value })}
          className="text-xs px-2 py-1 rounded border bg-background"
        >
          <option value="title">Title Slide</option>
          <option value="titleAndContent">Title & Content</option>
          <option value="content">Content Only</option>
          <option value="two-column">Two Column</option>
          <option value="image">Image Focus</option>
          <option value="chart">Chart Focus</option>
          <option value="table">Table Focus</option>
          <option value="quote">Quote</option>
          <option value="blank">Blank</option>
        </select>
        
        <button
          onClick={deleteNode}
          className="text-xs px-2 py-1 rounded border bg-destructive/10 text-destructive hover:bg-destructive/20"
        >
          Delete
        </button>
      </div>

      {/* Slide content */}
      <div className={cn('slide-content h-full', getLayoutClass())}>
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
}

// Slide break for separating slides
export const SlideBreak = Node.create({
  name: 'slideBreak',
  group: 'block',
  
  parseHTML() {
    return [{ tag: 'hr[data-slide-break]' }];
  },

  renderHTML() {
    return ['hr', { 'data-slide-break': '', class: 'slide-break' }];
  },

  addCommands() {
    return {
      insertSlideBreak: () => ({ commands }: any) => {
        return commands.insertContent({ type: this.name });
      },
    } as any;
  },
});

// Helper function to insert a slide with AI
export function insertSlideFromAI(editor: any, layout: SlideLayout, content: any) {
  const slideContent = [];

  // Add content based on layout
  switch (layout) {
    case 'title':
      slideContent.push({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: content.title || 'Title' }],
      });
      if (content.subtitle) {
        slideContent.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: content.subtitle }],
        });
      }
      break;

    case 'two-column':
      slideContent.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: content.title || 'Title' }],
      });
      // For two columns, we'll need to handle this differently
      // For now, just add as paragraphs
      if (content.columns) {
        content.columns.forEach((col: any) => {
          slideContent.push({
            type: 'paragraph',
            content: [{ type: 'text', text: col.content }],
          });
        });
      }
      break;

    case 'quote':
      slideContent.push({
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: content.quote || 'Quote text' }],
          },
        ],
      });
      if (content.author) {
        slideContent.push({
          type: 'paragraph',
          content: [{ type: 'text', text: `— ${content.author}` }],
        });
      }
      break;

    default:
      // Standard content slide
      if (content.title) {
        slideContent.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: content.title }],
        });
      }
      if (content.body) {
        slideContent.push({
          type: 'paragraph',
          content: [{ type: 'text', text: content.body }],
        });
      }
      if (content.bulletPoints) {
        slideContent.push({
          type: 'bulletList',
          content: content.bulletPoints.map((point: string) => ({
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: point }],
              },
            ],
          })),
        });
      }
  }

  // Insert the slide
  editor.commands.insertContent({
    type: 'slide',
    attrs: { layout },
    content: slideContent,
  });

  // Add a slide break after
  editor.commands.insertSlideBreak();
}
