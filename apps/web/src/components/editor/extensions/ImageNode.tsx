import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Upload, 
  Link, 
  X,
  Edit2,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageAttributes {
  src: string;
  alt?: string;
  caption?: string;
  generationPrompt?: string;
  width?: number;
  height?: number;
  alignment?: 'left' | 'center' | 'right';
}

// Define the Image node
export const ImageNode = Node.create({
  name: 'slideImage',
  
  group: 'block',
  
  atom: true,
  
  addAttributes() {
    return {
      src: {
        default: '',
      },
      alt: {
        default: '',
      },
      caption: {
        default: '',
      },
      generationPrompt: {
        default: '',
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      alignment: {
        default: 'center',
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-type="slide-image"]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'slide-image' }, HTMLAttributes)];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

// React component for the node view
function ImageNodeView({ node, updateAttributes, deleteNode, selected }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    alt: node.attrs.alt || '',
    caption: node.attrs.caption || '',
  });
  
  const handleSave = () => {
    updateAttributes({
      alt: editData.alt,
      caption: editData.caption,
    });
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditData({
      alt: node.attrs.alt || '',
      caption: node.attrs.caption || '',
    });
    setIsEditing(false);
  };
  
  const alignmentClasses: Record<string, string> = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
  };
  
  return (
    <NodeViewWrapper 
      className={cn(
        "relative group my-4",
        alignmentClasses[node.attrs.alignment || 'center']
      )}
      style={{ maxWidth: node.attrs.width || '100%' }}
    >
      <div className={cn(
        "relative rounded-lg overflow-hidden",
        selected && "ring-2 ring-primary"
      )}>
        {/* Image Display */}
        {node.attrs.src ? (
          <>
            <img
              src={node.attrs.src}
              alt={node.attrs.alt || ''}
              className="w-full h-auto"
              style={{
                maxWidth: node.attrs.width || '100%',
                maxHeight: node.attrs.height || 'auto',
              }}
            />
            
            {/* Caption */}
            {node.attrs.caption && !isEditing && (
              <div className="mt-2 text-sm text-muted-foreground text-center">
                {node.attrs.caption}
              </div>
            )}
            
            {/* Hover Controls */}
            <div className={cn(
              "absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
              isEditing && "opacity-100"
            )}>
              {!isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsEditing(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={deleteNode}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSave}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCancel}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            {/* Edit Form */}
            {isEditing && (
              <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur p-4 border-t">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="alt-text" className="text-xs">Alt Text</Label>
                    <Input
                      id="alt-text"
                      value={editData.alt}
                      onChange={(e) => setEditData({ ...editData, alt: e.target.value })}
                      placeholder="Describe the image..."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="caption" className="text-xs">Caption</Label>
                    <Textarea
                      id="caption"
                      value={editData.caption}
                      onChange={(e) => setEditData({ ...editData, caption: e.target.value })}
                      placeholder="Add a caption..."
                      className="min-h-[60px] text-sm"
                    />
                  </div>
                  {node.attrs.generationPrompt && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Generated from:</span> {node.attrs.generationPrompt}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Placeholder when no image */
          <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border-2 border-dashed">
            <div className="text-center space-y-4">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No image added</p>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// Helper function to insert an image
export const insertImage = (editor: any, attributes: Partial<ImageAttributes>) => {
  editor
    .chain()
    .focus()
    .insertContent({
      type: 'slideImage',
      attrs: attributes,
    })
    .run();
};

// Helper function to insert an AI-generated image
export const insertGeneratedImage = (
  editor: any, 
  src: string, 
  prompt: string,
  alt?: string,
  caption?: string
) => {
  insertImage(editor, {
    src,
    generationPrompt: prompt,
    alt: alt || `AI generated image: ${prompt}`,
    caption,
  });
};
